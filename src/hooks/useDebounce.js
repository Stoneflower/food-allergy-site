import { useState, useEffect } from 'react';

// カスタムdebounceフック
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 入力用のdebounceフック（入力中は即座に更新、検索は遅延）
export const useDebouncedInput = (initialValue = '', delay = 300) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const debouncedValue = useDebounce(inputValue, delay);

  return {
    inputValue,
    setInputValue,
    debouncedValue
  };
};
