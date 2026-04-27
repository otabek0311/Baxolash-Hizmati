import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [lastResult, setLastResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    const onScanSuccessLocal = (decodedText: string) => {
      setLastResult(decodedText);
      // Optional: sound or haptic feedback could be added here if possible
    };

    scannerRef.current.render(onScanSuccessLocal, (err) => {
      // Ignore errors as they happen constantly during scanning
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full relative"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">QR Skaner</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kamerani kodga qarating</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div id="qr-reader" className="w-full bg-gray-900 rounded-2xl overflow-hidden" />
          
          <AnimatePresence>
            {lastResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Hujjat aniqlandi</p>
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">#{lastResult}</p>
                  </div>
                  <button 
                    onClick={() => onScanSuccess(lastResult)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
                  >
                    Ochish
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!lastResult && (
            <div className="mt-6 flex flex-col items-center gap-2 py-4">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin opacity-40" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skanerlash kutilmoqda...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
