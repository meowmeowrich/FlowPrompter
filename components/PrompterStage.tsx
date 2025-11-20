import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeConfig, AnalysisResult } from '../types';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PrompterStageProps {
  theme: ThemeConfig;
  analysis: AnalysisResult;
  targetDuration: number;
  onFinish: (blob: Blob) => void;
  onCancel: () => void;
}

export const PrompterStage: React.FC<PrompterStageProps> = ({ 
  theme, 
  analysis, 
  targetDuration, 
  onFinish,
  onCancel 
}) => {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 for countdown
  const [countdown, setCountdown] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  
  // Initialize Audio Recorder and Speech Recognition
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupMedia = async () => {
      try {
        // Audio only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          onFinish(blob);
        };
        mediaRecorderRef.current = recorder;
        
        // Setup Speech Recognition
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                // Gather interim results (what is being said right now)
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    interimTranscript += event.results[i][0].transcript;
                }
                checkMatch(interimTranscript);
            };

            recognition.onend = () => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && !isPaused) {
                   try {
                     recognition.start(); 
                   } catch(e) {
                     // ignore already started error
                   }
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
        }

        // Start Countdown
        startCountdown();
      } catch (err) {
        console.error("Error accessing media", err);
        alert("Could not access microphone");
        onCancel();
      }
    };

    setupMedia();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if the spoken text matches the END of the current chunk
  const checkMatch = (transcript: string) => {
    // We need the latest index, but useEffect closure traps it. 
    // However, since we are inside a component that re-renders on currentIndex change, 
    // the closure might be stale if we attached the listener once.
    // Actually, we attached the listener ONCE in mount. So currentIndex is stale inside onresult.
    // We need a Ref to track current index for the event handler.
  };

  // Use Ref to track index for the event listener which is only bound once
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
      currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const advanceChunk = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= analysis.chunks.length) {
        // Finished
        finishEarly();
        return prev;
      }
      return next;
    });
  }, [analysis.chunks.length]);

  // Re-bind the checkMatch logic to be accessible from the static event handler
  // We simply use a ref-based checker inside the effect
  useEffect(() => {
      if (!recognitionRef.current) return;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            interimTranscript += event.results[i][0].transcript;
        }
        
        const idx = currentIndexRef.current;
        if (idx < 0 || idx >= analysis.chunks.length) return;

        const currentChunkText = analysis.chunks[idx].text.toLowerCase().replace(/[^\w\s]/g, '');
        const transcriptClean = interimTranscript.toLowerCase().replace(/[^\w\s]/g, '');
        
        if (!currentChunkText) return;

        const chunkWords = currentChunkText.split(/\s+/).filter(w => w.length > 0);
        
        // Trigger conditions:
        // 1. Transcript contains the last phrase of the chunk
        const tailLength = Math.min(3, chunkWords.length);
        const tailPhrase = chunkWords.slice(-tailLength).join(' ');
        
        // 2. Transcript contains > 80% of the chunk content (for short chunks)
        
        if (transcriptClean.includes(tailPhrase) && tailPhrase.length > 0) {
            advanceChunk();
        }
      };
  }, [analysis.chunks, advanceChunk]); // Re-bind if chunks change, though they shouldn't.

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(0);
        startPrompter();
      }
    }, 1000);
  };

  const startPrompter = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start();
    }
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.warn("Recognition already started");
        }
    }
    setCurrentIndex(0);
  };

  const togglePause = () => {
    if (isPaused) {
        setIsPaused(false);
        if (mediaRecorderRef.current?.state === 'paused') mediaRecorderRef.current.resume();
        if (recognitionRef.current) try { recognitionRef.current.start(); } catch(e) {}
        setIsListening(true);
    } else {
        setIsPaused(true);
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.pause();
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    }
  };

  const finishEarly = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const currentChunkText = currentIndex >= 0 && currentIndex < analysis.chunks.length 
    ? analysis.chunks[currentIndex].text 
    : "";

  const nextChunkText = currentIndex + 1 < analysis.chunks.length 
    ? analysis.chunks[currentIndex + 1].text 
    : "End of speech";
    
  const prevChunkText = currentIndex - 1 >= 0
    ? analysis.chunks[currentIndex - 1].text
    : "";

  const getFontSize = (text: string) => {
      // Dynamic sizing based on length to ensure it fits
      if (text.length < 20) return 'text-5xl md:text-8xl';
      if (text.length < 50) return 'text-4xl md:text-7xl';
      if (text.length < 100) return 'text-3xl md:text-5xl';
      return 'text-2xl md:text-4xl';
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center transition-colors duration-500 ${theme.bg}`}>
      
      {/* Status Indicators */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${theme.panel} ${theme.text} opacity-60 text-xs font-mono`}>
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isListening ? 'LISTENING' : 'PAUSED'}
          </div>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 z-30 flex gap-4">
        <button 
          onClick={finishEarly}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-full text-sm font-bold border border-red-500/20 transition-colors"
        >
          Done
        </button>
        <button 
          onClick={togglePause}
          className={`p-3 rounded-full transition-colors border ${theme.panel} ${theme.text} hover:bg-black/5 dark:hover:bg-white/5`}
        >
          {isPaused ? <Icons.Play size={24} /> : <Icons.Square size={24} />}
        </button>
      </div>
      
      {/* Manual Advance (Backup) */}
      <div className="absolute bottom-10 right-10 z-30 md:hidden">
          <button 
            onClick={() => advanceChunk()} 
            className={`p-6 rounded-full shadow-xl ${theme.secondary} ${theme.text} opacity-50 hover:opacity-100`}
          >
            <Icons.ChevronRight size={32} />
          </button>
      </div>

      {/* Countdown Overlay */}
      {countdown > 0 && (
        <div className={`absolute inset-0 z-40 flex items-center justify-center ${theme.bg}`}>
          <motion.div 
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className={`text-9xl font-bold ${theme.text}`}
          >
            {countdown}
          </motion.div>
        </div>
      )}

      {/* Teleprompter Text Display */}
      <div className="relative z-10 w-full max-w-6xl px-8 text-center flex flex-col items-center justify-center h-full">
         
         {/* Previous Text Faded */}
         <div className={`mb-12 opacity-10 blur-[1px] select-none ${theme.text} text-xl md:text-3xl max-w-4xl transition-all duration-500 scale-95`}>
            {prevChunkText}
         </div>

         <AnimatePresence mode='wait'>
            {currentIndex >= 0 && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 1.05, filter: 'blur(8px)' }}
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
                className="py-4 w-full flex justify-center"
              >
                <h1 className={`${getFontSize(currentChunkText)} font-bold leading-tight tracking-tight ${theme.text} transition-all duration-300 max-w-5xl`}>
                  {currentChunkText}
                </h1>
              </motion.div>
            )}
         </AnimatePresence>
         
         {/* Next line preview */}
         <div className={`mt-16 opacity-30 ${theme.text} text-xl md:text-3xl font-medium max-w-4xl transition-all duration-500`}>
            {nextChunkText}
         </div>
      </div>
    </div>
  );
};