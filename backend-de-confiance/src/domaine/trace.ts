export type PointTrace = readonly [number, number];

/**
 * Tracé de signature capturé à l'instant de la signature (I1).
 *
 * Il n'existe volontairement AUCUN type ni port permettant de récupérer un
 * tracé stocké pour le réapposer : le signataire retrace à chaque document.
 * Le tracé est toujours une entrée fournie au moment de signer, jamais une
 * ressource rechargée.
 */
export interface Trace {
  readonly horodatageCapture: string;
  readonly traits: readonly PointTrace[];
}
