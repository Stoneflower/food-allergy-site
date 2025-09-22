import { useState } from "react";
import imageCompression from "browser-image-compression";
import { getUploadUrl, saveImageUrlToSupabase } from "../utils/cloudflareImages";

export default function SimpleImageUploader({ productId }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // 最大3枚
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);

    try {
      const urls = [];

      for (const file of selectedFiles) {
        // 1. 画像を圧縮
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });

        // 2. Netlify Function で署名付きURL取得
        const { uploadURL, id } = await getUploadUrl(productId);

        // 3. Cloudflare Images へアップロード
        await fetch(uploadURL, {
          method: "POST",
          body: compressedFile,
        });

        // 4. 表示用URL生成
        const displayUrl = `https://imagedelivery.net/YOUR_ACCOUNT_HASH/${id}/public`;
        urls.push(displayUrl);

        // 5. Supabase に保存
        await saveImageUrlToSupabase(productId, id, displayUrl);
      }

      setUploadedUrls(urls);
      alert("アップロード完了！");
    } catch (err) {
      console.error(err);
      alert("アップロード失敗");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4">画像アップローダー</h3>
      
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
        <p className="text-sm text-gray-500 mt-1">
          最大3枚まで選択可能（JPEG, PNG, WebP、5MB以下）
        </p>
      </div>

      <button 
        onClick={handleUpload} 
        disabled={uploading || selectedFiles.length === 0}
        className="w-full py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "アップロード中..." : `${selectedFiles.length}枚の画像をアップロード`}
      </button>

      {/* 選択されたファイル一覧 */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">選択された画像:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`選択画像 ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アップロード済み画像一覧 */}
      {uploadedUrls.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">アップロード済み画像:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {uploadedUrls.map((url, idx) => (
              <img 
                key={idx} 
                src={url} 
                alt={`uploaded-${idx}`} 
                className="w-full h-24 object-cover rounded border"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

