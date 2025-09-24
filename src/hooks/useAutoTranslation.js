import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import translationService from '../services/translationService';

// 自動翻訳対応のカスタムフック
export const useAutoTranslation = () => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [translationStats, setTranslationStats] = useState({
    manual: 0,
    cached: 0,
    total: 0
  });

  // 翻訳統計を更新
  const updateStats = () => {
    setTranslationStats(translationService.getTranslationStats());
  };

  // 翻訳を取得（手動→自動のフォールバック）
  const t = async (key, options = {}) => {
    const currentLanguage = i18n.language;
    const fallbackLanguage = i18n.options.fallbackLng || 'ja';
    
    // デフォルト言語の場合は翻訳不要
    if (currentLanguage === fallbackLanguage) {
      return key;
    }

    try {
      setIsLoading(true);
      const translation = await translationService.getTranslation(
        key, 
        currentLanguage, 
        fallbackLanguage
      );
      updateStats();
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return key; // エラー時は元のキーを返す
    } finally {
      setIsLoading(false);
    }
  };

  // 一括翻訳
  const translateBatch = async (keys) => {
    const currentLanguage = i18n.language;
    const fallbackLanguage = i18n.options.fallbackLng || 'ja';
    
    if (currentLanguage === fallbackLanguage) {
      return keys.reduce((acc, key) => ({ ...acc, [key]: key }), {});
    }

    try {
      setIsLoading(true);
      const translations = await translationService.translateBatch(
        keys, 
        currentLanguage, 
        fallbackLanguage
      );
      updateStats();
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: key }), {});
    } finally {
      setIsLoading(false);
    }
  };

  // 手動翻訳を追加
  const addManualTranslation = (key, translation) => {
    translationService.setManualTranslation(key, translation, i18n.language);
    updateStats();
  };

  // 手動翻訳を削除
  const removeManualTranslation = (key) => {
    translationService.removeManualTranslation(key, i18n.language);
    updateStats();
  };

  // キャッシュをクリア
  const clearCache = () => {
    translationService.clearCache();
    updateStats();
  };

  // 手動翻訳一覧を取得
  const getManualTranslations = () => {
    return translationService.getManualTranslations();
  };

  useEffect(() => {
    updateStats();
  }, [i18n.language]);

  return {
    t,
    translateBatch,
    addManualTranslation,
    removeManualTranslation,
    clearCache,
    getManualTranslations,
    isLoading,
    translationStats
  };
};

export default useAutoTranslation;
