import React, { useState } from 'react';
import { testSupabaseQuery, testSearchServiceQuery } from '../utils/testSupabaseQuery';

const SupabaseQueryTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState('');

  const handleTestBasicQuery = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const results = await testSupabaseQuery();
      setResults(results);
      setMessage('✅ 基本クエリテスト完了');
    } catch (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSearchServiceQuery = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const results = await testSearchServiceQuery();
      setResults(results);
      setMessage('✅ searchServiceクエリテスト完了');
    } catch (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Supabaseクエリテスト</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={handleTestBasicQuery}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'テスト中...' : '基本クエリテスト'}
          </button>
          
          <button
            onClick={handleTestSearchServiceQuery}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'テスト中...' : 'searchServiceクエリテスト'}
          </button>
        </div>

        {message && (
          <div className="p-3 bg-gray-100 rounded">
            {message}
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">テスト結果:</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="text-sm text-gray-600">
              コンソールログを確認してください。詳細なテスト結果が表示されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseQueryTester;
