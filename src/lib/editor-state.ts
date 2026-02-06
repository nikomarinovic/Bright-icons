export type BgShape = "rounded" | "circle" | "square" | "hexagon" | "diamond" | "star";
export type BgPattern = "none" | "dots" | "grid" | "diagonal" | "crosshatch";

export interface EditorState {
  bgColor: string;
  bgShape: BgShape;
  bgPattern: BgPattern;
  iconContent: string | null;
  iconType: "svg" | "raster" | null;
  iconColor: string | null;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  canvasSize: number;
  snapToGrid: boolean;
  gridSize: number;
}

export const createInitialState = (): EditorState => ({
  bgColor: "#238636",
  bgShape: "rounded",
  bgPattern: "none",
  iconContent: null,
  iconType: null,
  iconColor: null,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  canvasSize: 256,
  snapToGrid: false,
  gridSize: 16,
});
