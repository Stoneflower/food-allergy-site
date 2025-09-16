import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import RestaurantCard from './RestaurantCard';
import ProductCard from './ProductCard';
import SupermarketCard from './SupermarketCard';
import OnlineShopCard from './OnlineShopCard';

const { FiHeart } = FiIcons;

const FavoritesSection = () => {
  const { favorites, allItems } = useRestaurant();

  const favoriteItems = allItems.filter(item => {
    const favoriteId = `${item.category}-${item.id}`;
    return favorites.includes(favoriteId);
  });

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

  if (favoriteItems.length === 0) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiHeart} className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              お気に入りはまだありません
            </h3>
            <p className="text-gray-600">
              気になるレストランや商品をお気に入りに追加してみましょう
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">💖</span>
            <h2 className="text-3xl font-bold text-gray-900">お気に入り</h2>
          </div>
          <p className="text-gray-600">
            あなたがお気に入りに追加した {favoriteItems.length} 件のアイテム
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteItems.map((item, index) => (
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
      </div>
    </section>
  );
};

export default FavoritesSection;