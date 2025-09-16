import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiAlertTriangle, FiX, FiThermometer, FiInfo } = FiIcons;

const AllergyLegend = ({ compact = false }) => {
  const legends = [
    {
      emoji: '✅',
      icon: FiCheck,
      color: 'text-green-600 bg-green-100',
      label: 'OK',
      description: '安心して食べられます'
    },
    {
      emoji: '🔥',
      icon: FiThermometer,
      color: 'text-yellow-600 bg-yellow-100',
      label: '加熱注意',
      description: '加熱すれば安全な可能性'
    },
    {
      emoji: '⚠️',
      icon: FiAlertTriangle,
      color: 'text-orange-600 bg-orange-100',
      label: '微量注意',
      description: '個人差があるので注意'
    },
    {
      emoji: '❌',
      icon: FiX,
      color: 'text-red-600 bg-red-100',
      label: 'NG',
      description: '避けた方が安全'
    },
    {
      emoji: '🚫',
      icon: FiX,
      color: 'text-red-700 bg-red-200',
      label: '危険',
      description: '絶対に避けてください'
    }
  ];

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
          <SafeIcon icon={FiInfo} className="w-4 h-4" />
          <span>色分けの意味</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {legends.map((legend, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${legend.color}`}>
                <span className="text-xs">{legend.emoji}</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{legend.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
        <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-600" />
        <span>🎨 色分けの意味</span>
      </h3>
      
      <div className="space-y-4">
        {legends.map((legend, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${legend.color} border-2 border-white shadow-sm`}>
              <SafeIcon icon={legend.icon} className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{legend.emoji}</span>
                <span className="font-bold text-gray-900">{legend.label}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{legend.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">👨‍👩‍👧‍👦 親子で安心</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• アイコンと色で直感的に判断できます</li>
              <li>• お子様にも分かりやすい表示です</li>
              <li>• タップすると詳しい情報が見られます</li>
              <li>• 設定で個人に合わせて調整できます</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AllergyLegend;