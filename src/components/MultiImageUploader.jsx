import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiImage, FiX, FiCheckCircle, FiAlertCircle, FiLoader, FiTrash2 } from 'react-icons/fi';
import imageCompression from 'browser-image-compression';
import { compressAndUpload, buildImageUrl } from '../utils/cloudflareImages';
import { supabase } from '../lib/supabase';

const MultiImageUploader = ({ 
  productId, 
  maxImages = 3,
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1024,
  accountHash = null,
  variant = 'public',
  onUploadComplete = () => {},
  onError = () => {},
  className = ''
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Cloudflare Images の設定（実際の運用時は環境変数から取得）
  const CF_ACCOUNT_HASH = accountHash || process.env.REACT_APP_CF_ACCOUNT_HASH || 'your-account-hash';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} は画像ファイルではありません`);
        return false;
      }
      
      // ファイルサイズチェック（5MB制限）
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} は5MBを超えています`);
        return false;
      }
      
      return true;
    });

    // 最大枚数チェック
    const remainingSlots = maxImages - selectedFiles.length;
    if (validFiles.length > remainingSlots) {
      alert(`最大${maxImages}枚まで選択できます。残り${remainingSlots}枚です。`);
      validFiles.splice(remainingSlots);
    }

    setSelectedFiles(prev => [...prev, ...validFiles.slice(0, remainingSlots)]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress({});

    try {
      const uploadedImagesData = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        try {
          // 進捗更新
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'compressing', progress: 0 }
          }));

          // 1. 画像を圧縮
          const compressedFile = await imageCompression(file, {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker: true,
            onProgress: (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [i]: { status: 'compressing', progress }
              }));
            }
          });

          // 進捗更新
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'uploading', progress: 50 }
          }));

          // 2. Cloudflare Images へアップロード
          const result = await compressAndUpload(compressedFile, { 
            maxSizeMB: 1, // 圧縮済みなので1MBに設定
            maxWidthOrHeight: 1600 
          });

          // 進捗更新
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'saving', progress: 80 }
          }));

          // 3. 表示用URL生成
          const displayUrl = buildImageUrl({ 
            accountHash: CF_ACCOUNT_HASH, 
            imageId: result.imageId, 
            variant 
          });

          // 4. Supabase に保存
          const imageData = {
            file,
            imageId: result.imageId,
            url: displayUrl,
            uploadedAt: new Date()
          };

          // 商品IDがある場合はSupabaseに保存
          if (productId) {
            await saveImageToSupabase(productId, result.imageId, displayUrl);
          }

          uploadedImagesData.push(imageData);

          // 進捗更新
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'completed', progress: 100 }
          }));

        } catch (error) {
          console.error(`画像${i + 1}のアップロードエラー:`, error);
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'error', progress: 0, error: error.message }
          }));
          onError(error);
        }
      }

      setUploadedImages(prev => [...prev, ...uploadedImagesData]);
      setSelectedFiles([]);
      setUploadProgress({});
      onUploadComplete(uploadedImagesData);

    } catch (error) {
      console.error('アップロードエラー:', error);
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const saveImageToSupabase = async (productId, imageId, imageUrl) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          image_id: imageId,
          image_url: imageUrl 
        })
        .eq('id', productId);

      if (error) throw error;
    } catch (error) {
      console.error('Supabase保存エラー:', error);
      throw error;
    }
  };

  const removeUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'compressing': return 'bg-blue-500';
      case 'uploading': return 'bg-yellow-500';
      case 'saving': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'compressing': return '圧縮中...';
      case 'uploading': return 'アップロード中...';
      case 'saving': return '保存中...';
      case 'completed': return '完了';
      case 'error': return 'エラー';
      default: return '待機中';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* アップロードエリア */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: dragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            画像をドラッグ&ドロップ
          </p>
          <p className="text-gray-500 mb-4">
            または
          </p>
          <button 
            type="button"
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
          >
            ファイルを選択
          </button>
          <p className="text-sm text-gray-400 mt-2">
            最大{maxImages}枚まで（JPEG, PNG, WebP、5MB以下）
          </p>
        </motion.div>
      </div>

      {/* 選択されたファイル一覧 */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-700">
              選択された画像 ({selectedFiles.length}/{maxImages})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`選択画像 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white rounded-full p-1">
                    <FiImage className="w-3 h-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* アップロード進捗 */}
      <AnimatePresence>
        {uploading && Object.keys(uploadProgress).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-700">アップロード進捗</h4>
            {Object.entries(uploadProgress).map(([index, progress]) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    画像 {parseInt(index) + 1}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getStatusText(progress.status)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.status)}`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.error && (
                  <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* アップロード済み画像一覧 */}
      <AnimatePresence>
        {uploadedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-700">
              アップロード済み画像 ({uploadedImages.length}件)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uploadedImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={`アップロード画像 ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = URL.createObjectURL(image.file);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-green-500 text-white rounded-full p-1">
                    <FiCheckCircle className="w-3 h-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* アップロードボタン */}
      {selectedFiles.length > 0 && !uploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={handleUpload}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center space-x-2 mx-auto"
          >
            <FiUpload className="w-5 h-5" />
            <span>{selectedFiles.length}枚の画像をアップロード</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default MultiImageUploader;

