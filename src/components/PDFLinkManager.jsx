import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { pdfOCRProcessor } from '../utils/pdfOCR';

const { FiLink, FiPlus, FiEdit3, FiTrash2, FiExternalLink, FiCheck, FiX, FiFileText, FiStar, FiMapPin } = FiIcons;

const PDFLinkManager = ({ onLinkSelect, onClose }) => {
  const [registeredLinks, setRegisteredLinks] = useState([
    {
      id: 'sushiro',
      name: 'スシロー',
      category: 'レストラン',
      url: 'https://www3.akindo-sushiro.co.jp/pdf/menu/allergy.pdf',
      description: '全メニューのアレルギー情報PDF',
      lastUpdated: '2024年1月15日',
      rating: 4.5,
      area: '全国チェーン',
      verified: true
    },
    {
      id: 'kappa-sushi',
      name: 'かっぱ寿司',
      category: 'レストラン', 
      url: 'https://www.kappasushi.jp/allergy/allergy.pdf',
      description: 'アレルギー成分一覧表',
      lastUpdated: '2024年2月1日',
      rating: 4.2,
      area: '全国チェーン',
      verified: true
    },
    {
      id: 'mcdonalds',
      name: 'マクドナルド',
      category: 'ファストフード',
      url: 'https://www.mcdonalds.co.jp/content/dam/web/mcdonalds/allergen/allergen_info.pdf',
      description: 'アレルゲン情報一覧',
      lastUpdated: '2024年1月20日',
      rating: 4.0,
      area: '全国チェーン',
      verified: true
    }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [newLink, setNewLink] = useState({
    name: '',
    category: 'レストラン',
    url: '',
    description: '',
    area: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: '全て' },
    { id: 'レストラン', name: 'レストラン' },
    { id: 'ファストフード', name: 'ファストフード' },
    { id: 'カフェ', name: 'カフェ' },
    { id: 'スーパー', name: 'スーパー' },
    { id: 'その他', name: 'その他' }
  ];

  // フィルタリング
  const filteredLinks = registeredLinks.filter(link => {
    const matchesSearch = !searchKeyword || 
      link.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      link.description.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // PDF URL検証
  const validatePDFUrl = async (url) => {
    setIsValidating(true);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        return contentType && contentType.includes('application/pdf');
      }
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // 新しいリンク追加
  const handleAddLink = async () => {
    if (!newLink.name || !newLink.url) return;

    const isValidPDF = await validatePDFUrl(newLink.url);
    if (!isValidPDF) {
      alert('有効なPDFファイルのURLを入力してください');
      return;
    }

    const link = {
      id: Date.now().toString(),
      ...newLink,
      lastUpdated: new Date().toLocaleDateString('ja-JP'),
      rating: 0,
      verified: false
    };

    setRegisteredLinks(prev => [...prev, link]);
    setNewLink({
      name: '',
      category: 'レストラン',
      url: '',
      description: '',
      area: ''
    });
    setShowAddForm(false);
  };

  // リンク編集
  const handleEditLink = (link) => {
    setEditingLink(link.id);
    setNewLink({
      name: link.name,
      category: link.category,
      url: link.url,
      description: link.description,
      area: link.area
    });
    setShowAddForm(true);
  };

  // リンク更新
  const handleUpdateLink = async () => {
    const isValidPDF = await validatePDFUrl(newLink.url);
    if (!isValidPDF) {
      alert('有効なPDFファイルのURLを入力してください');
      return;
    }

    setRegisteredLinks(prev => prev.map(link => 
      link.id === editingLink 
        ? { ...link, ...newLink, lastUpdated: new Date().toLocaleDateString('ja-JP') }
        : link
    ));
    
    setEditingLink(null);
    setNewLink({
      name: '',
      category: 'レストラン',
      url: '',
      description: '',
      area: ''
    });
    setShowAddForm(false);
  };

  // リンク削除
  const handleDeleteLink = (linkId) => {
    if (confirm('このリンクを削除しますか？')) {
      setRegisteredLinks(prev => prev.filter(link => link.id !== linkId));
    }
  };

  // PDFを選択して解析
  const handleSelectLink = async (link) => {
    try {
      // PDF解析を開始
      const result = await pdfOCRProcessor.processPDFFromURL(link.url, {
        maxPages: 5,
        scale: 2.0
      });
      
      // 結果にレストラン情報を追加
      const enrichedResult = {
        ...result,
        restaurantInfo: {
          name: link.name,
          category: link.category,
          description: link.description,
          area: link.area,
          sourceUrl: link.url
        }
      };

      if (onLinkSelect) {
        onLinkSelect(enrichedResult);
      }
      
      onClose();
    } catch (error) {
      console.error('PDF解析エラー:', error);
      alert('PDFの解析中にエラーが発生しました。URLが正しいか確認してください。');
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
        className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiLink} className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">PDF リンク管理</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="レストラン名・説明で検索..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4" />
                <span>新規追加</span>
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <h4 className="text-lg font-semibold text-blue-800 mb-4">
                {editingLink ? 'リンク編集' : '新しいリンク追加'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    店舗・レストラン名 *
                  </label>
                  <input
                    type="text"
                    value={newLink.name}
                    onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="スシロー"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリー
                  </label>
                  <select
                    value={newLink.category}
                    onChange={(e) => setNewLink(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.slice(1).map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PDF URL *
                  </label>
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/allergy.pdf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <input
                    type="text"
                    value={newLink.description}
                    onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="アレルギー情報PDF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    エリア
                  </label>
                  <input
                    type="text"
                    value={newLink.area}
                    onChange={(e) => setNewLink(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="全国チェーン"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingLink(null);
                    setNewLink({
                      name: '',
                      category: 'レストラン',
                      url: '',
                      description: '',
                      area: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingLink ? handleUpdateLink : handleAddLink}
                  disabled={!newLink.name || !newLink.url || isValidating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isValidating ? '検証中...' : editingLink ? '更新' : '追加'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Links List */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              登録済みPDFリンク ({filteredLinks.length}件)
            </h4>
            
            {filteredLinks.length === 0 ? (
              <div className="text-center py-8">
                <SafeIcon icon={FiFileText} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  リンクが見つかりません
                </h3>
                <p className="text-gray-500">
                  検索条件を変更するか、新しいリンクを追加してください
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredLinks.map(link => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-semibold text-gray-900">{link.name}</h5>
                          {link.verified && (
                            <SafeIcon icon={FiCheck} className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {link.category}
                          </span>
                          {link.area && (
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiMapPin} className="w-3 h-3" />
                              <span>{link.area}</span>
                            </div>
                          )}
                          {link.rating > 0 && (
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiStar} className="w-3 h-3 text-yellow-500" />
                              <span>{link.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                        <p className="text-xs text-gray-500">
                          最終更新: {link.lastUpdated}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                      >
                        <SafeIcon icon={FiExternalLink} className="w-3 h-3" />
                        <span>PDFを開く</span>
                      </a>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectLink(link)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                          解析する
                        </button>
                        <button
                          onClick={() => handleEditLink(link)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                        </button>
                        {!link.verified && (
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">ご利用方法</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 登録されたPDFリンクから「解析する」ボタンでアレルギー情報を抽出できます</li>
              <li>• 新しいレストランのPDFを見つけた場合は「新規追加」から登録してください</li>
              <li>• ✅マークは運営が検証済みの信頼できるリンクです</li>
              <li>• PDFが更新された場合は編集ボタンから情報を更新してください</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PDFLinkManager;