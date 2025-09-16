import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRestaurant } from '../context/RestaurantContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../lib/supabase';

const { 
  FiStar, 
  FiMapPin, 
  FiPhone, 
  FiClock, 
  FiDollarSign, 
  FiArrowLeft,
  FiShield,
  FiCheck,
  FiX,
  FiInfo
} = FiIcons;

const RestaurantDetail = () => {
  const { id } = useParams();
  const { restaurants, allergyOptions } = useRestaurant();
  const [activeTab, setActiveTab] = useState('overview');
  const [dbProduct, setDbProduct] = useState(null);
  const [dbMenuItems, setDbMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const isDbId = typeof id === 'string' && id.startsWith('db_');

  useEffect(() => {
    if (!isDbId) return;
    const productId = parseInt(id.slice(3), 10);
    if (!productId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data: prod, error: pErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        if (pErr) throw pErr;
        const { data: items, error: mErr } = await supabase
          .from('menu_items')
          .select('id,name,created_at')
          .eq('product_id', productId)
          .order('id', { ascending: false });
        if (mErr) throw mErr;
        if (!cancelled) {
          setDbProduct(prod);
          setDbMenuItems(items || []);
        }
      } catch (e) {
        console.warn('DB detail load failed:', e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isDbId]);

  const sampleRestaurant = restaurants.find(r => r.id === parseInt(id, 10));
  const resolvedRestaurant = isDbId && dbProduct ? {
    id: `db_${dbProduct.id}`,
    name: dbProduct.name,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200',
    rating: 4.5,
    reviewCount: dbMenuItems.length || 0,
    area: '',
    price: '',
    description: dbProduct.description || '共有データ（Supabase）',
    cuisine: dbProduct.category || 'レストラン',
    allergyInfo: {},
  } : sampleRestaurant;

  if (!resolvedRestaurant) {
    if (loading && isDbId) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">読み込み中...</div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">レストランが見つかりません</h2>
          <Link to="/" className="text-orange-500 hover:text-orange-600">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const getAllergyInfo = () => {
    return allergyOptions.map(allergy => ({
      ...allergy,
      isSafe: !(resolvedRestaurant.allergyInfo && resolvedRestaurant.allergyInfo[allergy.id])
    }));
  };

  const safeAllergies = getAllergyInfo().filter(a => a.isSafe);
  const unsafeAllergies = getAllergyInfo().filter(a => !a.isSafe);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96">
        <img
          src={resolvedRestaurant.image}
          alt={resolvedRestaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-6 left-6 bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-3 hover:bg-opacity-100 transition-all"
        >
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold text-white mb-4">{resolvedRestaurant.name}</h1>
              <div className="flex items-center space-x-6 text-white">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-semibold">{resolvedRestaurant.rating}</span>
                  <span className="text-gray-300">({resolvedRestaurant.reviewCount}件のレビュー)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMapPin} className="w-5 h-5" />
                  <span>{resolvedRestaurant.area}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiDollarSign} className="w-5 h-5" />
                  <span>{resolvedRestaurant.price}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: '概要' },
                  { id: 'allergy', label: 'アレルギー情報' },
                  { id: 'reviews', label: 'レビュー' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold mb-3">レストラン紹介</h3>
                      <p className="text-gray-600 leading-relaxed">{resolvedRestaurant.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-3">料理ジャンル</h3>
                      <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                        {resolvedRestaurant.cuisine}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-3">アレルギー対応の特徴</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {safeAllergies.slice(0, 4).map(allergy => (
                          <div key={allergy.id} className="flex items-center space-x-2 text-green-600">
                            <SafeIcon icon={FiCheck} className="w-5 h-5" />
                            <span>{allergy.icon} {allergy.name}フリー</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'allergy' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <SafeIcon icon={FiShield} className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-green-800">対応可能なアレルギー</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {safeAllergies.map(allergy => (
                          <div key={allergy.id} className="flex items-center space-x-2 text-green-700">
                            <SafeIcon icon={FiCheck} className="w-4 h-4" />
                            <span className="text-sm">{allergy.icon} {allergy.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {unsafeAllergies.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <SafeIcon icon={FiX} className="w-5 h-5 text-red-600" />
                          <h3 className="text-lg font-semibold text-red-800">含まれる可能性のあるアレルギー成分</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {unsafeAllergies.map(allergy => (
                            <div key={allergy.id} className="flex items-center space-x-2 text-red-700">
                              <SafeIcon icon={FiX} className="w-4 h-4" />
                              <span className="text-sm">{allergy.icon} {allergy.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-800">ご注意</h3>
                      </div>
                      <p className="text-blue-700 text-sm">
                        アレルギー情報は参考情報です。ご来店の際は必ず店舗に直接ご確認ください。
                        調理器具の共用や製造工程での混入の可能性もございます。
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <SafeIcon icon={FiStar} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">レビュー機能は準備中です</h3>
                    <p className="text-gray-500">近日中にレビュー機能を追加予定です</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">店舗情報</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <SafeIcon icon={FiMapPin} className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">住所</p>
                    <p className="text-gray-600 text-sm">{resolvedRestaurant.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <SafeIcon icon={FiPhone} className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">電話番号</p>
                    <p className="text-gray-600 text-sm">{resolvedRestaurant.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <SafeIcon icon={FiClock} className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">営業時間</p>
                    <p className="text-gray-600 text-sm">{resolvedRestaurant.hours}</p>
                    <p className="text-gray-600 text-sm">定休日: {resolvedRestaurant.closed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Allergy Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">アレルギー対応</h3>
              <div className="space-y-3">
                {safeAllergies.slice(0, 6).map(allergy => (
                  <div key={allergy.id} className="flex items-center justify-between">
                    <span className="text-sm">{allergy.icon} {allergy.name}</span>
                    <SafeIcon icon={FiCheck} className="w-4 h-4 text-green-500" />
                  </div>
                ))}
                {safeAllergies.length > 6 && (
                  <p className="text-sm text-gray-500 text-center">
                    他 {safeAllergies.length - 6} 項目に対応
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;