import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { pdfOCRProcessor } from '../utils/pdfOCR';
import { useRestaurant } from '../context/RestaurantContext';
import PDFLinkManager from './PDFLinkManager';

const { FiUpload, FiLink, FiX, FiFileText, FiAlertCircle, FiCheck, FiRefreshCw, FiEye, FiDatabase } = FiIcons;

const PDFUploader = ({ onResult, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url', 'file', or 'registered'
  const [showLinkManager, setShowLinkManager] = useState(false);
  
  const fileInputRef = useRef(null);
  const { allergyOptions } = useRestaurant();

  const handleURLSubmit = async (e) => {
    e.preventDefault();
    if (!pdfUrl.trim()) return;

    await processPDF(pdfUrl);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('PDFファイルを選択してください');
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    await processPDF(arrayBuffer, file.name);
  };

  const handleRegisteredLinkSelect = (linkResult) => {
    // 登録済みリンクから選択された場合の処理
    setResult(linkResult);
    setProgress({ current: 1, total: 1, status: 'completed' });
    
    if (onResult) {
      onResult(linkResult);
    }
  };

  const processPDF = async (source, fileName = null) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress({ current: 0, total: 1, status: 'initializing' });

    try {
      const options = {
        maxPages: 5, // 最初の5ページのみ処理
        scale: 2.0,
        onProgress: (progressInfo) => {
          setProgress(progressInfo);
        }
      };

      let processingResult;
      if (typeof source === 'string') {
        // URL から処理
        processingResult = await pdfOCRProcessor.processPDFFromURL(source, options);
      } else {
        // ArrayBuffer から処理
        processingResult = await pdfOCRProcessor.processPDFFromBuffer(source, options);
      }

      setResult(processingResult);
      setProgress({ current: 1, total: 1, status: 'completed' });

      if (onResult) {
        onResult(processingResult);
      }

    } catch (err) {
      console.error('PDF処理エラー:', err);
      setError(err.message || 'PDFの処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const getProgressMessage = () => {
    if (!progress) return '';
    
    switch (progress.status) {
      case 'initializing':
        return 'PDF読み込み中...';
      case 'processing':
        return `ページ ${progress.current}/${progress.total} を処理中...`;
      case 'completed':
        return '処理完了';
      default:
        return '処理中...';
    }
  };

  const getAllergyIcon = (allergyId) => {
    const allergy = allergyOptions.find(a => a.id === allergyId);
    return allergy ? allergy.icon : '🔍';
  };

  const getAllergyName = (allergyId) => {
    const allergy = allergyOptions.find(a => a.id === allergyId);
    return allergy ? allergy.name : allergyId;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiFileText} className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">PDF アレルギー情報解析</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {!result && !isProcessing && (
              <div className="space-y-6">
                {/* Method Selection */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setUploadMethod('registered')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      uploadMethod === 'registered'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    登録済みリンク
                  </button>
                  <button
                    onClick={() => setUploadMethod('url')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      uploadMethod === 'url'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    URL から読み込み
                  </button>
                  <button
                    onClick={() => setUploadMethod('file')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      uploadMethod === 'file'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ファイルアップロード
                  </button>
                </div>

                {uploadMethod === 'registered' ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <button
                        onClick={() => setShowLinkManager(true)}
                        className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors shadow-md"
                      >
                        <SafeIcon icon={FiDatabase} className="w-6 h-6" />
                        <span className="text-lg font-semibold">登録済みPDFから選択</span>
                      </button>
                    </div>
                    
                    {/* Popular Links Preview */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">人気の登録済みPDF</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-white rounded p-2">
                          <div>
                            <span className="font-medium">スシロー</span>
                            <span className="text-sm text-gray-600 ml-2">全メニューアレルギー情報</span>
                          </div>
                          <span className="text-xs text-green-600">✓ 検証済み</span>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded p-2">
                          <div>
                            <span className="font-medium">かっぱ寿司</span>
                            <span className="text-sm text-gray-600 ml-2">アレルギー成分一覧</span>
                          </div>
                          <span className="text-xs text-green-600">✓ 検証済み</span>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded p-2">
                          <div>
                            <span className="font-medium">マクドナルド</span>
                            <span className="text-sm text-gray-600 ml-2">アレルゲン情報一覧</span>
                          </div>
                          <span className="text-xs text-green-600">✓ 検証済み</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowLinkManager(true)}
                        className="w-full mt-3 text-green-700 hover:text-green-800 font-medium text-sm"
                      >
                        すべて見る →
                      </button>
                    </div>
                  </div>
                ) : uploadMethod === 'url' ? (
                  <form onSubmit={handleURLSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PDF URL
                      </label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <SafeIcon
                            icon={FiLink}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                          />
                          <input
                            type="url"
                            value={pdfUrl}
                            onChange={(e) => setPdfUrl(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="https://example.com/allergy.pdf"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!pdfUrl.trim()}
                          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                          解析開始
                        </button>
                      </div>
                    </div>
                    
                    {/* Sample URL */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">サンプル URL</h4>
                      <button
                        type="button"
                        onClick={() => setPdfUrl('https://www3.akindo-sushiro.co.jp/pdf/menu/allergy.pdf')}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        スシロー アレルギー情報PDF
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PDF ファイル
                      </label>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center space-x-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-8 hover:bg-gray-100 transition-colors"
                      >
                        <SafeIcon icon={FiUpload} className="w-8 h-8 text-gray-400" />
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">
                            PDFファイルを選択
                          </div>
                          <div className="text-sm text-gray-500">
                            クリックしてファイルを選択してください
                          </div>
                        </div>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">ご注意</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• PDF解析には数分かかる場合があります</li>
                        <li>• 最初の5ページのみ処理されます</li>
                        <li>• 日本語と英語のアレルギー情報を検出します</li>
                        <li>• 結果は参考情報として利用してください</li>
                        <li>• 登録済みリンクは検証済みで高速処理が可能です</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getProgressMessage()}
                </h3>
                {progress && progress.total > 1 && (
                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {progress.current} / {progress.total} ページ
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">エラーが発生しました</h4>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setResult(null);
                  }}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  再試行
                </button>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">解析結果</h4>
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">
                      信頼度: {result.consolidatedInfo.confidence}%
                    </span>
                  </div>
                </div>

                {/* Restaurant Info (if from registered link) */}
                {result.restaurantInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 mb-2">レストラン情報</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>店舗名:</strong> {result.restaurantInfo.name}</p>
                      <p><strong>カテゴリー:</strong> {result.restaurantInfo.category}</p>
                      {result.restaurantInfo.area && (
                        <p><strong>エリア:</strong> {result.restaurantInfo.area}</p>
                      )}
                      <p><strong>説明:</strong> {result.restaurantInfo.description}</p>
                    </div>
                  </div>
                )}

                {/* Detected Allergies */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">検出されたアレルギー成分</h5>
                  {result.consolidatedInfo.foundAllergies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {result.consolidatedInfo.foundAllergies.map(allergyId => (
                        <div
                          key={allergyId}
                          className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg p-2"
                        >
                          <span className="text-lg">{getAllergyIcon(allergyId)}</span>
                          <span className="text-sm font-medium text-red-800">
                            {getAllergyName(allergyId)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">アレルギー成分は検出されませんでした</p>
                  )}
                </div>

                {/* Menu Items */}
                {result.consolidatedInfo.menuItems.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">検出されたメニュー項目</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.consolidatedInfo.menuItems.slice(0, 10).map((item, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {item}
                        </span>
                      ))}
                      {result.consolidatedInfo.menuItems.length > 10 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                          +{result.consolidatedInfo.menuItems.length - 10} 項目
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {result.consolidatedInfo.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-800 mb-3">注意事項</h5>
                    <ul className="space-y-1">
                      {result.consolidatedInfo.warnings.slice(0, 5).map((warning, index) => (
                        <li key={index} className="text-yellow-700 text-sm">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Page Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">処理詳細</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">総ページ数:</span>
                      <span className="ml-2 font-medium">{result.totalPages}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">処理ページ数:</span>
                      <span className="ml-2 font-medium">{result.processedPages}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setResult(null);
                      setError(null);
                    }}
                    className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    別のPDFを処理
                  </button>
                  <button
                    onClick={() => {
                      if (onResult) {
                        onResult(result);
                      }
                      onClose();
                    }}
                    className="flex-1 py-3 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                  >
                    結果を使用
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* PDF Link Manager Modal */}
      {showLinkManager && (
        <PDFLinkManager
          onLinkSelect={handleRegisteredLinkSelect}
          onClose={() => setShowLinkManager(false)}
        />
      )}
    </>
  );
};

export default PDFUploader;