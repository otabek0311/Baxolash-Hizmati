import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const validateInput = (value: string) => {
    if (value && !/^[a-zA-Z0-9]*$/.test(value)) {
      setValidationError("Faqat harf va raqamlardan foydalaning");
    } else {
      setValidationError(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualInput(value);
    validateInput(value);
  };

  const initScanner = () => {
    setError(null);
    setValidationError(null);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      const onScanSuccessLocal = (decodedText: string) => {
        setLastResult(decodedText);
        setManualInput(decodedText);
      };

      const onScanErrorLocal = (errorMessage: string) => {
        // Handle persistent fatal errors
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
          setError("Kameraga ruxsat berilmagan. Iltimos, brauzer sozlamalarida kameraga ruxsat bering.");
          scannerRef.current?.clear().catch(() => {});
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('no camera')) {
          setError("Kamera topilmadi. Iltimos, qurilmangizda kamera borligini tekshiring.");
          scannerRef.current?.clear().catch(() => {});
        }
      };

      scannerRef.current.render(onScanSuccessLocal, onScanErrorLocal);
    } catch (err) {
      console.error("Failed to initialize scanner:", err);
      setError("Kamerani ishga tushirib bo'lmadi. Iltimos, kamera ruxsatini tekshiring yoki qo'lda kiriting.");
    }
  };

  useEffect(() => {
    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, []);

  const handleRescan = () => {
    setLastResult(null);
    setManualInput('');
    setIsRescanning(true);
    setTimeout(() => {
      initScanner();
      setIsRescanning(false);
    }, 500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl max-w-md w-full relative"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">QR Skaner</h3>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Kamerani kodga qarating</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative group">
            <div id="qr-reader" className="w-full bg-gray-900 rounded-2xl overflow-hidden min-h-[250px] flex items-center justify-center">
              {error && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-300 leading-relaxed max-w-[200px] mx-auto">
                    {error}
                  </p>
                  <button 
                    onClick={handleRescan}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl transition-all"
                  >
                    Qayta urinish
                  </button>
                </div>
              )}
            </div>
            {!error && (
              <button 
                onClick={handleRescan}
                disabled={isRescanning}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
                title="Qayta skanerlash"
              >
                <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">yoki qo'lda kiriting</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={handleInputChange}
                  placeholder="Kod yoki ID raqamini kiriting..."
                  className={`w-full bg-gray-50 dark:bg-gray-700 border-2 rounded-2xl py-4 px-6 text-center font-black text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-8 transition-all outline-none text-lg placeholder:text-gray-300 dark:placeholder:text-gray-500 ${
                    validationError 
                      ? 'border-red-100 focus:border-red-500 focus:ring-red-500/5' 
                      : 'border-gray-100 focus:border-blue-500 focus:ring-blue-500/5'
                  }`}
                />
                <AnimatePresence>
                  {validationError && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center"
                    >
                      {validationError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button 
                type="submit"
                disabled={!manualInput.trim() || !!validationError}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
              >
                Tasdiqlash
                <ExternalLink className="w-4 h-4" />
              </button>

              {lastResult && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Skanerlandi</p>
                      <p className="text-sm font-bold text-gray-900">Tayyor!</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onScanSuccess(lastResult)}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest px-3 py-1.5"
                  >
                    Hujjatni ochish
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
