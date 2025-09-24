import React from 'react';
import { motion } from 'framer-motion';
import TranslationManager from '../components/TranslationManager';
import UsageWarning from '../components/UsageWarning';
import { FiGlobe, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const TranslationManagerPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              to="/admin-tools" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 mr-2" />
              管理ツールに戻る
            </Link>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <FiGlobe className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                翻訳管理システム
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              DeepL API Free プランを使用した自動翻訳と手動翻訳の管理システム
            </p>
          </motion.div>
        </div>

        {/* 使用量警告 */}
        <UsageWarning />

        {/* 翻訳管理コンポーネント */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TranslationManager />
        </motion.div>

        {/* 機能説明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🤖 自動翻訳</h3>
            <p className="text-gray-600 text-sm">
              DeepL API Free プランで月50万文字まで高精度翻訳。食品・成分表に特化した翻訳品質。
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">✏️ 手動翻訳</h3>
            <p className="text-gray-600 text-sm">
              重要な翻訳は手動で追加・編集。自動翻訳より優先され、品質を保証。
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 使用量監視</h3>
            <p className="text-gray-600 text-sm">
              リアルタイム使用量表示、予測機能、警告システムで制限内運用をサポート。
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TranslationManagerPage;
