import React, { createContext, useContext, useState, useEffect } from 'react';
import { locales } from '../constants/locales';

type Locale = keyof typeof locales;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof locales)['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = locales[locale] || locales.en;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
export default LanguageProvider;
