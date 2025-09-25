import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiImage, FiX, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { compressAndUpload, buildImageUrl } from '../utils/cloudflareImages';

const ImageUpload = ({ 
  onImageUploaded, 
  onError,
  maxSizeMB = 1,
  maxWidthOrHeight = 1600,
  accountHash = null,
  variant = 'w=800,q=75',
  accept = 'image/*',
  className = '',
  showPreview = true,
  multiple = false,
  maxImages = 2,
  onImagesReordered
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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
    try { e.target.value = ''; } catch (_) { /* no-op: reselect same file */ }
  };

  const handleFiles = async (files) => {
    if (!multiple && files.length > 1) {
      setError('1つのファイルのみ選択してください');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // 最大枚数の制限（既存＋今回の選択でmaxImagesを超えないように）
      let selectable = files;
      if (multiple) {
        const remaining = Math.max(0, maxImages - uploadedImages.length);
        if (remaining <= 0) {
          throw new Error(`画像は最大${maxImages}枚までです`);
        }
        selectable = files.slice(0, remaining);
        if (files.length > remaining) {
          console.warn(`選択枚数が上限(${maxImages})を超えたため、先頭${remaining}枚のみを受け付けました`);
        }
      }

      const uploadPromises = selectable.map(async (file) => {
        // ファイル形式チェック
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} は画像ファイルではありません`);
        }

        // ファイルサイズチェック（5MB制限）
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} は5MBを超えています`);
        }

        const result = await compressAndUpload(file, { maxSizeMB, maxWidthOrHeight });
        
        const imageData = {
          file,
          imageId: result.imageId,
          url: accountHash ? buildImageUrl({ accountHash, imageId: result.imageId, variant }) : null,
          uploadedAt: new Date()
        };

        return imageData;
      });

      const results = await Promise.all(uploadPromises);
      
      if (multiple) {
        const next = [...uploadedImages, ...results].slice(0, maxImages);
        setUploadedImages(next);
        onImageUploaded?.(next);
      } else {
        setUploadedImages(results);
        onImageUploaded?.(results[0]);
      }

    } catch (err) {
      console.error('画像アップロードエラー:', err);
      setError(err.message || '画像のアップロードに失敗しました');
      onError?.(err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index, direction) => {
    setUploadedImages(prev => {
      const next = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = tmp;
      onImagesReordered?.(next);
      return next;
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
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
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: dragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {uploading ? (
            <>
              <FiLoader className="mx-auto h-12 w-12 text-orange-500 mb-4 animate-spin" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                アップロード中...
              </p>
              <p className="text-gray-500">
                画像を圧縮・アップロードしています
              </p>
            </>
          ) : (
            <>
              <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {multiple ? '画像をドラッグ&ドロップ' : '画像をドラッグ&ドロップ'}
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
            </>
          )}
        </motion.div>
      </div>

      {/* File Info */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>• 対応形式: JPEG, PNG, WebP</p>
        <p>• 最大ファイルサイズ: 5MB</p>
        <p>• 自動で最適化されます（最大 {maxWidthOrHeight}px）</p>
        {multiple && <p>• 複数ファイル選択可能</p>}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Uploaded Images Preview */}
      {showPreview && uploadedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="text-sm font-medium text-gray-700">
            アップロード済み画像 ({uploadedImages.length}件)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(image.file)}
                    alt={`アップロード画像 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {multiple && (
                  <div className="absolute top-1 left-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, 'up')}
                      className="px-1 py-0.5 text-[10px] bg-white/80 border rounded hover:bg-white"
                      disabled={index === 0}
                    >↑</button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 'down')}
                      className="px-1 py-0.5 text-[10px] bg-white/80 border rounded hover:bg-white"
                      disabled={index === uploadedImages.length - 1}
                    >↓</button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-green-500 text-white rounded-full p-1">
                  <FiCheckCircle className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {uploadedImages.length > 0 && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <FiCheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">
              {multiple 
                ? `${uploadedImages.length}件の画像がアップロードされました`
                : '画像がアップロードされました'
              }
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageUpload;

