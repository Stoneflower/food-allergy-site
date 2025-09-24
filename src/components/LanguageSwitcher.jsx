import React from 'react';
import { useTranslation } from 'react-i18next';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGlobe } = FiIcons;

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    
    // RTL言語の場合はHTMLのdir属性を変更
    const html = document.documentElement;
    const rtlLanguages = ['ar', 'he'];
    
    if (rtlLanguages.includes(langCode)) {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', langCode);
      html.classList.add('rtl');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', langCode);
      html.classList.remove('rtl');
    }
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
        <SafeIcon icon={FiGlobe} className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:block">{currentLanguage.flag} {currentLanguage.name}</span>
        <span className="text-sm font-medium sm:hidden">{currentLanguage.flag}</span>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center space-x-3 ${
                i18n.language === language.code ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
              {i18n.language === language.code && (
                <span className="ml-auto text-orange-600">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
