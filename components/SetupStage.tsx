import React, { useState, useEffect, useRef } from 'react';
import { ThemeConfig, AnalysisResult } from '../types';
import { Icons } from './Icons';

interface SetupStageProps {
  theme: ThemeConfig;
  analysis: AnalysisResult;
  onStart: (finalDuration: number) => void;
  onBack: () => void;
}

export const SetupStage: React.FC<SetupStageProps> = ({ theme, analysis, onStart, onBack }) => {
  const [duration, setDuration] = useState(analysis.totalDurationSec);
  const [hasMic, setHasMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationRef = useRef<number>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    
    const initMic = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMic(true);

        // Setup audio analysis for visualizer
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          // Calculate average volume
          let sum = 0;
          for(let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setAudioLevel(average);
          animationRef.current = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();

      } catch (err) {
        console.error("Microphone access denied", err);
        setHasMic(false);
      }
    };

    initMic();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
    };
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`max-w-3xl mx-auto w-full ${theme.font} flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500`}>
      <div className="space-y-2">
        <button onClick={onBack} className={`text-sm opacity-50 hover:opacity-100 transition-opacity ${theme.text} flex items-center gap-1 mb-4`}>
          <Icons.ChevronRight className="rotate-180" size={16} /> Back to Edit
        </button>
        <h1 className={`text-4xl md:text-5xl font-bold ${theme.text}`}>
          Prepare.
        </h1>
        <p className={`text-xl opacity-60 ${theme.text}`}>
          We'll listen to your voice to scroll the text automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speed/Duration Control */}
        <div className={`p-6 rounded-2xl ${theme.secondary} flex flex-col justify-between gap-4`}>
          <div>
            <div className={`flex items-center gap-2 mb-2 opacity-70 ${theme.text}`}>
              <Icons.Clock size={20} />
              <span className="font-bold uppercase text-xs tracking-widest">Target Duration</span>
            </div>
            <div className={`text-4xl font-bold ${theme.text} mb-1`}>
              {formatTime(duration)}
            </div>
            <div className={`text-sm opacity-50 ${theme.text}`}>
              ~{Math.round((analysis.chunks.length / duration) * 60)} chunks/min
            </div>
          </div>
          
          <div className="space-y-4">
            <input 
              type="range" 
              min={Math.max(10, analysis.totalDurationSec * 0.5)} 
              max={analysis.totalDurationSec * 2} 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-current"
            />
            <div className="flex justify-between text-xs opacity-50">
              <span>Faster</span>
              <span>Slower</span>
            </div>
            <button 
              onClick={() => setDuration(analysis.totalDurationSec)}
              className={`text-xs underline opacity-60 hover:opacity-100 ${theme.text}`}
            >
              Reset to AI Recommendation
            </button>
          </div>
        </div>

        {/* Microphone Check */}
        <div className={`relative overflow-hidden rounded-2xl aspect-square md:aspect-auto ${theme.bg} border ${theme.panel} flex flex-col items-center justify-center group p-8`}>
           
           <div className="relative">
             {/* Visualizer Ring */}
             <div 
               className={`absolute inset-0 rounded-full opacity-20 transition-all duration-75 ${theme.text === 'text-slate-900 dark:text-slate-100' ? 'bg-blue-500' : 'bg-neutral-500'}`}
               style={{ transform: `scale(${1 + (audioLevel / 50)})` }}
             />
             <div className={`relative z-10 p-6 rounded-full ${theme.secondary}`}>
                <Icons.Mic size={48} className={hasMic ? theme.accent : "text-red-500"} />
             </div>
           </div>

           <div className={`mt-6 text-center ${theme.text}`}>
             <h3 className="font-bold text-lg">{hasMic ? "Microphone Ready" : "Microphone Access Needed"}</h3>
             <p className="text-sm opacity-60 mt-1">
               {hasMic ? "Speak to test input levels" : "Please allow microphone access"}
             </p>
           </div>

           <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              <div className={`h-1 rounded-full transition-all duration-100 ${audioLevel > 10 ? 'bg-green-500 w-2' : 'bg-gray-300 w-1'}`} />
              <div className={`h-1 rounded-full transition-all duration-100 ${audioLevel > 30 ? 'bg-green-500 w-2' : 'bg-gray-300 w-1'}`} />
              <div className={`h-1 rounded-full transition-all duration-100 ${audioLevel > 50 ? 'bg-green-500 w-2' : 'bg-gray-300 w-1'}`} />
              <div className={`h-1 rounded-full transition-all duration-100 ${audioLevel > 70 ? 'bg-green-500 w-2' : 'bg-gray-300 w-1'}`} />
           </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${theme.panel} bg-transparent`}>
        <div className={`flex items-center gap-2 mb-2 opacity-70 ${theme.text}`}>
          <Icons.Type size={20} />
          <span className="font-bold uppercase text-xs tracking-widest">AI Summary</span>
        </div>
        <p className={`text-lg italic opacity-80 ${theme.text}`}>
          "{analysis.summary}"
        </p>
      </div>

      <button
        onClick={() => onStart(duration)}
        disabled={!hasMic}
        className={`
          w-full py-5 rounded-xl font-bold text-xl transition-transform active:scale-95
          flex items-center justify-center gap-3 shadow-xl
          ${theme.text === 'text-slate-900 dark:text-slate-100' ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-black'}
          ${!hasMic ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Icons.Play size={24} />
        Start Session
      </button>
    </div>
  );
};