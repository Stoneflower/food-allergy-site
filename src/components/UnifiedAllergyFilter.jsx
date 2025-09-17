import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';

const { FiX, FiChevronDown, FiChevronUp } = FiIcons;

const UnifiedAllergyFilter = ({ onAllergyChange, selectedAllergies = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { allergyOptions } = useRestaurant();

  const toggleAllergy = (allergyId) => {
    const newSelectedAllergies = selectedAllergies.includes(allergyId)
      ? selectedAllergies.filter(id => id !== allergyId)
      : [...selectedAllergies, allergyId];
    
    if (onAllergyChange) {
      onAllergyChange(newSelectedAllergies);
    }
  };

  const clearAll = () => {
    if (onAllergyChange) {
      onAllergyChange([]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">アレルギー成分フィルター</h3>
        <div className="flex items-center space-x-2">
          {selectedAllergies.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <SafeIcon icon={FiX} className="w-4 h-4" />
              <span>クリア</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            <SafeIcon icon={isExpanded ? FiChevronUp : FiChevronDown} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 選択されたアレルギー成分の表示 */}
      {selectedAllergies.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-800 mb-2">
            除外するアレルギー成分 ({selectedAllergies.length}個):
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedAllergies.map(allergyId => {
              const allergy = allergyOptions.find(a => a.id === allergyId);
              return (
                <span
                  key={allergyId}
                  className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs"
                >
                  <span>{allergy?.icon}</span>
                  <span>{allergy?.name}</span>
                  <button
                    onClick={() => toggleAllergy(allergyId)}
                    className="ml-1 hover:text-orange-600"
                  >
                    <SafeIcon icon={FiX} className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* アレルギー成分選択エリア */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-600">
            選択したアレルギー成分が含まれていない商品のみ表示します
          </p>
          
          {/* 法定8品目（特定原材料） */}
          <div>
            <h4 className="text-sm font-semibold text-red-800 mb-2">
              表示義務のある8品目
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {allergyOptions.slice(0, 8).map(allergy => (
                <button
                  key={allergy.id}
                  onClick={() => toggleAllergy(allergy.id)}
                  className={`p-2 rounded-lg border-2 text-xs transition-all ${
                    selectedAllergies.includes(allergy.id)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white border-gray-200 hover:border-orange-300'
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
          <div>
            <h4 className="text-sm font-semibold text-orange-800 mb-2">
              表示が推奨される20品目
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {allergyOptions.slice(8).map(allergy => (
                <button
                  key={allergy.id}
                  onClick={() => toggleAllergy(allergy.id)}
                  className={`p-2 rounded-lg border-2 text-xs transition-all ${
                    selectedAllergies.includes(allergy.id)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white border-gray-200 hover:border-orange-300'
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
        </motion.div>
      )}

      {/* 折りたたみ状態での簡易表示 */}
      {!isExpanded && selectedAllergies.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedAllergies.length}個のアレルギー成分を除外中
        </div>
      )}
    </div>
  );
};

export default UnifiedAllergyFilter;
