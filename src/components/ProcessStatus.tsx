import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ProcessStatusProps {
  onComplete: () => void;
}

export const ProcessStatus: React.FC<ProcessStatusProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  const loadingSteps = [
    { label: 'PDF ga o‘girilmoqda...', status: progress > 30 ? 'complete' : progress > 0 ? 'loading' : 'pending' },
    { label: 'Sahifalar ajratilmoqda...', status: progress > 60 ? 'complete' : progress > 30 ? 'loading' : 'pending' },
    { label: 'QR kodlar yaratilmoqda...', status: progress >= 100 ? 'complete' : progress > 60 ? 'loading' : 'pending' },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Ishlov berish</h3>
          <p className="text-sm font-medium text-gray-500">
            {progress < 100 ? 'Hujjat sahifalarga ajratilmoqda...' : 'Jarayon yakunlandi!'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-blue-600">{progress}%</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>

        <div className="space-y-3">
          {loadingSteps.map((step, index) => (
            <div 
              key={step.label}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                step.status === 'complete' 
                  ? 'border-green-100 bg-green-50/20' 
                  : step.status === 'loading'
                  ? 'border-blue-100 bg-blue-50/20 shadow-sm'
                  : 'border-gray-50 bg-gray-50/50 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {step.status === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : step.status === 'loading' ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                )}
                <span className={`text-[11px] font-bold uppercase tracking-widest ${
                  step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {step.label}
                </span>
              </div>
              {step.status === 'complete' && <span className="text-[9px] font-black text-green-600 uppercase">Tayyor</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
