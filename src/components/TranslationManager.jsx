import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAutoTranslation from '../hooks/useAutoTranslation';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiEdit3, FiTrash2, FiRefreshCw, FiSave, FiX, FiAlertCircle } = FiIcons;

const TranslationManager = () => {
  const { i18n } = useTranslation();
  const {
    addManualTranslation,
    removeManualTranslation,
    clearCache,
    getManualTranslations,
    isLoading,
    translationStats
  } = useAutoTranslation();

  const [manualTranslations, setManualTranslations] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newTranslation, setNewTranslation] = useState({ key: '', translation: '' });

  useEffect(() => {
    setManualTranslations(getManualTranslations());
  }, [getManualTranslations]);

  const handleEdit = (key, currentTranslation) => {
    setEditingKey(key);
    setEditValue(currentTranslation);
  };

  const handleSave = () => {
    if (editingKey && editValue.trim()) {
      addManualTranslation(editingKey, editValue.trim());
      setEditingKey(null);
      setEditValue('');
      setManualTranslations(getManualTranslations());
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleDelete = (key) => {
    if (window.confirm('この手動翻訳を削除しますか？自動翻訳に戻ります。')) {
      removeManualTranslation(key);
      setManualTranslations(getManualTranslations());
    }
  };

  const handleAddNew = () => {
    if (newTranslation.key.trim() && newTranslation.translation.trim()) {
      addManualTranslation(newTranslation.key, newTranslation.translation);
      setNewTranslation({ key: '', translation: '' });
      setManualTranslations(getManualTranslations());
    }
  };

  const handleClearCache = () => {
    if (window.confirm('翻訳キャッシュをクリアしますか？')) {
      clearCache();
      setManualTranslations(getManualTranslations());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          翻訳管理 ({i18n.language.toUpperCase()})
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            手動: {translationStats.manual} | キャッシュ: {translationStats.cached}
          </div>
          {translationStats.usage && (
            <div className="text-sm">
              <div className="text-gray-600">
                DeepL使用量: {translationStats.usage.current.toLocaleString()} / {translationStats.usage.limit.toLocaleString()} 文字
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    translationStats.usage.percentage > 80 ? 'bg-red-500' :
                    translationStats.usage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(translationStats.usage.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                残り: {translationStats.usage.remaining.toLocaleString()} 文字 ({translationStats.usage.percentage}%)
              </div>
            </div>
          )}
          <button
            onClick={handleClearCache}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
          >
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4 inline mr-1" />
            キャッシュクリア
          </button>
        </div>
      </div>

      {/* 新しい翻訳を追加 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">新しい手動翻訳を追加</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="翻訳キー (例: home.hero.title)"
            value={newTranslation.key}
            onChange={(e) => setNewTranslation(prev => ({ ...prev, key: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="翻訳内容"
            value={newTranslation.translation}
            onChange={(e) => setNewTranslation(prev => ({ ...prev, translation: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleAddNew}
          disabled={!newTranslation.key.trim() || !newTranslation.translation.trim()}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiSave} className="w-4 h-4 inline mr-1" />
          追加
        </button>
      </div>

      {/* 手動翻訳一覧 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">手動翻訳一覧</h3>
        {manualTranslations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <SafeIcon icon={FiAlertCircle} className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>手動翻訳がありません</p>
            <p className="text-sm">翻訳を追加すると、自動翻訳より優先されます</p>
          </div>
        ) : (
          manualTranslations.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.key}</div>
                {editingKey === item.key ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="mt-1 px-2 py-1 border border-gray-300 rounded text-sm w-full"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm text-gray-600 mt-1">{item.translation}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  手動翻訳 | {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {editingKey === item.key ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <SafeIcon icon={FiSave} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <SafeIcon icon={FiX} className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(item.key, item.translation)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.key)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <SafeIcon icon={FiRefreshCw} className="w-5 h-5 animate-spin text-orange-500" />
            <span>翻訳中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationManager;
