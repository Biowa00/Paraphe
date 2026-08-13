import { useState } from "react";
import { demanderTicket, connexion, ErreurApi } from "../api";
import { messageErreur } from "../messages";

interface Props {
  onConnecte: () => void;
}

/**
 * Connexion émetteur : téléphone + code (OTP). En démonstration, le code est
 * validé automatiquement — l'envoi réel par WhatsApp/SMS viendra avec le
 * fournisseur retenu (décision n°4). L'OTP reste exigé à nouveau à chaque
 * signature (I2) : une session n'est jamais une preuve de signature.
 */
export function Connexion({ onConnecte }: Props) {
  const [telephone, setTelephone] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function seConnecter() {
    setErreur(null);
    const tel = telephone.trim();
    if (!tel) {
      setErreur("Saisissez votre numéro de téléphone.");
      return;
    }
    setEnCours(true);
    try {
      const ticket = await demanderTicket("connexion");
      await connexion(tel, ticket);
      onConnecte();
    } catch (e) {
      const code = e instanceof ErreurApi ? e.code : "erreur";
      setErreur(
        code === "connexion_refusee"
          ? "Aucun compte associé à ce numéro. Il faut d'abord un compte vérifié."
          : messageErreur(code),
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="page">
      <div className="marque">Paraphe</div>
      <h1>Espace émetteur</h1>
      <p className="accroche">
        Connectez-vous pour créer des enveloppes, les faire signer et gérer votre solde de crédits.
      </p>

      <div className="carte">
        <label className="libelle" htmlFor="tel">Numéro de téléphone</label>
        <input
          id="tel"
          type="text"
          inputMode="tel"
          placeholder="+229 …"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && seConnecter()}
        />
        <p className="note note-demo">
          Démo : le code de vérification est validé automatiquement. Le vrai envoi WhatsApp/SMS
          viendra avec le fournisseur retenu.
        </p>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button className="bouton" type="button" disabled={enCours} onClick={seConnecter}>
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </div>

      <p className="cta">Pas encore de compte vérifié ? L'inscription viendra bientôt à l'écran.</p>
    </main>
  );
}
