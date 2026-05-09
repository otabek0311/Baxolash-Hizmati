import React, { useState } from 'react';
import { Pipeline } from '../components/Pipeline';
import { UserRoles } from '../components/UserRoles';
import { BookOpen, ShieldCheck, Zap, HelpCircle, Users, Keyboard, ChevronRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const K = ({ children }: { children: string }) => {
  const parts = children.split('+');
  return (
    <span className="inline-flex items-center gap-0.5 mx-0.5">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <kbd className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 text-[11px] font-black text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
            {p.trim()}
          </kbd>
          {i < parts.length - 1 && <span className="text-gray-400 dark:text-gray-500 text-[10px]">+</span>}
        </React.Fragment>
      ))}
    </span>
  );
};

const ShortcutRow = ({ label, desc }: { label: React.ReactNode; desc: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 gap-4">
    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{desc}</span>
    <div className="flex-shrink-0">{label}</div>
  </div>
);

export const HowItWorks = () => {
  const { t } = useLang();
  const [shortcutTab, setShortcutTab] = useState<'nav' | 'action' | 'general'>('nav');

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 px-6">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl shadow-sm mb-4">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('how.title')}</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          {t('how.subtitle')}
        </p>
      </div>

      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('how.pipeline')}</h2>
        </div>
        <Pipeline />
      </section>

      <section className="space-y-10 pt-8 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('how.roles')}</h2>
        </div>
        <UserRoles />
      </section>

      {/* Keyboard Shortcuts section — desktop only */}
      <section className="hidden md:block space-y-8 pt-8 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Keyboard className="w-6 h-6 text-indigo-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('how.shortcuts')}</h2>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white space-y-4">
          <p className="text-indigo-200 text-sm font-medium leading-relaxed">
            {t('how.shortcutsDesc')}
          </p>
          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black">{t('how.helpWindow')}</p>
              <p className="text-xs text-indigo-200">
                {t('how.helpHint').replace('?', '')}
                <kbd className="bg-white/20 px-1.5 py-0.5 rounded font-bold">?</kbd>
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl w-fit">
          {(['nav', 'action', 'general'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setShortcutTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                shortcutTab === tab
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'nav' ? t('how.tabNav') : tab === 'action' ? t('how.tabActions') : t('how.tabGeneral')}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {shortcutTab === 'nav' && (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              <div className="px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/50">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5" />
                  {t('how.navChordHint')}
                </p>
              </div>
              <div className="px-6">
                <ShortcutRow label={<span className="flex items-center gap-1"><K>G</K><span className="text-gray-300 dark:text-gray-600 text-xs">{t('shortcuts.then')}</span><K>H</K></span>} desc={t('shortcuts.goDashboard')} />
                <ShortcutRow label={<span className="flex items-center gap-1"><K>G</K><span className="text-gray-300 dark:text-gray-600 text-xs">{t('shortcuts.then')}</span><K>D</K></span>} desc={t('shortcuts.goDocs')} />
                <ShortcutRow label={<span className="flex items-center gap-1"><K>G</K><span className="text-gray-300 dark:text-gray-600 text-xs">{t('shortcuts.then')}</span><K>U</K></span>} desc={t('shortcuts.goUpload')} />
                <ShortcutRow label={<span className="flex items-center gap-1"><K>G</K><span className="text-gray-300 dark:text-gray-600 text-xs">{t('shortcuts.then')}</span><K>S</K></span>} desc={t('shortcuts.goSettings')} />
                <ShortcutRow label={<span className="flex items-center gap-1"><K>G</K><span className="text-gray-300 dark:text-gray-600 text-xs">{t('shortcuts.then')}</span><K>X</K></span>} desc={t('shortcuts.goUsers')} />
                <ShortcutRow label={<span className="flex items-center gap-1"><K>G</K><span className="text-gray-300 dark:text-gray-600 text-xs">{t('shortcuts.then')}</span><K>?</K></span>} desc={t('shortcuts.goGuide')} />
              </div>
            </div>
          )}
          {shortcutTab === 'action' && (
            <div className="px-6">
              <ShortcutRow label={<K>Ctrl+K</K>} desc={t('shortcuts.openSearch')} />
              <ShortcutRow label={<K>/</K>} desc={t('shortcuts.altSearch')} />
              <ShortcutRow label={<K>Q</K>} desc={t('shortcuts.qrScanner')} />
              <ShortcutRow label={<K>N</K>} desc={t('shortcuts.newDoc')} />
              <ShortcutRow label={<K>M</K>} desc={t('shortcuts.toggleMenu')} />
              <ShortcutRow label={<K>?</K>} desc={t('shortcuts.showHelp')} />
            </div>
          )}
          {shortcutTab === 'general' && (
            <div className="px-6">
              <ShortcutRow label={<K>Esc</K>} desc={t('shortcuts.closeModal')} />
              <ShortcutRow label={<K>↑</K>} desc={t('shortcuts.navUp')} />
              <ShortcutRow label={<K>↓</K>} desc={t('shortcuts.navDown')} />
              <ShortcutRow label={<K>Enter</K>} desc={t('shortcuts.selectItem')} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: 'Ctrl+K', desc: t('shortcuts.openSearch') },
            { key: 'G + harf', desc: t('shortcuts.navSection') },
            { key: '?', desc: t('shortcuts.showHelp') },
          ].map(item => (
            <div key={item.key} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <kbd className="text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800">
                {item.key}
              </kbd>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('how.security')}</h3>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            QR kodlar orqali hujjatlarni kuzatish — bu shunchaki qulaylik emas, balki xavfsizlikning yangi darajasi.
            Har bir skanerlash orqali siz hujjatning asl nusxasiga to'g'ridan-to'g'ri bog'lanasiz, bu esa soxta hujjatlar bilan ishlash xavfini nolga tushiradi.
            Xodimlar o'nlab sahifalar ichidan kerakli ma'lumotni qidirishga ketadigan vaqtini 90% gacha tejashadi.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('how.ai')}</h3>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            Bizning sun'iy intellekt modelimiz har bir sahifani piksellar darajasida tahlil qiladi.
            U nafaqat QR kodni bo'sh joyga qo'yadi, balki u yerda muhim muhrlar, imzolar yoki rasm elementlari yo'qligini tushunadi.
            QR kodlar vizual tarzda hamma sahifalarda bir xil turishi va hujjatning yuridik kuchini saqlab qolishi uchun aqlli algoritmlar mas'ul.
          </p>
        </div>
      </div>
    </div>
  );
};
