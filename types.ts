export enum AppStep {
  INPUT = 'INPUT',
  SETUP = 'SETUP',
  PROMPTER = 'PROMPTER',
  REVIEW = 'REVIEW'
}

export enum ThemeId {
  MINIMAL = 'minimal',
  PROFESSIONAL = 'professional',
  CREATIVE = 'creative',
  CONTRAST = 'contrast',
  NATURE = 'nature'
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  bg: string;
  text: string;
  accent: string;
  font: string;
  secondary: string;
  panel: string;
}

export interface SpeechChunk {
  text: string;
  suggestedDurationMs: number; // calculated by AI based on complexity
}

export interface AnalysisResult {
  chunks: SpeechChunk[];
  totalDurationSec: number;
  summary: string;
}
