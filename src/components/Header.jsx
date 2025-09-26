import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from './LanguageSwitcher';

const { FiSearch, FiMenu, FiX, FiMapPin, FiUser, FiChevronDown, FiCamera, FiPlus, FiAlertTriangle, FiHeart } = FiIcons;

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  
  // デバッグ用：showAllergyDropdownの状態変化を監視
  useEffect(() => {
    console.log('showAllergyDropdown状態が変更されました:', showAllergyDropdown);
  }, [showAllergyDropdown]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const {
    searchKeyword,
    setSearchKeyword,
    selectedArea,
    areaInputValue,
    setAreaInputValue,
    executeSearch,
    selectedAllergies,
    setSelectedAllergies,
    allergyOptions,
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedFragranceForSearch,
    selectedTraceForSearch,
    // userSettings, // 未使用
    // isLoggedIn  // コンテキストでは管理せず、Supabaseのセッションで判定
  } = useRestaurant();

  // デバッグ用ログ
  console.log('Header - allergyOptions:', allergyOptions);
  console.log('Header - allergyOptions length:', allergyOptions?.length);

  const navigate = useNavigate();
  const location = useLocation();

  // 重要情報バーを表示するページのリスト
  const showImportantNoticePages = [
    '/upload',
    '/search', 
    '/login',
    '/contact',
    '/terms',
    '/privacy'
  ];

  const shouldShowImportantNotice = showImportantNoticePages.includes(location.pathname);

  // 認証状態（Supabaseセッション）
  const [isAuthed, setIsAuthed] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(!!data?.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // ルート遷移時に各種オーバーレイ/メニューを閉じる（クリックブロック対策）
  useEffect(() => {
    setShowAllergyDropdown(false);
    setIsMenuOpen(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(); // 検索実行
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    navigate('/search', { state: { scrollTo: isMobile ? 'results' : 'notice' } });
    setIsMenuOpen(false);
    setShowMobileSearch(false);
    
    // 検索結果ページに遷移後のスクロールは遷移先で処理
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsMenuOpen(false);
      navigate('/');
    } catch (e) {
      console.warn('logout failed', e);
    }
  };

  // Enterキーでの検索実行
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch(); // 検索実行
      navigate('/search');
    }
  };

  const toggleAllergy = (allergyId) => {
    setSelectedAllergies(prev =>
      prev.includes(allergyId)
        ? prev.filter(id => id !== allergyId)
        : [...prev, allergyId]
    );
  };

  const clearAllergies = () => {
    setSelectedAllergies([]);
  };

  return (
    <>
      {/* Important Notice Bar - 特定のページでのみ表示 */}
      {shouldShowImportantNotice && (
        <div className="bg-red-600 text-white text-sm py-2 border-b border-red-700" data-testid="important-notice-bar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
            <div className="flex items-center space-x-2 text-center">
              <SafeIcon icon={FiAlertTriangle} className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span className="font-medium">
                {t('header.importantNotice')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm py-3 relative z-[10001]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Left side with Logo - PC版とスマホ版両方に表示 */}
          <div className="flex items-center space-x-6">
            {/* Logo - PC版とスマホ版共通 */}
            <Link to="/" className="flex items-center space-x-3 p-2 -m-2 rounded-lg hover:bg-white/10 transition-colors">
              {/* アイコンはPC版のみ表示 */}
              <div className="hidden md:block w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🍦</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-bold text-white">CanIEatOo?</span>
                </div>
                <span className="text-orange-200 text-xs font-medium">{t('common.appTagline')}</span>
              </div>
            </Link>
            
            {/* PC版のみ表示するテキスト */}
            <span className="font-medium hidden md:block">{t('common.welcome')}</span>
          </div>

          {/* Mobile - アクションボタンのみ */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Language Switcher */}
            <LanguageSwitcher />
            <Link
              to="/upload"
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <SafeIcon icon={FiPlus} className="w-6 h-6" />
            </Link>
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <SafeIcon icon={showMobileSearch ? FiX : FiSearch} className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <SafeIcon icon={isMenuOpen ? FiX : FiMenu} className="w-6 h-6" />
            </button>
          </div>
          
          {/* PC版の右側メニュー - 「商品を投稿」をより目立つように */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* より目立つ投稿ボタン */}
            <Link
              to={isAuthed ? "/upload" : "/login"}
              state={isAuthed ? undefined : { redirectTo: '/upload', message: 'upload_requires_login' }}
              className="relative group"
            >
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-orange-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <SafeIcon icon={FiCamera} className="w-5 h-5" />
                <span>{t('header.menu.upload')}</span>
              </div>
              {/* ホバー時のツールチップ */}
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                {t('header.menu.uploadTooltip')}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </Link>
            <Link
              to="/contact"
              className="hover:text-orange-200 transition-colors font-medium"
            >
              {t('header.links.contact')}
            </Link>
            <Link
              to="/about"
              className="hover:text-orange-200 transition-colors font-medium"
            >
              {t('header.links.about')}
            </Link>
            {isAuthed ? (
              <>
                <Link
                  to="/mypage"
                  className="hover:text-orange-200 transition-colors font-medium"
                >
                  {t('header.menu.myPage')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:text-orange-200 transition-colors font-medium"
                >
                  {t('header.menu.logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hover:text-orange-200 transition-colors font-medium"
              >
                {t('header.links.loginRegister')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header - シンプルな検索バー */}
      <header className="bg-white shadow-lg sticky top-0 z-50 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 検索バー */}
          <div className="flex justify-center items-center h-16">
            <form onSubmit={handleSearch} className="w-full max-w-6xl">
              <div className="bg-white border-2 border-orange-400 rounded-lg flex shadow-md">
                {/* Category Dropdown */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-12 px-4 bg-orange-50 border-r border-orange-200 text-sm font-medium text-gray-700 focus:outline-none hover:bg-orange-100 transition-colors appearance-none cursor-pointer"
                    style={{ minWidth: '120px' }}
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="県名"
                    value={areaInputValue}
                    onChange={(e) => setAreaInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 px-4 bg-blue-50 border-l border-blue-200 text-sm font-medium text-gray-700 focus:outline-none hover:bg-blue-100 transition-colors"
                    style={{ minWidth: '120px' }}
                  />
                </div>

                {/* Allergy Selection - 拡張されたエリア */}
                <div className="relative flex-1" style={{ zIndex: 10000 }}>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('アレルギー選択ボタンクリック');
                      console.log('現在のshowAllergyDropdown:', showAllergyDropdown);
                      const newValue = !showAllergyDropdown;
                      console.log('新しい値に設定:', newValue);
                      setShowAllergyDropdown(newValue);
                    }}
                    className="h-12 w-full px-4 bg-red-50 border-l border-red-200 text-sm font-medium text-gray-700 focus:outline-none hover:bg-red-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-1 min-w-0 flex-1">
                      <span className="whitespace-nowrap">アレルギーを選択</span>
                      {(() => {
                        const keys = new Set([
                          ...(selectedAllergies || []).map(id => `N:${id}`),
                          ...(selectedFragranceForSearch || []).map(id => `F:${id}`),
                          ...(selectedTraceForSearch || []).map(id => `T:${id}`)
                        ]);
                        const total = keys.size;
                        return total > 0 ? (
                          <span className="bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center ml-2">
                            {total}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <SafeIcon icon={FiChevronDown} className="w-4 h-4 ml-2 flex-shrink-0" />
                  </button>

                  {/* Allergy Dropdown Menu */}
                  {showAllergyDropdown ? (
                    console.log('ドロップダウンメニュー表示中 - showAllergyDropdown:', showAllergyDropdown) ||
                    <>
                      {/* 背景オーバーレイ */}
                      <div 
                        className="fixed inset-0 z-[9998]" 
                        onClick={() => setShowAllergyDropdown(false)}
                      />
                      
                      {/* ドロップダウンメニュー */}
                      <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-b-lg shadow-2xl max-h-[80vh] overflow-y-auto overscroll-contain"
                           style={{ 
                             width: '700px', 
                             maxWidth: '95vw',
                             zIndex: 99999
                           }}>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">含まれるアレルギー成分</h4>
                            {selectedAllergies.length > 0 && (
                              <button
                                type="button"
                                onClick={clearAllergies}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                クリア
                              </button>
                            )}
                          </div>
                          
                          {/* 法定8品目（特定原材料） */}
                          <div className="mb-4">
                            <h5 className="text-xs font-semibold text-red-800 mb-2">
                              表示義務のある8品目（特定原材料）
                            </h5>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {allergyOptions && allergyOptions.length > 0 ? allergyOptions.slice(0, 8).map(allergy => (
                                <button
                                  key={allergy.id}
                                  type="button"
                                  onClick={() => toggleAllergy(allergy.id)}
                                  className={`p-2 rounded-lg border-2 text-xs transition-all ${
                                    selectedAllergies.includes(allergy.id)
                                      ? 'bg-red-500 text-white border-red-500'
                                      : 'bg-white border-gray-200 hover:border-red-300'
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="text-lg mb-1">{allergy.icon}</div>
                                    <div className="font-medium">{allergy.name}</div>
                                  </div>
                                </button>
                              )) : (
                                <div className="col-span-4 text-center text-gray-500 py-4">
                                  アレルギー項目を読み込み中...
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 推奨20品目（特定原材料に準ずるもの） */}
                          <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <h5 className="text-xs font-semibold text-orange-800 mb-2">
                              表示が推奨される20品目（特定原材料に準ずるもの）
                            </h5>
                            <div className="grid grid-cols-5 gap-2">
                              {allergyOptions && allergyOptions.length > 8 ? allergyOptions.slice(8).map(allergy => (
                                <button
                                  key={allergy.id}
                                  type="button"
                                  onClick={() => toggleAllergy(allergy.id)}
                                  className={`p-2 rounded-lg border-2 text-xs transition-all ${
                                    selectedAllergies.includes(allergy.id)
                                      ? 'bg-red-500 text-white border-red-500'
                                      : 'bg-white border-gray-200 hover:border-red-300'
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="text-lg mb-1">{allergy.icon}</div>
                                    <div className="font-medium">{allergy.name}</div>
                                  </div>
                                </button>
                              )) : (
                                <div className="col-span-5 text-center text-gray-500 py-4">
                                  アレルギー項目を読み込み中...
                                </div>
                              )}
                            </div>
                          </div>

                          {/* User Settings Notice */}
                          {!isAuthed && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                              💡 会員登録すると、微量・加熱の詳細設定が可能です
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    console.log('ドロップダウンメニュー非表示 - showAllergyDropdown:', showAllergyDropdown)
                  )}
                </div>

                {/* Search Button - コンパクトに */}
                <button
                  type="submit"
                  className="h-12 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <SafeIcon icon={FiSearch} className="w-5 h-5" />
                  <span>{t('header.searchButton')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Search - 28品目すべて表示 */}
      {showMobileSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-x-0 top-28 bottom-0 z-[10000] bg-white overflow-auto"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            {/* ヘッダー下の余白を確保して見出しが隠れないようにする */}
            <div className="h-2" aria-hidden="true" />
            <form onSubmit={handleSearch} className="space-y-3">
              {/* Mobile Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ {t('header.mobile.categoryLabel')}
                </label>
                {/* 1列・5ボタン（「すべて」を含む） */}
                <div className="grid grid-cols-1 gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        selectedCategory === category.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">{category.icon}</div>
                        <div className="font-medium text-sm">{category.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Area Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 {t('header.mobile.areaLabel')}
                </label>
                <input
                  type="text"
                  placeholder="兵庫県、大阪府、東京都など"
                  value={areaInputValue}
                  onChange={(e) => setAreaInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Mobile Allergy Selection - 28品目すべて表示 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ⚠️ {t('header.mobile.allergyLabel')}
                  </label>
                  {selectedAllergies.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllergies}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      {t('header.mobile.clear')}
                    </button>
                  )}
                </div>
                
                {/* 法定8品目（特定原材料） */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-red-800 mb-2">
                    表示義務のある8品目（特定原材料）
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {allergyOptions && allergyOptions.length > 0 ? allergyOptions.slice(0, 8).map(allergy => (
                      <button
                        key={allergy.id}
                        type="button"
                        onClick={() => toggleAllergy(allergy.id)}
                        className={`p-2 rounded-lg border-2 text-xs transition-all ${
                          selectedAllergies.includes(allergy.id)
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{allergy.icon}</div>
                          <div className="font-medium">{allergy.name}</div>
                        </div>
                      </button>
                    )) : (
                      <div className="col-span-3 text-center text-gray-500 py-4">
                        アレルギー項目を読み込み中...
                      </div>
                    )}
                  </div>
                </div>

                {/* 推奨20品目（特定原材料に準ずるもの） */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-orange-800 mb-2">
                    表示が推奨される20品目（特定原材料に準ずるもの）
                  </h4>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {allergyOptions && allergyOptions.length > 8 ? allergyOptions.slice(8).map(allergy => (
                      <button
                        key={allergy.id}
                        type="button"
                        onClick={() => toggleAllergy(allergy.id)}
                        className={`p-2 rounded-lg border-2 text-xs transition-all ${
                          selectedAllergies.includes(allergy.id)
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{allergy.icon}</div>
                          <div className="font-medium">{allergy.name}</div>
                        </div>
                      </button>
                    )) : (
                      <div className="col-span-3 text-center text-gray-500 py-4">
                        アレルギー項目を読み込み中...
                      </div>
                    )}
                  </div>
                </div>

                {selectedAllergies.length > 0 && (
                  <div className="mt-2 text-xs text-red-700">
                    {selectedAllergies.length}個の成分が選択されています
                  </div>
                )}

                {/* User Settings Notice for Mobile */}
                {!isAuthed && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    💡 会員登録すると、微量・加熱の詳細設定が可能です
                  </div>
                )}
              </div>

              {/* Mobile Keyword Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 {t('header.mobile.keywordLabel')}
                </label>
                <div className="relative">
                  <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="商品名、レストラン名で検索"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors"
              >
                {t('header.searchButton')}
              </button>
              {/* ガード: 下に他ページの要素が見えないよう全画面固定＋余白終端 */}
              <div className="pb-6" />
            </form>
          </div>
        </motion.div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-white shadow-lg border-t border-gray-200 py-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <Link
                to="/"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 ホーム
              </Link>
              <Link
                to={isAuthed ? "/upload" : "/login"}
                state={isAuthed ? undefined : { redirectTo: '/upload', message: 'upload_requires_login' }}
                className="flex items-center space-x-3 px-4 py-3 text-orange-600 hover:bg-orange-50 rounded-lg font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                <SafeIcon icon={FiCamera} className="w-5 h-5" />
                <span>商品を投稿する</span>
              </Link>
              <Link
                to="/contact"
                className="flex items-center space-x-3 px-4 py-3 text-blue-700 hover:bg-blue-50 rounded-lg font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>✉️ お問合せ</span>
              </Link>
              <Link
                to="/about"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                CanIEatOo?について
              </Link>
              {isAuthed ? (
                <>
                  <Link
                    to="/mypage"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    マイページ
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  無料会員登録・ログイン
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Header;