import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
  creerEnveloppe,
  envoyer,
  ouvrirEnveloppe,
  lireSolde,
  listerPacks,
  acheter,
  simulerPaiement,
  fichierEnBase64,
  ErreurApi,
} from "../api";
import { messageErreur } from "../messages";
import { libelleNiveau } from "../verdict";
import { lireSession, effacerSession } from "../session";
import type { NiveauIdentite, Pack, SignataireACreer } from "../types";

interface Props {
  onDeconnecte: () => void;
}

interface LigneSignataire {
  nomDeclare: string;
  telephone: string;
  niveauIdentiteExige: NiveauIdentite;
}

interface Envoyee {
  id: string;
  liens: { nom: string; url: string }[];
}

const NIVEAUX: NiveauIdentite[] = ["otp_seul", "standard", "renforce"];

export function Emettre({ onDeconnecte }: Props) {
  const session = lireSession();
  const [solde, setSolde] = useState<number | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);

  const [titre, setTitre] = useState("");
  const [mode, setMode] = useState<"sequentiel" | "parallele">("sequentiel");
  const [lignes, setLignes] = useState<LigneSignataire[]>([
    { nomDeclare: "", telephone: "", niveauIdentiteExige: "standard" },
  ]);
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoyee, setEnvoyee] = useState<Envoyee | null>(null);

  // Recharge
  const [paiement, setPaiement] = useState<{ reference: string; instructions: string } | null>(null);

  function gererErreur(e: unknown) {
    const code = e instanceof ErreurApi ? e.code : "erreur";
    if (code === "session_requise" || code === "session_invalide") {
      effacerSession();
      onDeconnecte();
      return;
    }
    setErreur(
      code === "credits_insuffisants"
        ? "Solde de crédits insuffisant. Rechargez votre solde ci-dessous."
        : code === "emission_reservee_verifie"
          ? "Seul un compte vérifié peut émettre."
          : messageErreur(code),
    );
  }

  async function rafraichir() {
    try {
      setSolde((await lireSolde()).solde);
    } catch (e) {
      gererErreur(e);
    }
  }

  useEffect(() => {
    void rafraichir();
    listerPacks().then(setPacks).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function majLigne(i: number, champ: keyof LigneSignataire, valeur: string) {
    setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, [champ]: valeur } : l)));
  }
  function ajouterLigne() {
    setLignes((ls) => [...ls, { nomDeclare: "", telephone: "", niveauIdentiteExige: "standard" }]);
  }
  function retirerLigne(i: number) {
    setLignes((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls));
  }
  function choisirFichier(e: ChangeEvent<HTMLInputElement>) {
    setFichier(e.target.files?.[0] ?? null);
  }

  async function creerEtEnvoyer() {
    setErreur(null);
    setEnvoyee(null);
    const sigs = lignes.filter((l) => l.nomDeclare.trim() && l.telephone.trim());
    if (!titre.trim()) return setErreur("Donnez un titre au document.");
    if (sigs.length === 0) return setErreur("Ajoutez au moins un signataire (nom + téléphone).");
    if (!fichier) return setErreur("Déposez le document à faire signer.");

    setEnCours(true);
    try {
      const signataires: SignataireACreer[] = sigs.map((l, i) => ({
        nomDeclare: l.nomDeclare.trim(),
        telephone: l.telephone.trim(),
        ordre: i + 1,
        niveauIdentiteExige: l.niveauIdentiteExige,
      }));
      const { id } = await creerEnveloppe({ titre: titre.trim(), mode, signataires });
      const documentBase64 = await fichierEnBase64(fichier);
      await envoyer(id, documentBase64, session?.utilisateur.id ?? "emetteur");

      const detail = await ouvrirEnveloppe(id);
      const origine = window.location.origin;
      const liens = detail.signataires.map((s) => ({
        nom: s.nomDeclare,
        url: `${origine}/signer/${id}/${s.id}`,
      }));
      setEnvoyee({ id, liens });
      setTitre("");
      setFichier(null);
      setLignes([{ nomDeclare: "", telephone: "", niveauIdentiteExige: "standard" }]);
      await rafraichir();
    } catch (e) {
      gererErreur(e);
    } finally {
      setEnCours(false);
    }
  }

  async function lancerAchat(packId: string) {
    setErreur(null);
    try {
      const r = await acheter(packId, session?.utilisateur.identifiantPublic ?? "+229");
      setPaiement({ reference: r.transactionId, instructions: r.instructionsPaiement });
    } catch (e) {
      gererErreur(e);
    }
  }
  async function confirmerAchat() {
    if (!paiement) return;
    try {
      await simulerPaiement(paiement.reference);
      setPaiement(null);
      await rafraichir();
    } catch (e) {
      gererErreur(e);
    }
  }

  function copier(url: string) {
    void navigator.clipboard?.writeText(url);
  }

  return (
    <main className="page">
      <div className="entete-emetteur">
        <div className="marque">Paraphe</div>
        <button className="lien" type="button" onClick={() => { effacerSession(); onDeconnecte(); }}>
          Se déconnecter
        </button>
      </div>

      <h1>Émettre un document</h1>
      <p className="accroche">
        Solde : <strong>{solde === null ? "…" : `${solde} crédit${solde > 1 ? "s" : ""}`}</strong>{" "}
        — un crédit est consommé à chaque envoi. Signer reste toujours gratuit pour vos destinataires.
      </p>

      {envoyee ? (
        <section className="carte">
          <p className="titre-section">Enveloppe envoyée ✓</p>
          <p className="note">
            Partagez à chaque signataire son lien personnel (WhatsApp/SMS le feront automatiquement
            en production) :
          </p>
          <ul className="liens-signataires">
            {envoyee.liens.map((l, i) => (
              <li key={i}>
                <span className="nom">{l.nom}</span>
                <code className="lien-url">{l.url}</code>
                <button className="lien" type="button" onClick={() => copier(l.url)}>Copier</button>
              </li>
            ))}
          </ul>
          <p className="note">Référence de vérification publique : <code>{envoyee.id}</code></p>
          <button className="bouton" type="button" onClick={() => setEnvoyee(null)}>
            Émettre une autre enveloppe
          </button>
        </section>
      ) : (
        <section className="carte">
          <label className="libelle" htmlFor="titre">Titre du document</label>
          <input id="titre" type="text" value={titre} placeholder="ex. Contrat de bail"
            onChange={(e) => setTitre(e.target.value)} />

          <label className="libelle" style={{ marginTop: 16 }}>Ordre de signature</label>
          <div className="choix-mode">
            <label>
              <input type="radio" name="mode" checked={mode === "sequentiel"} onChange={() => setMode("sequentiel")} />{" "}
              L'un après l'autre
            </label>
            <label>
              <input type="radio" name="mode" checked={mode === "parallele"} onChange={() => setMode("parallele")} />{" "}
              En même temps
            </label>
          </div>

          <p className="titre-section" style={{ marginTop: 16 }}>Signataires</p>
          {lignes.map((l, i) => (
            <div className="ligne-signataire" key={i}>
              <input type="text" placeholder="Nom" value={l.nomDeclare}
                onChange={(e) => majLigne(i, "nomDeclare", e.target.value)} />
              <input type="text" inputMode="tel" placeholder="+229 …" value={l.telephone}
                onChange={(e) => majLigne(i, "telephone", e.target.value)} />
              <select value={l.niveauIdentiteExige}
                onChange={(e) => majLigne(i, "niveauIdentiteExige", e.target.value)}>
                {NIVEAUX.map((n) => <option key={n} value={n}>{libelleNiveau(n)}</option>)}
              </select>
              <button className="lien" type="button" onClick={() => retirerLigne(i)}
                disabled={lignes.length === 1} aria-label="Retirer">✕</button>
            </div>
          ))}
          <button className="lien" type="button" onClick={ajouterLigne}>+ Ajouter un signataire</button>

          <label className="champ-fichier" style={{ marginTop: 16 }}>
            <input type="file" accept="application/pdf" onChange={choisirFichier} />
            <span className="nom-fichier">{fichier ? fichier.name : "Déposer le document (PDF)"}</span>
            <span className="indice">Il sera scellé après signature ; son empreinte est figée à l'envoi.</span>
          </label>

          {erreur && <p className="erreur" role="alert">{erreur}</p>}
          <button className="bouton" type="button" disabled={enCours} onClick={creerEtEnvoyer}>
            {enCours ? "Envoi…" : "Créer et envoyer (1 crédit)"}
          </button>
        </section>
      )}

      {/* Recharge */}
      <section className="carte">
        <p className="titre-section">Recharger mon solde</p>
        {paiement ? (
          <>
            <p className="note note-demo">{paiement.instructions}</p>
            <button className="bouton" type="button" onClick={confirmerAchat}>J'ai payé (simuler)</button>
          </>
        ) : (
          <div className="packs">
            {packs.map((p) => (
              <button key={p.packId} className="pack" type="button" onClick={() => lancerAchat(p.packId)}>
                <span className="pack-qte">{p.quantite} crédits</span>
                <span className="pack-prix">{p.prix.toLocaleString("fr-FR")} {p.devise}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
