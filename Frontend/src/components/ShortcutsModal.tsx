import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLang } from '../context/LanguageContext';

interface Props { open: boolean; onClose: () => void; }

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-0.5">
    {String(children).split('+').map((k, i, arr) => (
      <React.Fragment key={i}>
        <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-[11px] font-black text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
          {k.trim()}
        </kbd>
        {i < arr.length - 1 && <span className="text-gray-300 dark:text-gray-500 text-[10px] font-bold mx-0.5">+</span>}
      </React.Fragment>
    ))}
  </span>
);

const Chord = ({ first, second, then }: { first: string; second: string; then: string }) => (
  <span className="inline-flex items-center gap-1">
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-[11px] font-black text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
      {first}
    </kbd>
    <span className="text-gray-300 dark:text-gray-500 text-[10px] font-bold">{then}</span>
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-[11px] font-black text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
      {second}
    </kbd>
  </span>
);

const Row = ({ keys, label }: { keys: React.ReactNode; label: string }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
    <div className="flex-shrink-0">{keys}</div>
  </div>
);

const Section = ({ title, children }: { title: string; color?: string; children: React.ReactNode }) => (
  <div className="space-y-0.5">
    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pb-1 mb-1 border-b border-gray-100 dark:border-gray-700">
      {title}
    </p>
    {children}
  </div>
);

export const ShortcutsModal: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useLang();

  React.useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">{t('shortcuts.title')}</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{t('shortcuts.subtitle')}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <Section title={t('shortcuts.searchSection')}>
                <Row keys={<Kbd>Ctrl + K</Kbd>} label={t('shortcuts.openSearch')} />
                <Row keys={<Kbd>/</Kbd>} label={t('shortcuts.altSearch')} />
              </Section>

              <Section title={t('shortcuts.navSection')}>
                <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                    {t('shortcuts.navHint')}
                  </p>
                </div>
                <Row keys={<Chord first="G" second="H" then={t('shortcuts.then')} />} label={t('shortcuts.goDashboard')} />
                <Row keys={<Chord first="G" second="D" then={t('shortcuts.then')} />} label={t('shortcuts.goDocs')} />
                <Row keys={<Chord first="G" second="U" then={t('shortcuts.then')} />} label={t('shortcuts.goUpload')} />
                <Row keys={<Chord first="G" second="S" then={t('shortcuts.then')} />} label={t('shortcuts.goSettings')} />
                <Row keys={<Chord first="G" second="X" then={t('shortcuts.then')} />} label={t('shortcuts.goUsers')} />
                <Row keys={<Chord first="G" second="?" then={t('shortcuts.then')} />} label={t('shortcuts.goGuide')} />
              </Section>

              <Section title={t('shortcuts.actionsSection')}>
                <Row keys={<Kbd>Q</Kbd>} label={t('shortcuts.qrScanner')} />
                <Row keys={<Kbd>N</Kbd>} label={t('shortcuts.newDoc')} />
                <Row keys={<Kbd>M</Kbd>} label={t('shortcuts.toggleMenu')} />
                <Row keys={<Kbd>?</Kbd>} label={t('shortcuts.showHelp')} />
              </Section>

              <Section title={t('shortcuts.generalSection')}>
                <Row keys={<Kbd>Esc</Kbd>} label={t('shortcuts.closeModal')} />
                <Row keys={<Kbd>↑ ↓</Kbd>} label={t('shortcuts.navUp') + ' / ' + t('shortcuts.navDown')} />
                <Row keys={<Kbd>Enter</Kbd>} label={t('shortcuts.selectItem')} />
              </Section>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center">
                {t('shortcuts.footer')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
