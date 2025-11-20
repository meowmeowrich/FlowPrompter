import { ThemeId, ThemeConfig } from './types';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  [ThemeId.MINIMAL]: {
    id: ThemeId.MINIMAL,
    name: 'Minimalist',
    bg: 'bg-white dark:bg-neutral-900',
    text: 'text-neutral-900 dark:text-neutral-100',
    accent: 'text-neutral-500 dark:text-neutral-400',
    font: 'font-sans',
    secondary: 'bg-neutral-100 dark:bg-neutral-800',
    panel: 'border-neutral-200 dark:border-neutral-800'
  },
  [ThemeId.PROFESSIONAL]: {
    id: ThemeId.PROFESSIONAL,
    name: 'Executive',
    bg: 'bg-slate-50 dark:bg-slate-950',
    text: 'text-slate-900 dark:text-slate-100',
    accent: 'text-blue-600 dark:text-blue-400',
    font: 'font-serif',
    secondary: 'bg-slate-200 dark:bg-slate-900',
    panel: 'border-slate-300 dark:border-slate-800'
  },
  [ThemeId.CREATIVE]: {
    id: ThemeId.CREATIVE,
    name: 'Vibrant',
    bg: 'bg-rose-50 dark:bg-zinc-900',
    text: 'text-zinc-900 dark:text-rose-50',
    accent: 'text-rose-500 dark:text-rose-400',
    font: 'font-sans',
    secondary: 'bg-white dark:bg-zinc-800',
    panel: 'border-rose-200 dark:border-zinc-700'
  },
  [ThemeId.CONTRAST]: {
    id: ThemeId.CONTRAST,
    name: 'Cyber',
    bg: 'bg-yellow-50 dark:bg-black',
    text: 'text-black dark:text-yellow-400',
    accent: 'text-black dark:text-yellow-200',
    font: 'font-mono',
    secondary: 'bg-yellow-200 dark:bg-zinc-900',
    panel: 'border-black dark:border-yellow-600'
  },
  [ThemeId.NATURE]: {
    id: ThemeId.NATURE,
    name: 'Forest',
    bg: 'bg-stone-50 dark:bg-stone-950',
    text: 'text-stone-800 dark:text-stone-100',
    accent: 'text-emerald-600 dark:text-emerald-500',
    font: 'font-sans',
    secondary: 'bg-stone-200 dark:bg-stone-900',
    panel: 'border-emerald-200 dark:border-stone-800'
  }
};
