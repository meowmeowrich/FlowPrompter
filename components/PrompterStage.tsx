import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeConfig, AnalysisResult } from '../types';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

// Extend Window interface for SpeechRecognition
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
  const [spokenBuffer, setSpokenBuffer] = useState(""); // Debugging/Visual feedback
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  
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
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        // handle final
                        const transcript = event.results[i][0].transcript.toLowerCase();
                        checkMatch(transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                        checkMatch(interimTranscript.toLowerCase());
                    }
                }
                setSpokenBuffer(interimTranscript.slice(-50)); // Keep last 50 chars for debug/visual
            };

            recognition.onend = () => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && !isPaused) {
                    recognition.start(); // Restart if it stops unexpectedly while recording
                }
            };

            recognitionRef.current = recognition;
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

  const checkMatch = (transcript: string) => {
    // Clean transcript
    const cleanTranscript = transcript.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
    
    // Look ahead to next chunk
    const nextIndex = currentIndex + 1;
    if (nextIndex < analysis.chunks.length) {
        const nextChunkText = analysis.chunks[nextIndex].text.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
        const firstWordsOfNext = nextChunkText.split(' ').slice(0, 2).join(' '); // First 2 words
        
        // Check if transcript contains the start of next chunk
        if (cleanTranscript.includes(firstWordsOfNext)) {
            advanceChunk();
        }
    }
  };

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
      startTimeRef.current = Date.now();
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

  // Font size calculation
  const getFontSize = (text: string) => {
      if (text.length < 20) return 'text-5xl md:text-7xl';
      if (text.length < 40) return 'text-4xl md:text-6xl';
      return 'text-3xl md:text-5xl';
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
      <div className="relative z-10 w-full max-w-5xl px-8 text-center flex flex-col items-center justify-center h-full">
         
         {/* Previous Text Faded */}
         <div className={`mb-8 opacity-20 blur-[2px] select-none ${theme.text} text-2xl max-w-3xl transition-all duration-500`}>
            {prevChunkText}
         </div>

         <AnimatePresence mode='wait'>
            {currentIndex >= 0 && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="py-4"
              >
                <h1 className={`${getFontSize(currentChunkText)} font-bold leading-tight tracking-tight ${theme.text} transition-all duration-300`}>
                  {currentChunkText}
                </h1>
              </motion.div>
            )}
         </AnimatePresence>
         
         {/* Next line preview */}
         <div className={`mt-12 opacity-40 ${theme.text} text-2xl md:text-3xl font-medium max-w-3xl transition-all duration-500`}>
            {nextChunkText}
         </div>

         {/* Voice Debug (Hidden in prod, nice for feedback) */}
         {/* <div className="absolute bottom-4 text-xs opacity-20 font-mono max-w-full truncate px-4">
            {spokenBuffer}
         </div> */}
      </div>
    </div>
  );
};