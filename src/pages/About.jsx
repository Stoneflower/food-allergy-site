import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShield, FiHeart, FiUsers, FiStar, FiTrendingUp, FiCheckCircle, FiHelpCircle } = FiIcons;

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="text-6xl">🤔</span>
              <div>
                <h1 className="text-4xl md:text-6xl font-bold">
                  CanIEatOo? について
                </h1>
                <p className="text-2xl md:text-3xl font-medium text-orange-200 mt-2">
                  食べれる？
                </p>
              </div>
              <span className="text-6xl">✅</span>
            </div>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto">
              「これ食べても大丈夫？」そんな疑問を抱える食物アレルギーをお持ちの方に、
              安心してお食事を楽しめるレストラン情報をお届けする専門検索サイトです
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <span className="text-4xl">💭</span>
              <h2 className="text-3xl font-bold text-gray-900">私たちのミッション</h2>
              <span className="text-4xl">💡</span>
            </div>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              食物アレルギーをお持ちの方が外食時に感じる不安や疑問を解消し、
              「これ食べても大丈夫？」という質問に明確にお答えできる環境を提供することが私たちの使命です。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center p-6 bg-orange-50 rounded-xl"
            >
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiHelpCircle} className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">疑問解決</h3>
              <p className="text-gray-700">
                「これ食べても大丈夫？」という日常の疑問に、詳細なアレルギー情報で明確にお答えします
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center p-6 bg-green-50 rounded-xl"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiShield} className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">安全保障</h3>
              <p className="text-gray-700">
                厳格な基準でアレルギー情報を管理し、安心して外食を楽しめる環境を提供します
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center p-6 bg-blue-50 rounded-xl"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiHeart} className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-blue-800">心の安心</h3>
              <p className="text-gray-700">
                アレルギーをお持ちの方とそのご家族が、心から安心して食事を楽しめる社会を目指します
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              こんな経験はありませんか？
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">😰</span>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">外食時の不安</h3>
                    <p className="text-red-700 text-sm">「このメニュー、私のアレルギー成分は入ってる？」</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤷‍♀️</span>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">情報不足</h3>
                    <p className="text-yellow-700 text-sm">「店員さんに聞いても詳しく分からない...」</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">😔</span>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">選択肢の限定</h3>
                    <p className="text-blue-700 text-sm">「結局いつも同じお店ばかり...」</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className="text-center mb-6">
                <span className="text-5xl">💡</span>
                <h3 className="text-2xl font-bold text-gray-900 mt-4">CanIEatOo?の解決策</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">詳細なアレルギー情報</h4>
                    <p className="text-gray-600 text-sm">28品目すべてのアレルギー情報を事前に確認できます</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">安心のレストラン選び</h4>
                    <p className="text-gray-600 text-sm">アレルギー対応に積極的なお店だけを厳選掲載</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">新しい発見</h4>
                    <p className="text-gray-600 text-sm">今まで知らなかった安全なお店との出会いを提供</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">サービスの特徴</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">28品目完全対応</h3>
                  <p className="text-gray-600">
                    法定8品目と推奨20品目、全28品目のアレルギー情報に完全対応しています
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">厳選されたレストラン</h3>
                  <p className="text-gray-600">
                    アレルギー対応に真摯に取り組むレストランのみを厳選して掲載しています
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <SafeIcon icon={FiCheckCircle} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">リアルタイム情報更新</h3>
                  <p className="text-gray-600">
                    レストランと連携し、メニューやアレルギー情報をリアルタイムで更新しています
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg p-8"
            >
              <h3 className="text-xl font-semibold mb-6 text-center">サービス統計</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiStar} className="w-6 h-6 text-yellow-500" />
                    <span className="font-medium">掲載レストラン数</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">10,000+</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiUsers} className="w-6 h-6 text-blue-500" />
                    <span className="font-medium">登録ユーザー数</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">50,000+</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-green-500" />
                    <span className="font-medium">月間検索数</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">100,000+</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiShield} className="w-6 h-6 text-red-500" />
                    <span className="font-medium">対応アレルギー品目</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">28品目</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="text-5xl">🍽️</span>
              <h2 className="text-3xl font-bold">
                もう「食べても大丈夫？」で悩まない
              </h2>
              <span className="text-5xl">✨</span>
            </div>
            <p className="text-xl mb-8 opacity-90">
              無料会員登録で、より詳細なアレルギー情報やお気に入り機能をご利用いただけます
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              今すぐ無料登録して安心な食事を始める
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;