import { useRef, useCallback } from "react";
import { buildSvgMarkup } from "@/lib/svg-utils";
import { EditorState } from "@/lib/editor-state";

interface IconCanvasProps {
  state: EditorState;
  onDrag: (dx: number, dy: number) => void;
}

const IconCanvas = ({ state, onDrag }: IconCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const snap = (v: number) => {
    if (!state.snapToGrid) return v;
    return Math.round(v / state.gridSize) * state.gridSize;
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleFactor = state.canvasSize / rect.width;
      let dx = (e.clientX - lastPos.current.x) * scaleFactor;
      let dy = (e.clientY - lastPos.current.y) * scaleFactor;
      if (state.snapToGrid) {
        dx = snap(dx);
        dy = snap(dy);
      }
      lastPos.current = { x: e.clientX, y: e.clientY };
      if (dx !== 0 || dy !== 0) onDrag(dx, dy);
    },
    [onDrag, state.canvasSize, state.snapToGrid, state.gridSize]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const svgMarkup = buildSvgMarkup(state);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-[0.2em]">
        Live Preview
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing transition-shadow duration-300 hover:shadow-lg"
        style={{
          width: "min(100%, 360px)",
          aspectRatio: "1",
          boxShadow: `0 8px 40px ${state.bgColor}25`,
          borderRadius: state.bgShape === "circle" ? "50%" : state.bgShape === "square" ? "0" : "1rem",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-display">
        <span>Drag to move</span>
        <span>•</span>
        <span>Offset: {Math.round(state.offsetX)}, {Math.round(state.offsetY)}</span>
        <span>•</span>
        <span>{state.rotation}°</span>
      </div>
    </div>
  );
};

export default IconCanvas;
