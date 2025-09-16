import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiAlertTriangle, FiX, FiInfo, FiThermometer } = FiIcons;

const AllergyStatusIcon = ({ allergen, userSettings = {}, size = 'md', showTooltip = true }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // ユーザー設定のデフォルト値
  const settings = {
    allowTrace: userSettings.allowTrace ?? false, // 微量OK/NG
    allowHeated: userSettings.allowHeated ?? true, // 加熱済みOK/NG
    ...userSettings
  };

  // 安全レベルの判定ロジック
  const getSafetyLevel = () => {
    const { amount_category, heat_sensitive, source } = allergen;
    
    // 含有量が多い場合は常に危険
    if (amount_category === '含有') {
      return 'danger';
    }
    
    // 微量の場合の判定
    if (amount_category === '微量') {
      // 加熱で変化する＆ユーザーが加熱済みOKの場合
      if (heat_sensitive && settings.allowHeated) {
        return 'safe'; // 緑：OK
      }
      
      // 加熱で変化するが加熱なしの場合
      if (heat_sensitive && !settings.allowHeated) {
        return 'caution-heat'; // 黄：加熱注意
      }
      
      // ユーザーが微量OKの場合
      if (settings.allowTrace) {
        return 'safe'; // 緑：OK
      }
      
      return 'caution-trace'; // オレンジ：微量注意
    }
    
    // 少量の場合
    if (amount_category === '少量') {
      // ユーザーが微量OKでも少量は注意
      return 'warning'; // 赤：NG
    }
    
    // 不明な場合
    return 'caution-unknown';
  };

  const safetyLevel = getSafetyLevel();

  // 表示設定
  const configs = {
    safe: {
      icon: FiCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      label: 'OK',
      emoji: '✅'
    },
    'caution-heat': {
      icon: FiThermometer,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      label: '加熱注意',
      emoji: '🔥'
    },
    'caution-trace': {
      icon: FiAlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      label: '微量注意',
      emoji: '⚠️'
    },
    warning: {
      icon: FiX,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      label: 'NG',
      emoji: '❌'
    },
    danger: {
      icon: FiX,
      color: 'text-red-700',
      bgColor: 'bg-red-200',
      borderColor: 'border-red-300',
      label: '危険',
      emoji: '🚫'
    },
    'caution-unknown': {
      icon: FiInfo,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      label: '不明',
      emoji: '❓'
    }
  };

  const config = configs[safetyLevel];

  // サイズ設定
  const sizes = {
    sm: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-sm'
    },
    lg: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-base'
    }
  };

  const sizeConfig = sizes[size];

  // 詳細メッセージの生成
  const getDetailMessage = () => {
    const messages = {
      safe: allergen.heat_sensitive && settings.allowHeated
        ? '🔥 加熱済みなので安全です'
        : '✅ この量なら大丈夫です',
      'caution-heat': '🔥 加熱すれば安全な可能性があります\n⚠️ 生の場合は注意してください',
      'caution-trace': '⚠️ 微量含まれています\n個人差があるので注意してください',
      warning: '❌ 少量含まれているため注意が必要です',
      danger: '🚫 多く含まれているため避けてください',
      'caution-unknown': '❓ 含有量が不明のため注意してください'
    };

    return messages[safetyLevel] || messages['caution-unknown'];
  };

  // 対象者情報の生成
  const getTargetInfo = () => {
    const targetInfos = {
      safe: {
        canEat: ['軽度のアレルギーの方', '微量OK設定の方'],
        cantEat: ['重度のアレルギーの方', '完全除去が必要な方']
      },
      'caution-heat': {
        canEat: ['加熱済み食品なら食べられる方'],
        cantEat: ['生の状態では食べられない方', '加熱でも症状が出る方']
      },
      'caution-trace': {
        canEat: ['微量なら症状が出ない方'],
        cantEat: ['微量でも症状が出る方', '完全除去が必要な方']
      },
      warning: {
        canEat: ['症状が軽い方（医師と相談）'],
        cantEat: ['ほとんどの方']
      },
      danger: {
        canEat: [],
        cantEat: ['すべてのアレルギーの方']
      }
    };

    return targetInfos[safetyLevel] || targetInfos['caution-unknown'];
  };

  const targetInfo = getTargetInfo();

  return (
    <div className="relative">
      <motion.div
        className={`
          ${sizeConfig.container}
          ${config.bgColor}
          ${config.borderColor}
          border-2 rounded-full
          flex items-center justify-center
          cursor-pointer
          hover:scale-110 transition-all duration-200
        `}
        onClick={() => showTooltip && setShowDetails(!showDetails)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <SafeIcon 
          icon={config.icon} 
          className={`${sizeConfig.icon} ${config.color}`}
        />
      </motion.div>

      {/* 簡単ラベル */}
      <div className={`
        absolute -bottom-6 left-1/2 transform -translate-x-1/2
        ${sizeConfig.text} font-bold ${config.color}
        whitespace-nowrap
      `}>
        {config.label}
      </div>

      {/* 詳細ツールチップ */}
      {showDetails && showTooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"
        >
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 w-80 max-w-sm">
            {/* ヘッダー */}
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">{config.emoji}</span>
              <div>
                <h4 className="font-bold text-gray-900">{allergen.allergen_name}</h4>
                <p className="text-sm text-gray-600">{config.label}</p>
              </div>
            </div>

            {/* 詳細メッセージ */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {getDetailMessage()}
              </p>
            </div>

            {/* 詳細情報 */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">含有量:</span>
                <span className="font-medium">{allergen.amount_category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">由来:</span>
                <span className="font-medium">{allergen.source}</span>
              </div>
              {allergen.heat_sensitive && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">加熱:</span>
                  <span className="font-medium text-orange-600">🔥 加熱で変化</span>
                </div>
              )}
            </div>

            {/* 対象者情報 */}
            <div className="border-t border-gray-200 pt-3">
              <h5 className="font-semibold text-gray-900 mb-2 text-sm">👥 対象者の目安</h5>
              
              {targetInfo.canEat.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-green-700 font-medium mb-1">✅ 食べられる可能性がある方:</p>
                  <ul className="text-xs text-green-600 space-y-1">
                    {targetInfo.canEat.map((target, index) => (
                      <li key={index}>• {target}</li>
                    ))}
                  </ul>
                </div>
              )}

              {targetInfo.cantEat.length > 0 && (
                <div>
                  <p className="text-xs text-red-700 font-medium mb-1">❌ 避けた方がよい方:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {targetInfo.cantEat.map((target, index) => (
                      <li key={index}>• {target}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 注意書き */}
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              ⚠️ 個人差があります。必ず医師にご相談ください
            </div>

            {/* 閉じるボタン */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <SafeIcon icon={FiX} className="w-3 h-3 text-gray-600" />
            </button>
          </div>

          {/* 吹き出しの矢印 */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-gray-200 rotate-45"></div>
        </motion.div>
      )}

      {/* 背景オーバーレイ */}
      {showDetails && showTooltip && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default AllergyStatusIcon;