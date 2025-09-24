import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAutoTranslation from '../hooks/useAutoTranslation';

// 自動翻訳対応のラッパーコンポーネント
const AutoTranslationWrapper = ({ children, translationKeys = [] }) => {
  const { i18n } = useTranslation();
  const { translateBatch } = useAutoTranslation();
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      if (translationKeys.length === 0) return;
      
      setIsLoading(true);
      try {
        const batchTranslations = await translateBatch(translationKeys);
        setTranslations(batchTranslations);
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [i18n.language, translateBatch, translationKeys.join(',')]);

  // 子コンポーネントに翻訳データを渡す
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        translations,
        isLoading
      });
    }
    return child;
  });

  return <>{childrenWithProps}</>;
};

export default AutoTranslationWrapper;
