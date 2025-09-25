import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFileText, FiUpload, FiSettings, FiDatabase, FiGlobe, FiActivity } from 'react-icons/fi';
import TestAllergyDataManager from '../components/TestAllergyDataManager';

const AdminTools = () => {
  const tools = [
    {
      title: 'PDF処理システム',
      description: 'PDF → OCR → CSV → プレビュー → アップロード',
      path: '/pdf-processor',
      icon: FiFileText,
      color: 'from-blue-500 to-purple-500'
    },
    {
      title: 'CSV変換ツール',
      description: 'CSVファイルの変換・調整・アップロード',
      path: '/csv-converter',
      icon: FiUpload,
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'データベース管理',
      description: 'Supabaseデータベースの管理・確認',
      path: '/database-admin',
      icon: FiDatabase,
      color: 'from-orange-500 to-red-500'
    },
    {
      title: '翻訳管理システム',
      description: 'DeepL API翻訳・手動翻訳・使用量監視',
      path: '/translation-manager',
      icon: FiGlobe,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'システム設定',
      description: 'アプリケーション設定・環境変数確認',
      path: '/system-settings',
      icon: FiSettings,
      color: 'from-gray-500 to-gray-700'
    },
    {
      title: 'テスト用アレルギー情報',
      description: 'テスト用アレルギー情報の追加・確認',
      path: '/test-allergy-data',
      icon: FiActivity,
      color: 'from-red-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            管理ツール
          </h1>
          <p className="text-lg text-gray-600">
            システム管理・データ処理用の隠しツール
          </p>
        </div>

        {/* ツール一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={tool.path}
                className="block group"
              >
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  {/* アイコン */}
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* タイトル */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>
                  
                  {/* 説明 */}
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  
                  {/* アクセスインジケーター */}
                  <div className="mt-4 flex items-center text-blue-500 text-sm font-medium">
                    <span>アクセス</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 注意事項 */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                注意事項
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>これらのツールは管理者・開発者向けです</li>
                  <li>データの変更・削除には十分注意してください</li>
                  <li>URLは直接アクセス可能ですが、一般ユーザーには公開されていません</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクセス */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクセス</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">PDF処理:</span>
              <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-gray-800">
                /#/pdf-processor
              </code>
            </div>
            <div>
              <span className="font-medium text-gray-700">管理ツール:</span>
              <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-gray-800">
                /#/admin-tools
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTools;
