import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';
import ka from './ka.json';

const resources = {
  en: { translation: en },
  ka: { translation: ka },
};

// Safe locale detection — getLocales() can throw or return empty on some iOS builds
let deviceLanguage = 'en';
try {
  const locales = getLocales();
  if (locales?.length > 0 && locales[0]?.languageCode) {
    deviceLanguage = locales[0].languageCode;
  }
} catch {
  // Fallback to English
}

const supportedLanguages = ['en', 'ka'];
const defaultLanguage = supportedLanguages.includes(deviceLanguage)
  ? deviceLanguage
  : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
