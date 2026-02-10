import figureData from '@/data/ddia-figures.json';

interface FigureInfo {
  path: string;
  caption: string;
}

export type FigureRegistry = Record<string, FigureInfo>;

export const FIGURE_REGISTRY: FigureRegistry = figureData;

export function getFigure(id: string): FigureInfo | null {
  return FIGURE_REGISTRY[id] ?? null;
}
