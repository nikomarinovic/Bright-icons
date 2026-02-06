import { EditorState } from "@/lib/editor-state";
import { exportSvg, exportRaster, copySvg } from "@/lib/export-utils";
import { useState } from "react";

interface ExportBarProps {
  state: EditorState;
}

const ExportBar = ({ state }: ExportBarProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copySvg(state);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buttons = [
    { label: "SVG", action: () => exportSvg(state) },
    { label: "PNG", action: () => exportRaster(state, "png", "icon.png") },
    { label: "JPG", action: () => exportRaster(state, "jpeg", "icon.jpg") },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((b) => (
        <button
          key={b.label}
          onClick={b.action}
          className="px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-display font-medium text-sm hover:bg-muted transition-all duration-200 active:scale-95"
        >
          ↓ {b.label}
        </button>
      ))}
      <button
        onClick={handleCopy}
        className="px-5 py-2.5 rounded-lg font-display font-medium text-sm transition-all duration-200 active:scale-95"
        style={{
          background: copied ? "hsl(var(--primary))" : "hsl(var(--secondary))",
          color: copied ? "hsl(var(--primary-foreground))" : "hsl(var(--secondary-foreground))",
        }}
      >
        {copied ? "✓ Copied!" : "Copy SVG"}
      </button>
    </div>
  );
};

export default ExportBar;
