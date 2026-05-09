import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { useLang } from '../context/LanguageContext';

interface ProcessStatusProps {
  documentId: string;
  onComplete: () => void;
}

export const ProcessStatus: React.FC<ProcessStatusProps> = ({ documentId, onComplete }) => {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const steps = [
    t('upload.step1'),
    t('upload.step2'),
    t('upload.step3'),
  ];

  useEffect(() => {
    let stepTimer: ReturnType<typeof setInterval>;
    let pollTimeout: ReturnType<typeof setTimeout>;
    let completeTimer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const startedAt = Date.now();

    stepTimer = setInterval(() => {
      setStep(prev => (prev < 2 ? prev + 1 : prev));
    }, 1500);

    const schedulePoll = (delay: number) => {
      pollTimeout = setTimeout(poll, delay);
    };

    const poll = async () => {
      if (stopped) return;
      try {
        const doc = await api.getDocument(documentId);
        if (stopped) return;
        if (doc.status === 'READY') {
          clearInterval(stepTimer);
          setStep(2);
          setDone(true);
          completeTimer = setTimeout(onComplete, 800);
        } else if (doc.status === 'EXPIRED' || doc.status === 'FAILED') {
          clearInterval(stepTimer);
          setFailed(true);
        } else {
          // Aqlli polling: dastlab tez (500ms), 8s dan keyin sekin (2s)
          const elapsed = Date.now() - startedAt;
          schedulePoll(elapsed < 8000 ? 500 : 2000);
        }
      } catch {
        if (!stopped) schedulePoll(2000);
      }
    };

    poll();

    return () => {
      stopped = true;
      clearInterval(stepTimer);
      clearTimeout(pollTimeout);
      clearTimeout(completeTimer);
    };
  }, [documentId, onComplete]);

  if (failed) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-red-100 dark:border-red-800/50 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('upload.failedTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('upload.failedDesc')}</p>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl text-left space-y-2">
          <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">{t('upload.accepted')}</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 font-medium leading-relaxed">
            <strong>PDF</strong>, <strong>DOC</strong> {t('common.and')} <strong>DOCX</strong> {t('upload.acceptedHint')}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all"
        >
          {t('upload.retry')}
        </button>
      </div>
    );
  }

  const progress = done ? 100 : Math.round(((step + 1) / steps.length) * 90);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t('upload.processing')}</h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {done ? t('upload.processingDone') : t('upload.processingHint')}
          </p>
        </div>
        <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{progress}%</span>
      </div>

      <div className="space-y-6">
        <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>

        <div className="space-y-3">
          {steps.map((label, i) => {
            const status = done || i < step ? 'complete' : i === step ? 'loading' : 'pending';
            return (
              <div
                key={label}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  status === 'complete'
                    ? 'border-green-100 dark:border-green-800/50 bg-green-50/20 dark:bg-green-900/10'
                    : status === 'loading'
                    ? 'border-blue-100 dark:border-blue-700/50 bg-blue-50/20 dark:bg-blue-900/10 shadow-sm'
                    : 'border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : status === 'loading' ? (
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-600" />
                  )}
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${
                    status === 'pending' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                  }`}>
                    {label}
                  </span>
                </div>
                {status === 'complete' && (
                  <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase">{t('upload.stepDone')}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
