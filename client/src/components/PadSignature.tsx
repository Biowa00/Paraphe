import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PointTrace } from "../types";

interface Props {
  /** Appelé à chaque évolution du tracé (points capturés). */
  onChange: (traits: PointTrace[]) => void;
}

/**
 * Zone de tracé de la signature. Le tracé est REFAIT à chaque signature (I1) :
 * ce composant ne pré-remplit jamais rien et n'a aucune mémoire persistante.
 * Il ne sert qu'à capturer un geste à l'instant présent.
 */
export function PadSignature({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dessine = useRef(false);
  const traits = useRef<PointTrace[]>([]);
  const [vide, setVide] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Adapte la résolution à l'écran (net sur mobile) sans dépendre du CSS.
    const ratio = window.devicePixelRatio || 1;
    const largeur = canvas.clientWidth;
    const hauteur = canvas.clientHeight;
    canvas.width = largeur * ratio;
    canvas.height = hauteur * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#16191d";
  }, []);

  function position(e: ReactPointerEvent<HTMLCanvasElement>): PointTrace {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      Math.round(e.clientX - rect.left),
      Math.round(e.clientY - rect.top),
    ];
  }

  function demarrer(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dessine.current = true;
    const p = position(e);
    traits.current.push(p);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
    ctx?.moveTo(p[0], p[1]);
  }

  function continuer(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!dessine.current) return;
    const p = position(e);
    traits.current.push(p);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.lineTo(p[0], p[1]);
    ctx?.stroke();
    if (vide) setVide(false);
    onChange(traits.current.slice());
  }

  function arreter() {
    dessine.current = false;
  }

  function effacer() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    traits.current = [];
    setVide(true);
    onChange([]);
  }

  return (
    <div className="pad">
      <canvas
        ref={canvasRef}
        className="pad-canvas"
        onPointerDown={demarrer}
        onPointerMove={continuer}
        onPointerUp={arreter}
        onPointerLeave={arreter}
        aria-label="Zone pour tracer votre signature"
      />
      <div className="pad-barre">
        <span className="pad-indice">{vide ? "Tracez votre signature ci-dessus" : " "}</span>
        <button type="button" className="lien" onClick={effacer} disabled={vide}>
          Effacer
        </button>
      </div>
    </div>
  );
}
