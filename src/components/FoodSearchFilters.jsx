import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import AllergyLegend from './AllergyLegend';

const { FiFilter, FiSearch, FiChevronDown, FiChevronUp, FiSettings, FiX } = FiIcons;

const FoodSearchFilters = ({ filters, onFiltersChange, userSettings, onShowSettings }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const safetyLevels = [
    { id: 'all', name: 'すべて表示', emoji: '🔍', color: 'bg-gray-100' },
    { id: 'safe', name: 'OK のみ', emoji: '✅', color: 'bg-green-100' },
    { id: 'caution', name: '注意以下', emoji: '⚠️', color: 'bg-yellow-100' },
    { id: 'warning', name: 'NG以下', emoji: '❌', color: 'bg-red-100' }
  ];

  const categories = [
    { id: 'all', name: 'すべて', emoji: '🍽️' },
    { id: 'snacks', name: 'お菓子', emoji: '🍪' },
    { id: 'drinks', name: '飲み物', emoji: '🥤' },
    { id: 'bread', name: 'パン', emoji: '🍞' },
    { id: 'dairy', name: '乳製品', emoji: '🥛' },
    { id: 'meat', name: '肉類', emoji: '🥩' },
    { id: 'vegetables', name: '野菜', emoji: '🥬' },
    { id: 'fruits', name: '果物', emoji: '🍎' }
  ];

  // 法定8品目（特定原材料）
  const mandatoryAllergens = [
    { id: 'egg', name: '卵', emoji: '🥚' },
    { id: 'milk', name: '乳', emoji: '🥛' },
    { id: 'wheat', name: '小麦', emoji: '🌾' },
    { id: 'buckwheat', name: 'そば', emoji: '🍜' },
    { id: 'peanut', name: '落花生', emoji: '🥜' },
    { id: 'shrimp', name: 'えび', emoji: '🦐' },
    { id: 'crab', name: 'かに', emoji: '🦀' },
    { id: 'walnut', name: 'くるみ', emoji: '🌰' }
  ];

  // 推奨20品目（特定原材料に準ずるもの）
  const recommendedAllergens = [
    { id: 'almond', name: 'アーモンド', emoji: '🌰' },
    { id: 'abalone', name: 'あわび', emoji: '🐚' },
    { id: 'squid', name: 'いか', emoji: '🦑' },
    { id: 'salmon_roe', name: 'いくら', emoji: '🟠' },
    { id: 'orange', name: 'オレンジ', emoji: '🍊' },
    { id: 'cashew', name: 'カシューナッツ', emoji: '🥜' },
    { id: 'kiwi', name: 'キウイフルーツ', emoji: '🥝' },
    { id: 'beef', name: '牛肉', emoji: '🥩' },
    { id: 'gelatin', name: 'ゼラチン', emoji: '🍮' },
    { id: 'sesame', name: 'ごま', emoji: '🌱' },
    { id: 'salmon', name: 'さけ', emoji: '🐟' },
    { id: 'mackerel', name: 'さば', emoji: '🐟' },
    { id: 'soy', name: '大豆', emoji: '🫘' },
    { id: 'chicken', name: '鶏肉', emoji: '🐔' },
    { id: 'banana', name: 'バナナ', emoji: '🍌' },
    { id: 'pork', name: '豚肉', emoji: '🥓' },
    { id: 'matsutake', name: 'まつたけ', emoji: '🍄' },
    { id: 'peach', name: 'もも', emoji: '🍑' },
    { id: 'yam', name: 'やまいも', emoji: '🍠' },
    { id: 'apple', name: 'りんご', emoji: '🍎' }
  ];

  const allergensList = [...mandatoryAllergens, ...recommendedAllergens];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleAllergen = (allergenId) => {
    const current = filters.excludeAllergens || [];
    const updated = current.includes(allergenId)
      ? current.filter(id => id !== allergenId)
      : [...current, allergenId];
    handleFilterChange('excludeAllergens', updated);
  };

  const clearFilters = () => {
    onFiltersChange({
      keyword: '',
      safetyLevel: 'all',
      category: 'all',
      excludeAllergens: []
    });
  };

  const activeFiltersCount =
    (filters.keyword ? 1 : 0) +
    (filters.safetyLevel && filters.safetyLevel !== 'all' ? 1 : 0) +
    (filters.category && filters.category !== 'all' ? 1 : 0) +
    (filters.excludeAllergens?.length || 0);

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="商品名で検索..."
          value={filters.keyword || ''}
          onChange={(e) => handleFilterChange('keyword', e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
        />
      </div>

      {/* 基本フィルター */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <SafeIcon icon={FiFilter} className="w-5 h-5" />
            <span>フィルター</span>
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              色分け説明
            </button>
            <button
              onClick={onShowSettings}
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiSettings} className="w-4 h-4" />
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        {/* 安全レベル選択 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">🛡️ 安全レベル</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {safetyLevels.map(level => (
              <motion.button
                key={level.id}
                onClick={() => handleFilterChange('safetyLevel', level.id)}
                className={`p-3 rounded-lg border-2 text-sm transition-all ${
                  filters.safetyLevel === level.id
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{level.emoji}</div>
                  <div className="font-medium">{level.name}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* カテゴリー選択 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">🏷️ カテゴリー</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {categories.map(category => (
              <motion.button
                key={category.id}
                onClick={() => handleFilterChange('category', category.id)}
                className={`p-3 rounded-lg border-2 text-sm transition-all ${
                  filters.category === category.id
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">{category.emoji}</div>
                  <div className="font-medium text-xs">{category.name}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* アレルギー除外設定 - 28品目すべて表示 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">🚫 除外するアレルギー成分</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
            >
              <span className="text-xs">詳細設定</span>
              <SafeIcon icon={showAdvanced ? FiChevronUp : FiChevronDown} className="w-4 h-4" />
            </button>
          </div>

          {/* 法定8品目（特定原材料） */}
          <div className="mb-4">
            <h5 className="text-xs font-semibold text-red-800 mb-2">
              表示義務のある8品目（特定原材料）
            </h5>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {mandatoryAllergens.map(allergen => (
                <motion.button
                  key={allergen.id}
                  onClick={() => toggleAllergen(allergen.id)}
                  className={`p-2 rounded-lg border-2 text-xs transition-all ${
                    (filters.excludeAllergens || []).includes(allergen.id)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white border-gray-200 hover:border-green-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{allergen.emoji}</div>
                    <div className="font-medium">{allergen.name}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 推奨20品目（特定原材料に準ずるもの） */}
          <div className="mb-4">
            <h5 className="text-xs font-semibold text-orange-800 mb-2">
              表示が推奨される20品目（特定原材料に準ずるもの）
            </h5>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {recommendedAllergens.map(allergen => (
                <motion.button
                  key={allergen.id}
                  onClick={() => toggleAllergen(allergen.id)}
                  className={`p-2 rounded-lg border-2 text-xs transition-all ${
                    (filters.excludeAllergens || []).includes(allergen.id)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white border-gray-200 hover:border-green-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{allergen.emoji}</div>
                    <div className="font-medium">{allergen.name}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 詳細設定 */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h5 className="font-medium text-gray-900 mb-3">⚙️ 詳細設定</h5>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>現在の設定:</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• 微量: {userSettings?.allowTrace ? '✅ 許可' : '❌ 除外'}</li>
                  <li>• 加熱済み: {userSettings?.allowHeated ? '✅ 許可' : '❌ 除外'}</li>
                  <li>• 重度レベル: {userSettings?.severityLevel || '中程度'}</li>
                </ul>
                <button
                  onClick={onShowSettings}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  設定を変更する →
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 色分け説明 */}
      {showLegend && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <AllergyLegend compact={false} />
        </motion.div>
      )}
    </div>
  );
};

export default FoodSearchFilters;