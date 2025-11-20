import React from 'react';
import { 
  Mic, 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Moon, 
  Sun, 
  CheckCircle2, 
  ChevronRight,
  Video,
  Type,
  Clock,
  Wand2
} from 'lucide-react';

export const Icons = {
  Mic,
  Play,
  Square,
  RotateCcw,
  Settings,
  Moon,
  Sun,
  Check,
  CheckCircle2,
  ChevronRight,
  Video,
  Type,
  Clock,
  Wand2
};

function Check(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
