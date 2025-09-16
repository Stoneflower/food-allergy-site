import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import RestaurantCard from './RestaurantCard';
import ProductCard from './ProductCard';
import SupermarketCard from './SupermarketCard';
import OnlineShopCard from './OnlineShopCard';

const { FiMapPin, FiNavigation, FiLoader } = FiIcons;

const LocationFinder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyItems, setNearbyItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const { getNearbyItems } = useRestaurant();

  const getCurrentLocation = () => {
    setIsLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          try {
            const items = await getNearbyItems(latitude, longitude);
            setNearbyItems(items);
          } catch (error) {
            console.error('周辺情報の取得に失敗:', error);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('位置情報の取得に失敗:', error);
          // モックデータで代替
          setTimeout(() => {
            setUserLocation({ latitude: 35.6762, longitude: 139.6503 }); // 渋谷
            getNearbyItems(35.6762, 139.6503).then(setNearbyItems);
            setIsLoading(false);
          }, 1000);
        }
      );
    } else {
      // モックデータで代替
      setTimeout(() => {
        setUserLocation({ latitude: 35.6762, longitude: 139.6503 });
        getNearbyItems(35.6762, 139.6503).then(setNearbyItems);
        setIsLoading(false);
      }, 1000);
    }
  };

  const renderCard = (item) => {
    switch (item.category) {
      case 'products':
        return <ProductCard key={`product-${item.id}`} product={item} />;
      case 'supermarkets':
        return <SupermarketCard key={`supermarket-${item.id}`} supermarket={item} />;
      case 'online':
        return <OnlineShopCard key={`online-${item.id}`} shop={item} />;
      case 'restaurants':
      default:
        return <RestaurantCard key={`restaurant-${item.id}`} restaurant={item} />;
    }
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-4xl">📍</span>
            <h2 className="text-3xl font-bold text-gray-900">周辺のアレルギー対応店舗</h2>
            <span className="text-4xl">🗺️</span>
          </div>
          <p className="text-gray-600 mb-6">
            現在地周辺のアレルギー対応レストランや商品を見つけられます
          </p>

          {!userLocation ? (
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
            >
              {isLoading ? (
                <>
                  <SafeIcon icon={FiLoader} className="w-5 h-5 animate-spin" />
                  <span>位置情報を取得中...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={FiNavigation} className="w-5 h-5" />
                  <span>現在地から検索</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 inline-block">
              <div className="flex items-center space-x-2 text-blue-800">
                <SafeIcon icon={FiMapPin} className="w-5 h-5" />
                <span className="font-medium">
                  渋谷エリア周辺の情報を表示中
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {nearbyItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              周辺で見つかった {nearbyItems.length} 件のアレルギー対応施設
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyItems.map((item, index) => (
                <motion.div
                  key={`${item.category}-${item.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderCard(item)}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default LocationFinder;