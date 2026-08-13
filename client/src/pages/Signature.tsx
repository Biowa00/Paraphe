import { useEffect, useState } from "react";
import { ouvrirEnveloppe, demanderTicketSignature, signer, ErreurApi } from "../api";
import { messageErreur } from "../messages";
import { libelleNiveau } from "../verdict";
import { PadSignature } from "../components/PadSignature";
import type { EnveloppeDetail, PointTrace, SignataireDetail } from "../types";

interface Props {
  enveloppeId: string;
  /** Signataire ciblé par le lien (sinon on propose de se choisir). */
  signataireId?: string;
}

type Phase =
  | { nom: "chargement" }
  | { nom: "introuvable"; message: string }
  | { nom: "cloture"; enveloppe: EnveloppeDetail }
  | { nom: "apercu"; enveloppe: EnveloppeDetail; signataire: SignataireDetail }
  | { nom: "signer"; enveloppe: EnveloppeDetail; signataire: SignataireDetail }
  | { nom: "termine"; scellee: boolean };

const STATUTS_CLOS = new Set(["scellee", "refusee", "expiree"]);

export function Signature({ enveloppeId, signataireId }: Props) {
  const [phase, setPhase] = useState<Phase>({ nom: "chargement" });
  const [traits, setTraits] = useState<PointTrace[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const env = await ouvrirEnveloppe(enveloppeId);
        if (!actif) return;
        if (STATUTS_CLOS.has(env.statut)) {
          setPhase({ nom: "cloture", enveloppe: env });
          return;
        }
        const cible = signataireId
          ? env.signataires.find((s) => s.id === signataireId)
          : undefined;
        if (cible && cible.statut !== "signee") {
          setPhase({ nom: "apercu", enveloppe: env, signataire: cible });
        } else {
          // Pas de signataire ciblé (ou déjà signé) : on laisse choisir.
          setPhase({ nom: "cloture", enveloppe: env });
        }
      } catch (e) {
        if (!actif) return;
        const code = e instanceof ErreurApi ? e.code : "erreur";
        setPhase({ nom: "introuvable", message: messageErreur(code) });
      }
    })();
    return () => {
      actif = false;
    };
  }, [enveloppeId, signataireId]);

  async function validerSignature(env: EnveloppeDetail, sig: SignataireDetail) {
    setErreur(null);
    if (traits.length === 0) {
      setErreur("Veuillez tracer votre signature avant de valider.");
      return;
    }
    setEnCours(true);
    try {
      // OTP frais obtenu à l'instant précis de la signature (I2).
      const otpTicket = await demanderTicketSignature();
      const r = await signer(env.id, {
        signataireId: sig.id,
        niveauVerifie: sig.niveauIdentiteExige,
        otpTicket,
        trace: { horodatageCapture: new Date().toISOString(), traits },
        acteur: sig.nomDeclare,
      });
      setPhase({ nom: "termine", scellee: r.statut === "scellee" });
    } catch (e) {
      const code = e instanceof ErreurApi ? e.code : "erreur";
      setErreur(messageErreur(code));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="page">
      <div className="marque">Paraphe</div>

      {phase.nom === "chargement" && <p className="note">Ouverture du document…</p>}

      {phase.nom === "introuvable" && (
        <section className="carte">
          <h1>Lien indisponible</h1>
          <p className="note">{phase.message}</p>
        </section>
      )}

      {phase.nom === "cloture" && <Cloture enveloppe={phase.enveloppe} />}

      {phase.nom === "apercu" && (
        <>
          <h1>Vous êtes invité à signer</h1>
          <p className="accroche">
            Signez ce document à distance, gratuitement, sans créer de compte. Votre signature est
            refaite à cet instant et ne sera jamais réutilisée.
          </p>
          <section className="carte">
            <p className="titre-section">Document à signer</p>
            <p className="note">
              Un aperçu du document s'affichera ici (lecture seule). En version de démonstration, le
              contenu n'est pas encore rendu à l'écran.
            </p>
            <ul className="signataires">
              <li>
                <span className="nom">{phase.signataire.nomDeclare}</span>
                <span className="badge-niveau">
                  Niveau {libelleNiveau(phase.signataire.niveauIdentiteExige)}
                </span>
              </li>
            </ul>
          </section>
          <button
            className="bouton"
            type="button"
            onClick={() =>
              setPhase({ nom: "signer", enveloppe: phase.enveloppe, signataire: phase.signataire })
            }
          >
            Commencer
          </button>
        </>
      )}

      {phase.nom === "signer" && (
        <>
          <h1>Votre signature</h1>
          <p className="accroche">
            Tracez votre signature ci-dessous. Un code de vérification à usage unique est demandé au
            moment de valider.
          </p>
          <section className="carte">
            <PadSignature onChange={setTraits} />
          </section>
          <p className="note note-demo">
            Démo : le code de vérification est validé automatiquement. L'envoi réel par WhatsApp/SMS
            viendra avec le fournisseur retenu.
          </p>
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
          <button
            className="bouton"
            type="button"
            disabled={enCours}
            onClick={() => validerSignature(phase.enveloppe, phase.signataire)}
          >
            {enCours ? "Signature en cours…" : "Valider et signer"}
          </button>
        </>
      )}

      {phase.nom === "termine" && (
        <section className={`verdict ok`}>
          <div className="entete">
            <span className="icone" aria-hidden="true">✓</span>
            <h2>{phase.scellee ? "Document signé et scellé" : "Signature enregistrée"}</h2>
          </div>
          <p>
            {phase.scellee
              ? "Toutes les signatures sont réunies : le document est scellé et son dossier de preuve a été créé."
              : "Votre signature est enregistrée. Le document sera scellé une fois que les autres signataires auront signé."}
          </p>
        </section>
      )}

      <p className="pied">Signer sur Paraphe est toujours gratuit.</p>
    </main>
  );
}

function Cloture({ enveloppe }: { enveloppe: EnveloppeDetail }) {
  const messages: Record<string, string> = {
    scellee: "Ce document est déjà scellé. Il n'y a plus rien à signer.",
    refusee: "Ce document a été refusé.",
    expiree: "Ce document a expiré.",
  };
  const message =
    messages[enveloppe.statut] ??
    "Ce lien ne permet pas de signer pour l'instant (tour non venu, ou signataire déjà traité).";
  return (
    <section className="carte">
      <h1>Rien à signer</h1>
      <p className="note">{message}</p>
    </section>
  );
}
