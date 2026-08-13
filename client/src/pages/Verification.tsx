import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { verifier, fichierEnBase64 } from "../api";
import { verdictDe, libelleNiveau, formaterDate } from "../verdict";
import type { RapportVerification } from "../types";

interface Props {
  /** Référence lue sur le cachet (arrivée via /v/XXXX) : vérification directe. */
  refInitiale?: string;
}

type Etat =
  | { phase: "saisie" }
  | { phase: "chargement" }
  | { phase: "resultat"; rapport: RapportVerification }
  | { phase: "erreur"; message: string };

export function Verification({ refInitiale }: Props) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [reference, setReference] = useState(refInitiale ?? "");
  const [etat, setEtat] = useState<Etat>({ phase: "saisie" });

  async function lancer(entree: { documentBase64?: string; enveloppeRef?: string }) {
    setEtat({ phase: "chargement" });
    try {
      const rapport = await verifier(entree);
      setEtat({ phase: "resultat", rapport });
    } catch (e) {
      setEtat({ phase: "erreur", message: (e as Error).message });
    }
  }

  // Arrivée via /v/XXXX : on vérifie la référence immédiatement.
  useEffect(() => {
    if (refInitiale) void lancer({ enveloppeRef: refInitiale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refInitiale]);

  function choisirFichier(e: ChangeEvent<HTMLInputElement>) {
    setFichier(e.target.files?.[0] ?? null);
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    const ref = reference.trim();
    if (!fichier && !ref) {
      setEtat({ phase: "erreur", message: "Déposez un document ou saisissez une référence." });
      return;
    }
    const entree: { documentBase64?: string; enveloppeRef?: string } = {};
    if (ref) entree.enveloppeRef = ref;
    if (fichier) entree.documentBase64 = await fichierEnBase64(fichier);
    await lancer(entree);
  }

  function recommencer() {
    setFichier(null);
    setReference("");
    setEtat({ phase: "saisie" });
  }

  return (
    <main className="page">
      <div className="marque">Paraphe</div>
      <h1>Vérifier un document</h1>
      <p className="accroche">
        Déposez un document signé sur Paraphe : nous vérifions qu'il est authentique et qu'il n'a
        pas été modifié. Sans compte, gratuitement.
      </p>

      {etat.phase === "resultat" ? (
        <Resultat rapport={etat.rapport} onRecommencer={recommencer} />
      ) : (
        <form className="carte" onSubmit={soumettre}>
          <label className="champ-fichier">
            <input type="file" accept="application/pdf" onChange={choisirFichier} />
            {fichier ? (
              <span className="nom-fichier">{fichier.name}</span>
            ) : (
              <>
                <span className="nom-fichier">Déposer un document</span>
                <span className="indice">PDF — il ne quitte pas votre appareil, seul son sceau est vérifié</span>
              </>
            )}
          </label>

          <div className="separateur">ou</div>

          <label className="libelle" htmlFor="reference">
            Référence lue sur le cachet
          </label>
          <input
            id="reference"
            type="text"
            inputMode="text"
            placeholder="ex. l'identifiant sur le cachet du PDF"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />

          <button className="bouton" type="submit" disabled={etat.phase === "chargement"}>
            {etat.phase === "chargement" ? "Vérification…" : "Vérifier"}
          </button>

          {etat.phase === "erreur" && <p className="erreur" role="alert">{etat.message}</p>}
        </form>
      )}

      <p className="pied">
        Paraphe — signature électronique avancée &amp; archivage à valeur probante.
      </p>
    </main>
  );
}

function Resultat({
  rapport,
  onRecommencer,
}: {
  rapport: RapportVerification;
  onRecommencer: () => void;
}) {
  const v = verdictDe(rapport);
  const signataires = rapport.signataires ?? [];

  return (
    <>
      <section className={`verdict ${v.ton}`} aria-live="polite">
        <div className="entete">
          <span className="icone" aria-hidden="true">{v.icone}</span>
          <h2>{v.titre}</h2>
        </div>
        <p>{v.message}</p>
      </section>

      {signataires.length > 0 && (
        <section className="carte">
          <p className="titre-section">Signataires</p>
          <ul className="signataires">
            {signataires.map((s, i) => (
              <li key={i}>
                <span className="nom">{s.nom}</span>
                <span className="badge-niveau">Niveau {libelleNiveau(s.niveau)}</span>
                <span className="date">Signé le {formaterDate(s.dateSignature)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(rapport.dateScellement || rapport.contenu === "efface") && (
        <section className="carte">
          {rapport.dateScellement && (
            <p className="note">Scellé le {formaterDate(rapport.dateScellement)}.</p>
          )}
          {rapport.contenu === "efface" && (
            <p className="note">
              Le contenu a été effacé (clé détruite) ; l'intégrité et les signataires restent
              vérifiables.
            </p>
          )}
        </section>
      )}

      <button className="bouton" type="button" onClick={onRecommencer}>
        Vérifier un autre document
      </button>

      <p className="cta">Vous aussi, faites signer et sceller vos documents avec Paraphe.</p>
    </>
  );
}
