import React, { useState, useEffect } from 'react';
import { ThemeId, AppStep, AnalysisResult, ThemeConfig } from './types';
import { THEMES } from './constants';
import { Icons } from './components/Icons';
import { InputStage } from './components/InputStage';
import { SetupStage } from './components/SetupStage';
import { PrompterStage } from './components/PrompterStage';
import { ReviewStage } from './components/ReviewStage';

const App: React.FC = () => {
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(ThemeId.MINIMAL);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  
  // Data States
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [finalDuration, setFinalDuration] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const theme: ThemeConfig = THEMES[currentThemeId];

  // Initialize Dark Mode based on system
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply Dark Mode class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAnalysisComplete = (text: string, result: AnalysisResult) => {
    setAnalysis(result);
    setStep(AppStep.SETUP);
  };

  const handleStartPrompter = (duration: number) => {
    setFinalDuration(duration);
    setStep(AppStep.PROMPTER);
  };

  const handlePrompterFinish = (blob: Blob) => {
    setRecordedBlob(blob);
    setStep(AppStep.REVIEW);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg}`}>
      
      {/* Navigation / Header - Only show if not in prompter mode */}
      {step !== AppStep.PROMPTER && (
        <nav className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-transparent bg-opacity-80 p-4 md:px-8 flex justify-between items-center">
          <div className={`flex items-center gap-2 font-bold text-xl ${theme.text} tracking-tight`}>
            <div className={`p-2 rounded-lg ${theme.text === 'text-slate-900 dark:text-slate-100' ? 'bg-blue-600 text-white' : 'bg-black text-white dark:bg-white dark:text-black'}`}>
              <Icons.Mic size={18} />
            </div>
            <span>FlowPrompter</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <div className="hidden md:flex gap-2">
              {Object.values(THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentThemeId(t.id)}
                  className={`w-6 h-6 rounded-full border ${theme.panel} ${t.bg === 'bg-white dark:bg-neutral-900' ? 'bg-gray-200' : t.bg.split(' ')[0]} ${currentThemeId === t.id ? 'ring-2 ring-offset-2 ring-current' : ''} transition-all`}
                  aria-label={t.name}
                  title={t.name}
                />
              ))}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${theme.text}`}
            >
              {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="w-full px-4 py-8 md:py-12 flex flex-col min-h-[80vh]">
        
        {step === AppStep.INPUT && (
          <InputStage 
            theme={theme} 
            onAnalysisComplete={handleAnalysisComplete} 
          />
        )}

        {step === AppStep.SETUP && analysis && (
          <SetupStage 
            theme={theme}
            analysis={analysis}
            onStart={handleStartPrompter}
            onBack={() => setStep(AppStep.INPUT)}
          />
        )}

        {step === AppStep.PROMPTER && analysis && (
          <PrompterStage 
            theme={theme}
            analysis={analysis}
            targetDuration={finalDuration}
            onFinish={handlePrompterFinish}
            onCancel={() => setStep(AppStep.SETUP)}
          />
        )}

        {step === AppStep.REVIEW && (
          <ReviewStage 
            theme={theme}
            recordedBlob={recordedBlob}
            onRetry={() => setStep(AppStep.SETUP)}
            onNew={() => {
                setAnalysis(null);
                setStep(AppStep.INPUT);
            }}
          />
        )}

      </main>
    </div>
  );
};

export default App;
