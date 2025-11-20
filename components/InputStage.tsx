import React, { useState } from 'react';
import { ThemeConfig } from '../types';
import { Icons } from './Icons';
import { analyzeSpeechText } from '../services/geminiService';

interface InputStageProps {
  theme: ThemeConfig;
  onAnalysisComplete: (text: string, result: any) => void;
}

export const InputStage: React.FC<InputStageProps> = ({ theme, onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (text.trim().length < 10) {
      setError("Please enter at least 10 characters.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeSpeechText(text);
      onAnalysisComplete(text, result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze text. Please check your API key or try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto w-full ${theme.font} flex flex-col gap-8`}>
      <div className="space-y-2">
        <h1 className={`text-4xl md:text-6xl font-bold tracking-tighter ${theme.text}`}>
          Compose.
        </h1>
        <p className={`text-xl opacity-60 ${theme.text}`}>
          Enter your speech below. AI will break it down for a natural flow.
        </p>
      </div>

      <div className={`relative group rounded-2xl overflow-hidden shadow-sm transition-all focus-within:shadow-xl focus-within:ring-2 ring-opacity-50 ${theme.panel} ring-current`}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ladies and gentlemen, today we stand at the precipice of a new era..."
          className={`w-full h-64 p-8 text-lg md:text-xl resize-none outline-none transition-colors ${theme.bg} ${theme.text} placeholder:opacity-30`}
        />
        <div className={`absolute bottom-4 right-4 text-xs opacity-40 ${theme.text}`}>
          {text.length} characters
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2">
          <Icons.CheckCircle2 className="rotate-45" size={20} />
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !text}
          className={`
            relative overflow-hidden px-8 py-4 rounded-full font-bold text-lg transition-all duration-300
            flex items-center gap-3
            ${isAnalyzing ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1 hover:shadow-lg'}
            ${theme.text === 'text-slate-900 dark:text-slate-100' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-black'}
          `}
        >
          {isAnalyzing ? (
            <>
              <Icons.Wand2 className="animate-spin" size={20} />
              Optimizing Flow...
            </>
          ) : (
            <>
              Next Step
              <Icons.ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
