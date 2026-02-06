import { useState, useMemo } from "react";
import { icons, type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Deduplicate icons (lucide exports many aliases per icon)
const seen = new Set<unknown>();
const ICON_ENTRIES: [string, LucideIcon][] = [];
for (const [name, component] of Object.entries(icons)) {
  if (name.endsWith("Icon") || name.startsWith("Lucide")) continue;
  if (seen.has(component)) continue;
  seen.add(component);
  ICON_ENTRIES.push([name, component as LucideIcon]);
}
ICON_ENTRIES.sort((a, b) => a[0].localeCompare(b[0]));

// Convert PascalCase to readable
function toReadable(name: string): string {
  return name.replace(/([A-Z])/g, " $1").trim();
}

interface IconPickerProps {
  onSelect: (svgContent: string) => void;
}

const DISPLAY_LIMIT = 120;

const IconPicker = ({ onSelect }: IconPickerProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? ICON_ENTRIES.filter(([n]) => toReadable(n).toLowerCase().includes(q))
      : ICON_ENTRIES;
    return list.slice(0, DISPLAY_LIMIT);
  }, [search]);

  const handleSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    const svg = e.currentTarget.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "100%");
    clone.setAttribute("height", "100%");
    clone.removeAttribute("class");
    onSelect(clone.outerHTML);
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-all duration-200 active:scale-95">
          Browse {ICON_ENTRIES.length}+ Icons
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">
            Icon Library — {ICON_ENTRIES.length} icons
          </DialogTitle>
        </DialogHeader>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons… (e.g. arrow, star, user)"
          className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground font-display text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <div className="text-xs text-muted-foreground">
          Showing {filtered.length} of {search ? `${ICON_ENTRIES.filter(([n]) => toReadable(n).toLowerCase().includes(search.toLowerCase())).length} matches` : `${ICON_ENTRIES.length} total`}
        </div>
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 overflow-y-auto flex-1 pr-1">
          {filtered.map(([name, Icon]) => (
            <button
              key={name}
              onClick={handleSelect}
              className="aspect-square rounded-lg bg-secondary hover:bg-muted transition-all duration-150 flex items-center justify-center hover:scale-110 active:scale-95 group relative"
              title={toReadable(name)}
            >
              <Icon size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconPicker;
