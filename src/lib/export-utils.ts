import { buildSvgMarkup } from "@/lib/svg-utils";
import { EditorState } from "@/lib/editor-state";

export function exportSvg(state: EditorState, filename = "icon.svg") {
  const svg = buildSvgMarkup(state);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  downloadBlob(blob, filename);
}

export function copySvg(state: EditorState): Promise<void> {
  const svg = buildSvgMarkup(state);
  return navigator.clipboard.writeText(svg);
}

export function exportRaster(state: EditorState, format: "png" | "jpeg", filename: string) {
  const svg = buildSvgMarkup(state);
  const canvas = document.createElement("canvas");
  const size = state.canvasSize * 2; // 2x for retina
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const img = new Image();
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);
    canvas.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, filename);
      },
      `image/${format}`,
      0.95
    );
  };
  img.src = url;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
