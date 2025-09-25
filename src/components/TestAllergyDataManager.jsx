import React, { useState } from 'react';
import { addTestAllergyData, checkExistingAllergyData } from '../utils/addTestAllergyData';

const TestAllergyDataManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [existingData, setExistingData] = useState([]);

  const handleAddTestData = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      await addTestAllergyData();
      setMessage('✅ テスト用アレルギー情報を追加しました');
    } catch (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckExistingData = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const data = await checkExistingAllergyData();
      setExistingData(data || []);
      setMessage(`📊 既存のアレルギー情報: ${data?.length || 0}件`);
    } catch (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">テスト用アレルギー情報管理</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={handleAddTestData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '追加中...' : 'テスト用アレルギー情報を追加'}
          </button>
          
          <button
            onClick={handleCheckExistingData}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? '確認中...' : '既存のアレルギー情報を確認'}
          </button>
        </div>

        {message && (
          <div className="p-3 bg-gray-100 rounded">
            {message}
          </div>
        )}

        {existingData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">既存のアレルギー情報:</h3>
            <div className="space-y-2">
              {existingData.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium">
                    {item.products?.name} - {item.allergy_items?.name} {item.allergy_items?.icon}
                  </div>
                  <div className="text-sm text-gray-600">
                    含有タイプ: {item.presence_type} | 含有量: {item.amount_level}
                  </div>
                  {item.notes && (
                    <div className="text-sm text-gray-500">
                      備考: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAllergyDataManager;
