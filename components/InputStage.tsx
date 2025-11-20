import React, { useState } from 'react';
import { ThemeConfig, AnalysisResult, SpeechChunk } from '../types';
import { Icons } from './Icons';

interface InputStageProps {
  theme: ThemeConfig;
  onAnalysisComplete: (text: string, result: any) => void;
}

export const InputStage: React.FC<InputStageProps> = ({ theme, onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLocally = (inputText: string): AnalysisResult => {
    // 1. Clean and normalize text
    const cleanText = inputText.replace(/\s+/g, ' ').trim();
    
    // 2. Split into chunks
    // We split by sentence delimiters first, then by length
    const chunks: SpeechChunk[] = [];
    const rawSentences = cleanText.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [cleanText];

    rawSentences.forEach(sentence => {
      const words = sentence.trim().split(' ');
      const MAX_WORDS = 12; // Optimal for teleprompter readability
      
      if (words.length <= MAX_WORDS) {
        chunks.push(createChunk(sentence.trim()));
      } else {
        // Sub-chunk long sentences
        let currentWords: string[] = [];
        words.forEach(word => {
          currentWords.push(word);
          if (currentWords.length >= MAX_WORDS) {
            chunks.push(createChunk(currentWords.join(' ')));
            currentWords = [];
          }
        });
        if (currentWords.length > 0) {
          chunks.push(createChunk(currentWords.join(' ')));
        }
      }
    });

    const totalDurationSec = chunks.reduce((acc, c) => acc + (c.suggestedDurationMs / 1000), 0);
    const summary = chunks.slice(0, 3).map(c => c.text).join(' ') + (chunks.length > 3 ? '...' : '');

    return { chunks, totalDurationSec, summary };
  };

  const createChunk = (text: string): SpeechChunk => {
    const wordCount = text.split(' ').length;
    // Avg reading speed ~150 wpm -> ~2.5 words/sec
    const durationMs = Math.max(1500, (wordCount / 2.5) * 1000);
    return { text, suggestedDurationMs: durationMs };
  };

  const handleAnalyze = async () => {
    if (text.trim().length < 5) {
      setError("Please enter a longer speech.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    // Simulate a brief processing delay for UX
    setTimeout(() => {
      try {
        const result = analyzeLocally(text);
        onAnalysisComplete(text, result);
      } catch (err) {
        console.error(err);
        setError("Failed to process text.");
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className={`max-w-4xl mx-auto w-full ${theme.font} flex flex-col gap-8`}>
      <div className="space-y-2">
        <h1 className={`text-4xl md:text-6xl font-bold tracking-tighter ${theme.text}`}>
          Compose.
        </h1>
        <p className={`text-xl opacity-60 ${theme.text}`}>
          Enter your speech below. We'll format it for the teleprompter instantly.
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
          disabled={isProcessing || !text}
          className={`
            relative overflow-hidden px-8 py-4 rounded-full font-bold text-lg transition-all duration-300
            flex items-center gap-3
            ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1 hover:shadow-lg'}
            ${theme.text === 'text-slate-900 dark:text-slate-100' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-black'}
          `}
        >
          {isProcessing ? (
            <>
              <Icons.Wand2 className="animate-spin" size={20} />
              Processing...
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