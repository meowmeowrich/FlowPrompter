import React, { useRef, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { Icons } from './Icons';

interface ReviewStageProps {
  theme: ThemeConfig;
  recordedBlob: Blob | null;
  onRetry: () => void;
  onNew: () => void;
}

export const ReviewStage: React.FC<ReviewStageProps> = ({ theme, recordedBlob, onRetry, onNew }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [recordedBlob]);

  const handleDownload = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `speech-recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`max-w-4xl mx-auto w-full ${theme.font} flex flex-col gap-8 animate-in fade-in duration-700`}>
       <div className="text-center space-y-2">
        <h1 className={`text-4xl font-bold ${theme.text}`}>
          Recording Complete.
        </h1>
        <p className={`text-lg opacity-60 ${theme.text}`}>
          Listen to your session.
        </p>
      </div>

      <div className={`w-full p-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-8 ${theme.secondary}`}>
        
        <div className={`p-8 rounded-full ${theme.bg} shadow-inner`}>
            <Icons.Mic size={64} className={`${theme.accent}`} />
        </div>
        
        <audio 
          ref={audioRef} 
          controls 
          className="w-full max-w-md"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button
          onClick={onRetry}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all ${theme.text} ${theme.panel} hover:bg-black/5 dark:hover:bg-white/5`}
        >
          <Icons.RotateCcw size={20} />
          Retry
        </button>

        <button
          onClick={handleDownload}
          className={`
            flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-all
            ${theme.text === 'text-slate-900 dark:text-slate-100' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-black'}
          `}
        >
          <Icons.Video size={20} />
          Download Audio
        </button>

        <button
          onClick={onNew}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity ${theme.text}`}
        >
          Start New
        </button>
      </div>
    </div>
  );
};