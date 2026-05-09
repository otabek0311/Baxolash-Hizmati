import React, { createContext, useContext, useState } from 'react';
import { uz } from '../i18n/uz';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';

export type Lang = 'uz' | 'en' | 'ru';

const translations: Record<Lang, Record<string, string>> = { uz, en, ru };

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'uz',
  setLang: () => {},
  t: (key) => key,
});

export const useLang = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'uz';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (key: string): string => {
    return translations[lang][key] ?? translations['uz'][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
