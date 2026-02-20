import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';
import ka from './ka.json';

const resources = {
  en: { translation: en },
  ka: { translation: ka },
};

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
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
