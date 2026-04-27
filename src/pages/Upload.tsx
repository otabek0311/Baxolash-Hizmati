import React, { useState } from 'react';
import { UploadArea } from '../components/UploadArea';
import { ProcessStatus } from '../components/ProcessStatus';
import { DocumentDetails } from '../components/DocumentDetails';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronLeft } from 'lucide-react';

export const UploadPage = () => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hujjat yuklash</h1>
          <p className="text-sm text-gray-500 font-medium">Tizimga yangi hujjat kiritish va QR-tamg'alash jarayoni.</p>
        </div>
        {status === 'completed' && (
          <button 
            onClick={() => setStatus('idle')}
            className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
            Yangi yuklash
          </button>
        )}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto pt-12"
            >
              <UploadArea onUpload={() => setStatus('processing')} />
              <div className="mt-8 p-6 bg-blue-50/30 rounded-2xl border border-blue-100 flex gap-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900">Avtomatik jarayon</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Hujjat yuklangandan so'ng, tizim uni avtomatik ravishda PDF-ga o'giradi, 
                    sahifalarga ajratadi va har bir betga unikal QR-kod joylashtiradi.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto pt-12"
            >
              <ProcessStatus onComplete={() => setStatus('completed')} />
            </motion.div>
          )}

          {status === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="bg-green-50 border border-green-100 p-4 rounded-2xl mb-8 flex items-center justify-center gap-3">
                 <CheckCircle2 className="w-5 h-5 text-green-600" />
                 <span className="text-sm font-bold text-green-800">Hujjat muvaffaqiyatli ishlandi va tayyor holga keltirildi!</span>
              </div>
              <DocumentDetails />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
