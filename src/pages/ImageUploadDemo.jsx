import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MultiImageUploader from '../components/MultiImageUploader';
import SimpleImageUploader from '../components/SimpleImageUploader';

const ImageUploadDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('multi');
  const [demoProductId, setDemoProductId] = useState(1);

  const demos = [
    {
      id: 'multi',
      name: '高機能画像アップローダー',
      description: 'ドラッグ&ドロップ、進捗表示、プレビュー機能付き',
      component: (
        <MultiImageUploader
          productId={demoProductId}
          maxImages={3}
          maxSizeMB={0.5}
          maxWidthOrHeight={1024}
          accountHash={process.env.REACT_APP_CF_ACCOUNT_HASH || 'demo-hash'}
          variant="w=800,q=75"
          onUploadComplete={(uploadedImages) => {
            console.log('アップロード完了:', uploadedImages);
            alert(`${uploadedImages.length}件の画像がアップロードされました！`);
          }}
          onError={(error) => {
            console.error('アップロードエラー:', error);
            alert(`アップロードエラー: ${error.message}`);
          }}
        />
      )
    },
    {
      id: 'simple',
      name: 'シンプル画像アップローダー',
      description: '基本的な機能のみの軽量版',
      component: (
        <SimpleImageUploader productId={demoProductId} />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            画像アップローダー デモ
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Cloudflare Imagesを使用した画像アップロード機能のデモページです。
            最大3枚までの画像を選択して、圧縮・アップロード・表示URL生成まで一貫して行います。
          </p>
        </motion.div>

        {/* デモ選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">デモを選択</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demos.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => setSelectedDemo(demo.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedDemo === demo.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{demo.name}</h3>
                  <p className="text-sm text-gray-600">{demo.description}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 設定パネル */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">設定</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品ID（デモ用）
                </label>
                <input
                  type="number"
                  value={demoProductId}
                  onChange={(e) => setDemoProductId(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cloudflare Account Hash
                </label>
                <input
                  type="text"
                  value={process.env.REACT_APP_CF_ACCOUNT_HASH || 'demo-hash'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  環境変数設定状況
                </label>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    process.env.REACT_APP_CF_ACCOUNT_HASH ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-600">
                    {process.env.REACT_APP_CF_ACCOUNT_HASH ? '設定済み' : '未設定'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* デモコンポーネント */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {demos.find(d => d.id === selectedDemo)?.name}
            </h2>
            <p className="text-gray-600 mb-6">
              {demos.find(d => d.id === selectedDemo)?.description}
            </p>
            {demos.find(d => d.id === selectedDemo)?.component}
          </div>
        </motion.div>

        {/* 使用法の説明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">使用方法</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. 環境変数の設定</h3>
                <p className="text-sm text-gray-600 mb-2">
                  以下の環境変数を設定してください：
                </p>
                <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                  <div>REACT_APP_CF_ACCOUNT_HASH=your-cloudflare-account-hash</div>
                  <div>CF_ACCOUNT_ID=your-cloudflare-account-id (Netlify Functions用)</div>
                  <div>CF_IMAGES_API_TOKEN=your-cloudflare-images-api-token (Netlify Functions用)</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. 画像のアップロード</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 最大3枚までの画像を選択</li>
                  <li>• 自動的に画像が圧縮される（最大0.5MB、1024px）</li>
                  <li>• Cloudflare Imagesにアップロード</li>
                  <li>• 表示用URLが生成される</li>
                  <li>• Supabaseにimage_idが保存される</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. 表示URLの形式</h3>
                <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                  https://imagedelivery.net/&#123;accountHash&#125;/&#123;imageId&#125;/&#123;variant&#125;
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  例: https://imagedelivery.net/abc123def456/image-id/w=800,q=75
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImageUploadDemo;

