import React from 'react';
import { motion } from 'framer-motion';
import { useRestaurant } from '../context/RestaurantContext';

const CategoryFilter = () => {
  const { categories, selectedCategory, setSelectedCategory } = useRestaurant();

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      {categories.map((category, index) => (
        <motion.button
          key={category.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          onClick={() => setSelectedCategory(category.id)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all duration-200
            ${selectedCategory === category.id
              ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-105'
              : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
            }
          `}
        >
          <span className="text-lg">{category.icon}</span>
          <span className="font-medium">{category.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;