import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 翻訳リソース
import jaTranslation from './locales/ja/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
  ja: {
    translation: jaTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja', // デフォルト言語
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false // Reactは既にXSSを防いでいるため
    },

    // 対応言語
    lng: 'ja',
    supportedLngs: ['ja', 'en'],
    
    // 言語切り替え時の処理
    react: {
      useSuspense: false
    }
  });

export default i18n;
