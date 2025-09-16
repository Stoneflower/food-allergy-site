import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';

const { FiCamera, FiX, FiCheck, FiAlertTriangle } = FiIcons;

const QRScanner = ({ onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const { scanQRCode } = useRestaurant();

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const scanResult = await scanQRCode();
      setResult(scanResult);
    } catch (error) {
      console.error('QRコードスキャンエラー:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">QRコードスキャン</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-xl flex items-center justify-center">
              {isScanning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
                />
              ) : (
                <SafeIcon icon={FiCamera} className="w-16 h-16 text-gray-400" />
              )}
            </div>
            
            <p className="text-gray-600 mb-6">
              商品パッケージのQRコードをスキャンして、アレルギー情報を確認できます
            </p>

            <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isScanning ? 'スキャン中...' : 'QRコードをスキャン'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              result.safe ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <SafeIcon 
                icon={result.safe ? FiCheck : FiAlertTriangle} 
                className={`w-8 h-8 ${result.safe ? 'text-green-600' : 'text-red-600'}`} 
              />
            </div>

            <h4 className="text-lg font-semibold mb-2">{result.productName}</h4>
            
            <div className={`p-4 rounded-lg mb-4 ${
              result.safe ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${result.safe ? 'text-green-800' : 'text-red-800'}`}>
                {result.safe ? '✅ この商品は安全です' : '⚠️ 注意が必要です'}
              </p>
              {result.allergens.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">含まれるアレルギー成分:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.allergens.map(allergen => (
                      <span key={allergen} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              閉じる
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QRScanner;