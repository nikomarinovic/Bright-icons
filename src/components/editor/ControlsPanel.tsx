import { useRef, useState } from "react";
import { parseSvgInput, fileToBase64 } from "@/lib/svg-utils";
import { EditorState, BgShape, BgPattern } from "@/lib/editor-state";
import IconPicker from "./IconPicker";
import {
  Circle, Square, Hexagon, Diamond, Star, RectangleHorizontal,
  Grid3X3, RotateCw, Move, Palette, Upload, Type
} from "lucide-react";

interface ControlsPanelProps {
  state: EditorState;
  onChange: (partial: Partial<EditorState>) => void;
}

const COLOR_PALETTE = [
  // Reds
  "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#7f1d1d",
  // Oranges
  "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#7c2d12",
  // Yellows
  "#fde047", "#facc15", "#eab308", "#ca8a04", "#a16207", "#713f12",
  // Greens
  "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#14532d", "#238636",
  // Teals
  "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#134e4a",
  // Blues
  "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a8a", "#1f6feb",
  // Purples
  "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#4c1d95",
  // Pinks
  "#f9a8d4", "#f472b6", "#ec4899", "#db2777", "#be185d", "#831843",
  // Neutrals
  "#f5f5f5", "#d4d4d4", "#9ca3af", "#6b7280", "#4b5563", "#374151",
  "#1f2937", "#111827", "#0d1117", "#171717", "#000000",
  // Brand
  "#e34f26", "#3178c6", "#f7df1e", "#61dafb", "#ff6b6b",
];

const BG_SHAPES: { value: BgShape; label: string; Icon: typeof Circle }[] = [
  { value: "rounded", label: "Rounded", Icon: RectangleHorizontal },
  { value: "circle", label: "Circle", Icon: Circle },
  { value: "square", label: "Square", Icon: Square },
  { value: "hexagon", label: "Hexagon", Icon: Hexagon },
  { value: "diamond", label: "Diamond", Icon: Diamond },
  { value: "star", label: "Star", Icon: Star },
];

const BG_PATTERNS: { value: BgPattern; label: string }[] = [
  { value: "none", label: "None" },
  { value: "dots", label: "Dots" },
  { value: "grid", label: "Grid" },
  { value: "diagonal", label: "Lines" },
  { value: "crosshatch", label: "Cross" },
];

const ICON_COLORS = [
  null, "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1",
];

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
    {children}
  </h3>
);

const ControlsPanel = ({ state, onChange }: ControlsPanelProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [svgText, setSvgText] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "image/svg+xml") {
      const text = await file.text();
      const parsed = parseSvgInput(text);
      onChange({ iconContent: parsed, iconType: "svg", offsetX: 0, offsetY: 0 });
    } else {
      const base64 = await fileToBase64(file);
      onChange({ iconContent: base64, iconType: "raster", offsetX: 0, offsetY: 0 });
    }
  };

  const handlePaste = () => {
    if (!svgText.trim()) return;
    const parsed = parseSvgInput(svgText);
    onChange({ iconContent: parsed, iconType: "svg", offsetX: 0, offsetY: 0 });
    setPasteMode(false);
    setSvgText("");
  };

  const handleIconPick = (svgContent: string) => {
    onChange({ iconContent: svgContent, iconType: "svg", offsetX: 0, offsetY: 0 });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Background Color ── */}
      <section>
        <SectionHeader>
          <span className="inline-flex items-center gap-1.5"><Palette size={12} /> Background Color</span>
        </SectionHeader>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded-md transition-all duration-150 hover:scale-125 ring-offset-1 ring-offset-card"
              style={{
                backgroundColor: c,
                boxShadow: state.bgColor === c ? `0 0 0 2px hsl(var(--primary))` : "none",
              }}
              onClick={() => onChange({ bgColor: c })}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={state.bgColor}
            onChange={(e) => onChange({ bgColor: e.target.value })}
            className="w-8 h-8 rounded-md cursor-pointer border-0 bg-transparent"
          />
          <input
            type="text"
            value={state.bgColor}
            onChange={(e) => onChange({ bgColor: e.target.value })}
            className="flex-1 px-3 py-1.5 rounded-md bg-secondary text-foreground font-display text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </section>

      {/* ── Background Shape ── */}
      <section>
        <SectionHeader>Background Shape</SectionHeader>
        <div className="grid grid-cols-6 gap-1.5">
          {BG_SHAPES.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ bgShape: value })}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] font-display transition-all duration-150 active:scale-90 ${
                state.bgShape === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </section>

      {/* ── Background Pattern ── */}
      <section>
        <SectionHeader>Background Pattern</SectionHeader>
        <div className="grid grid-cols-5 gap-1.5">
          {BG_PATTERNS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ bgPattern: value })}
              className={`px-2 py-2 rounded-lg text-[11px] font-display font-medium transition-all duration-150 active:scale-90 ${
                state.bgPattern === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── Icon Source ── */}
      <section>
        <SectionHeader>
          <span className="inline-flex items-center gap-1.5"><Upload size={12} /> Icon</span>
        </SectionHeader>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-display font-medium text-xs hover:bg-muted transition-all duration-200 active:scale-95"
            >
              Upload File
            </button>
            <button
              onClick={() => setPasteMode(!pasteMode)}
              className={`flex-1 px-3 py-2 rounded-lg font-display font-medium text-xs transition-all duration-200 active:scale-95 ${
                pasteMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              Paste SVG
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg"
            onChange={handleFile}
            className="hidden"
          />
          {pasteMode && (
            <div className="flex flex-col gap-2 animate-fade-up">
              <textarea
                value={svgText}
                onChange={(e) => setSvgText(e.target.value)}
                placeholder="<svg>...</svg>"
                className="w-full h-24 px-3 py-2 rounded-lg bg-secondary text-foreground font-display text-xs border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handlePaste}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display font-medium text-xs hover:opacity-90 transition-all active:scale-95"
              >
                Apply SVG
              </button>
            </div>
          )}
          <IconPicker onSelect={handleIconPick} />
        </div>
      </section>

      {/* ── Icon Color ── */}
      <section>
        <SectionHeader>
          <span className="inline-flex items-center gap-1.5"><Type size={12} /> Icon Color</span>
        </SectionHeader>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {ICON_COLORS.map((c, i) => (
            <button
              key={i}
              className="w-6 h-6 rounded-md transition-all duration-150 hover:scale-125 ring-offset-1 ring-offset-card flex items-center justify-center text-[8px]"
              style={{
                backgroundColor: c || "transparent",
                border: c === null ? "1px dashed hsl(var(--border))" : "none",
                boxShadow: state.iconColor === c ? `0 0 0 2px hsl(var(--primary))` : "none",
              }}
              onClick={() => onChange({ iconColor: c })}
              title={c === null ? "Original" : c}
            >
              {c === null && <span className="text-muted-foreground">⊘</span>}
            </button>
          ))}
        </div>
        {state.iconColor !== null && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.iconColor || "#ffffff"}
              onChange={(e) => onChange({ iconColor: e.target.value })}
              className="w-8 h-8 rounded-md cursor-pointer border-0 bg-transparent"
            />
            <span className="text-xs text-muted-foreground font-display">{state.iconColor}</span>
          </div>
        )}
      </section>

      <div className="border-t border-border" />

      {/* ── Scale ── */}
      <section>
        <SectionHeader>Scale — {Math.round(state.scale * 100)}%</SectionHeader>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.05"
          value={state.scale}
          onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
      </section>

      {/* ── Rotation ── */}
      <section>
        <SectionHeader>
          <span className="inline-flex items-center gap-1.5"><RotateCw size={12} /> Rotation — {state.rotation}°</span>
        </SectionHeader>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={state.rotation}
          onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex gap-1.5 mt-2">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <button
              key={deg}
              onClick={() => onChange({ rotation: deg })}
              className={`flex-1 py-1 rounded text-[10px] font-display transition-all active:scale-90 ${
                state.rotation === deg
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </section>

      {/* ── Snap to Grid ── */}
      <section>
        <SectionHeader>
          <span className="inline-flex items-center gap-1.5"><Grid3X3 size={12} /> Snap to Grid</span>
        </SectionHeader>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ snapToGrid: !state.snapToGrid })}
            className={`px-4 py-2 rounded-lg font-display font-medium text-xs transition-all active:scale-95 ${
              state.snapToGrid
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            }`}
          >
            {state.snapToGrid ? "On" : "Off"}
          </button>
          {state.snapToGrid && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-muted-foreground font-display">Size:</span>
              <input
                type="range"
                min="4"
                max="64"
                step="4"
                value={state.gridSize}
                onChange={(e) => onChange({ gridSize: parseInt(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-foreground font-display w-6">{state.gridSize}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Reset ── */}
      <button
        onClick={() => onChange({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 })}
        className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-display font-medium text-xs hover:bg-muted transition-all duration-200 active:scale-95"
      >
        <span className="inline-flex items-center gap-1.5"><Move size={12} /> Reset Position & Transform</span>
      </button>
    </div>
  );
};

export default ControlsPanel;
