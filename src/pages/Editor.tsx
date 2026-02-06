import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { createInitialState, EditorState } from "@/lib/editor-state";
import IconCanvas from "@/components/editor/IconCanvas";
import ControlsPanel from "@/components/editor/ControlsPanel";
import ExportBar from "@/components/editor/ExportBar";

const Editor = () => {
  const [state, setState] = useState<EditorState>(createInitialState);

  const handleChange = useCallback((partial: Partial<EditorState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleDrag = useCallback((dx: number, dy: number) => {
    setState((prev) => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy,
    }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
        >
          <svg viewBox="0 0 32 32" className="w-7 h-7">
            <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
            <path d="M8 12h16M8 16h12M8 20h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          IconForge
        </Link>
        <ExportBar state={state} />
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Controls */}
        <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border p-6 overflow-y-auto max-h-[50vh] lg:max-h-none">
          <ControlsPanel state={state} onChange={handleChange} />
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex items-center justify-center p-8">
          <IconCanvas state={state} onDrag={handleDrag} />
        </main>
      </div>
    </div>
  );
};

export default Editor;
