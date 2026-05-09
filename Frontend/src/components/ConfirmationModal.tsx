import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ha, o'chirish",
  cancelText = "Bekor qilish",
  variant = 'danger'
}) => {
  const variantStyles = {
    danger: {
      icon: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-100',
    },
    warning: {
      icon: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
    },
    info: {
      icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
    }
  };

  const style = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] shadow-2xl p-8 pointer-events-auto relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${style.icon} rounded-2xl flex items-center justify-center mb-6`}>
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight uppercase tracking-tight">
                  {title}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                  {message}
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={() => { onConfirm(); onClose(); }}
                    className={`w-full py-4 text-xs font-black uppercase tracking-widest text-white rounded-2xl shadow-lg transition-all active:scale-95 ${style.button}`}
                  >
                    {confirmText}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-4 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl transition-all active:scale-95"
                  >
                    {cancelText}
                  </button>
                </div>
              </div>

              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-gray-300 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
