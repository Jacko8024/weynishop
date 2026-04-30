import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import am from '../locales/am.json';
import or from '../locales/or.json';
import ti from '../locales/ti.json';
import so from '../locales/so.json';

export const SUPPORTED_LANGS = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'or', name: 'Afaan Oromoo', native: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ' },
  { code: 'so', name: 'Somali', native: 'Af Soomaali' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      or: { translation: or },
      ti: { translation: ti },
      so: { translation: so },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'weynshop:lang',
    },
    interpolation: { escapeValue: false },
  });

const applyHtmlLang = (lng) => {
  document.documentElement.setAttribute('lang', lng || 'en');
};
applyHtmlLang(i18n.language);
i18n.on('languageChanged', applyHtmlLang);

export default i18n;
