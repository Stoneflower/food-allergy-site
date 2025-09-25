import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiTestTube } from 'react-icons/fi';
import TestAllergyDataManager from '../components/TestAllergyDataManager';
import SupabaseQueryTester from '../components/SupabaseQueryTester';

const TestAllergyDataPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            to="/admin-tools"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            管理ツールに戻る
          </Link>
          
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mr-4">
              <FiTestTube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                テスト用アレルギー情報管理
              </h1>
              <p className="text-gray-600">
                データベースにテスト用のアレルギー情報を追加・確認します
              </p>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <SupabaseQueryTester />
          <TestAllergyDataManager />
        </motion.div>

        {/* 説明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            このツールについて
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>
              • 既存の商品とアレルギー品目を使用してテスト用のアレルギー情報を追加します
            </p>
            <p>
              • アレルギー情報の表示機能をテストするために使用します
            </p>
            <p>
              • 既存のアレルギー情報を確認して、データベースの状態を把握できます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAllergyDataPage;
