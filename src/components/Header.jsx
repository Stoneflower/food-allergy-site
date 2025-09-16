import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';

const { FiSearch, FiMenu, FiX, FiMapPin, FiUser, FiChevronDown, FiCamera, FiPlus, FiAlertTriangle, FiHeart } = FiIcons;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const {
    searchKeyword,
    setSearchKeyword,
    selectedArea,
    setSelectedArea,
    selectedAllergies,
    setSelectedAllergies,
    allergyOptions,
    selectedCategory,
    setSelectedCategory,
    categories,
    userSettings,
    isLoggedIn
  } = useRestaurant();

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/search');
    setIsMenuOpen(false);
    setShowMobileSearch(false);
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
      {/* Important Notice Bar */}
      <div className="bg-red-600 text-white text-sm py-2 border-b border-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
          <div className="flex items-center space-x-2 text-center">
            <SafeIcon icon={FiAlertTriangle} className="w-4 h-4 text-yellow-300 flex-shrink-0" />
            <span className="font-medium">
              （重要）情報は日々変わることがあるため、必ずお店、もしくは商品の成分の確認をお願いします
            </span>
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Left side with Logo - PC版とスマホ版両方に表示 */}
          <div className="flex items-center space-x-6">
            {/* Logo - PC版とスマホ版共通 */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">📸</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-bold text-white">CanIEat?</span>
                  <span className="text-orange-200 text-sm font-bold">✓</span>
                </div>
                <span className="text-orange-200 text-xs font-medium">みんなで共有</span>
              </div>
            </Link>
            
            {/* PC版のみ表示するテキスト */}
            <span className="font-medium hidden md:block">食べられるものをみんなで簡単共有</span>
          </div>

          {/* Mobile - アクションボタンのみ */}
          <div className="md:hidden flex items-center space-x-2">
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
              <SafeIcon icon={FiSearch} className="w-6 h-6" />
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
            {/* より目立つ投稿ボタン */}
            <Link
              to="/upload"
              className="relative group"
            >
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-orange-900 px-6 py-3 rounded-xl font-bold hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <SafeIcon icon={FiCamera} className="w-5 h-5" />
                <span>📸 商品を撮影して共有</span>
              </div>
              {/* ホバー時のツールチップ */}
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                商品パッケージを撮影するだけ！
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </Link>
            <Link
              to="/about"
              className="hover:text-orange-200 transition-colors font-medium"
            >
              CanIEat?について
            </Link>
            <Link
              to="/login"
              className="hover:text-orange-200 transition-colors font-medium"
            >
              無料会員登録・ログイン
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header - シンプルな検索バー */}
      <header className="bg-white shadow-lg sticky top-0 z-50 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 検索バー */}
          <div className="flex justify-center items-center h-16">
            <form onSubmit={handleSearch} className="w-full max-w-6xl">
              <div className="bg-white border-2 border-orange-400 rounded-lg overflow-visible flex shadow-md">
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
                    placeholder="エリア・駅"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="h-12 px-4 bg-blue-50 border-l border-blue-200 text-sm font-medium text-gray-700 focus:outline-none hover:bg-blue-100 transition-colors"
                    style={{ minWidth: '120px' }}
                  />
                </div>

                {/* Allergy Selection - 拡張されたエリア */}
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setShowAllergyDropdown(!showAllergyDropdown)}
                    className="h-12 w-full px-4 bg-red-50 border-l border-red-200 text-sm font-medium text-gray-700 focus:outline-none hover:bg-red-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-1 min-w-0 flex-1">
                      <span className="whitespace-nowrap">アレルギーを選択</span>
                      {selectedAllergies.length > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                          {selectedAllergies.length}
                        </span>
                      )}
                    </div>
                    <SafeIcon icon={FiChevronDown} className="w-4 h-4 ml-2 flex-shrink-0" />
                  </button>

                  {/* Allergy Dropdown Menu */}
                  {showAllergyDropdown && (
                    <>
                      {/* 背景オーバーレイ */}
                      <div 
                        className="fixed inset-0 z-[9998]" 
                        onClick={() => setShowAllergyDropdown(false)}
                      />
                      
                      {/* ドロップダウンメニュー */}
                      <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-b-lg shadow-2xl z-[9999]"
                           style={{ width: '700px', maxWidth: '95vw' }}>
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
                              {allergyOptions.slice(0, 8).map(allergy => (
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
                              ))}
                            </div>
                          </div>

                          {/* 推奨20品目（特定原材料に準ずるもの） */}
                          <div className="max-h-48 overflow-y-auto">
                            <h5 className="text-xs font-semibold text-orange-800 mb-2">
                              表示が推奨される20品目（特定原材料に準ずるもの）
                            </h5>
                            <div className="grid grid-cols-5 gap-2">
                              {allergyOptions.slice(8).map(allergy => (
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
                              ))}
                            </div>
                          </div>

                          {/* User Settings Notice */}
                          {!isLoggedIn && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                              💡 会員登録すると、微量・加熱の詳細設定が可能です
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Search Button - コンパクトに */}
                <button
                  type="submit"
                  className="h-12 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <SafeIcon icon={FiSearch} className="w-5 h-5" />
                  <span>検索</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Search - 28品目すべて表示 */}
      {showMobileSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-white shadow-lg border-t border-gray-200 py-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearch} className="space-y-3">
              {/* Mobile Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ カテゴリー
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 4).map(category => (
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
                      <div className="text-center">
                        <div className="text-lg mb-1">{category.icon}</div>
                        <div className="font-medium text-xs">{category.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Area Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 エリア・駅
                </label>
                <input
                  type="text"
                  placeholder="渋谷、新宿、池袋など"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Mobile Allergy Selection - 28品目すべて表示 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ⚠️ 含まれるアレルギー成分
                  </label>
                  {selectedAllergies.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllergies}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      クリア
                    </button>
                  )}
                </div>
                
                {/* 法定8品目（特定原材料） */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-red-800 mb-2">
                    表示義務のある8品目（特定原材料）
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {allergyOptions.slice(0, 8).map(allergy => (
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
                    ))}
                  </div>
                </div>

                {/* 推奨20品目（特定原材料に準ずるもの） */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-orange-800 mb-2">
                    表示が推奨される20品目（特定原材料に準ずるもの）
                  </h4>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {allergyOptions.slice(8).map(allergy => (
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
                    ))}
                  </div>
                </div>

                {selectedAllergies.length > 0 && (
                  <div className="mt-2 text-xs text-red-700">
                    {selectedAllergies.length}個の成分が選択されています
                  </div>
                )}

                {/* User Settings Notice for Mobile */}
                {!isLoggedIn && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    💡 会員登録すると、微量・加熱の詳細設定が可能です
                  </div>
                )}
              </div>

              {/* Mobile Keyword Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 商品名、レストラン名で検索
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
                検索
              </button>
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
                to="/upload"
                className="flex items-center space-x-3 px-4 py-3 text-orange-600 hover:bg-orange-50 rounded-lg font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                <SafeIcon icon={FiCamera} className="w-5 h-5" />
                <span>商品を投稿する</span>
              </Link>
              <Link
                to="/about"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                CanIEat?について
              </Link>
              <Link
                to="/login"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                無料会員登録・ログイン
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Header;