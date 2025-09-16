import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiClock, FiUser, FiCheck, FiX, FiEdit3, FiAlertTriangle, FiChevronDown, FiChevronUp, FiShield } = FiIcons;

const UpdateHistoryPanel = ({ product, updates = [] }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  // モックデータ（実際はpropsまたはAPIから取得）
  const mockUpdates = [
    {
      id: 'update_1',
      type: 'info_change',
      submittedBy: '田中さん',
      submittedAt: new Date('2024-01-20'),
      status: 'approved',
      changes: [
        {
          field: 'アレルギー成分（追加）',
          old: '',
          new: '🥛 乳',
          type: 'addition'
        },
        {
          field: '価格',
          old: '¥480',
          new: '¥520'
        }
      ],
      changeReason: '2024年1月のリニューアルで乳成分が追加されました。店頭で確認済みです。',
      evidenceImage: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200',
      reviewedBy: '運営チーム',
      reviewedAt: new Date('2024-01-21')
    },
    {
      id: 'update_2',
      type: 'info_change',
      submittedBy: '佐藤さん',
      submittedAt: new Date('2024-01-15'),
      status: 'pending_review',
      changes: [
        {
          field: 'アレルギー成分（削除）',
          old: '🌰 くるみ',
          new: '',
          type: 'removal'
        }
      ],
      changeReason: '最新のパッケージではくるみの表示がありませんでした。',
      evidenceImage: null
    }
  ];

  const allUpdates = [...mockUpdates, ...updates].sort((a, b) => 
    new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  const getUpdateTypeInfo = (type) => {
    switch (type) {
      case 'info_change':
        return {
          icon: FiEdit3,
          label: '情報変更',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'discontinued':
        return {
          icon: FiX,
          label: '販売中止',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      case 'new_version':
        return {
          icon: FiShield,
          label: 'リニューアル',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      default:
        return {
          icon: FiEdit3,
          label: '更新',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return {
          icon: FiCheck,
          label: '承認済み',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'pending_review':
        return {
          icon: FiClock,
          label: '審査中',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      case 'rejected':
        return {
          icon: FiX,
          label: '却下',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: FiClock,
          label: '不明',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const pendingUpdates = allUpdates.filter(update => update.status === 'pending_review');
  const approvedUpdates = allUpdates.filter(update => update.status === 'approved');

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiClock} className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">更新履歴</h3>
            {allUpdates.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {allUpdates.length}件
              </span>
            )}
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-sm">
              {showHistory ? '閉じる' : '履歴を見る'}
            </span>
            <SafeIcon 
              icon={showHistory ? FiChevronUp : FiChevronDown} 
              className="w-4 h-4" 
            />
          </button>
        </div>
      </div>

      {/* Pending Updates Alert */}
      {pendingUpdates.length > 0 && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {pendingUpdates.length}件の更新報告が審査中です
            </span>
          </div>
        </div>
      )}

      {/* History Content */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4"
        >
          {allUpdates.length === 0 ? (
            <div className="text-center py-8">
              <SafeIcon icon={FiClock} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">
                更新履歴はありません
              </h4>
              <p className="text-gray-500 text-sm">
                まだこの商品の更新報告はありません
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allUpdates.map((update) => {
                const typeInfo = getUpdateTypeInfo(update.type);
                const statusInfo = getStatusInfo(update.status);
                const isSelected = selectedUpdate?.id === update.id;

                return (
                  <div key={update.id} className="border border-gray-200 rounded-lg">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedUpdate(isSelected ? null : update)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`p-1 rounded ${typeInfo.bgColor}`}>
                              <SafeIcon icon={typeInfo.icon} className={`w-4 h-4 ${typeInfo.color}`} />
                            </div>
                            <span className="font-medium text-gray-900">{typeInfo.label}</span>
                            <div className={`px-2 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                              <div className="flex items-center space-x-1">
                                <SafeIcon icon={statusInfo.icon} className="w-3 h-3" />
                                <span>{statusInfo.label}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiUser} className="w-3 h-3" />
                              <span>{update.submittedBy}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiClock} className="w-3 h-3" />
                              <span>{update.submittedAt.toLocaleDateString('ja-JP')}</span>
                            </div>
                          </div>

                          {/* Changes Summary */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {update.changes.map((change, index) => (
                              <span
                                key={index}
                                className={`text-xs px-2 py-1 rounded ${
                                  change.type === 'addition' 
                                    ? 'bg-green-100 text-green-800'
                                    : change.type === 'removal'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {change.field}
                              </span>
                            ))}
                          </div>
                        </div>

                        <SafeIcon 
                          icon={isSelected ? FiChevronUp : FiChevronDown} 
                          className="w-4 h-4 text-gray-400" 
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="px-4 pb-4 border-t border-gray-100"
                      >
                        <div className="space-y-4 mt-4">
                          {/* Change Details */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">変更内容</h5>
                            <div className="space-y-2">
                              {update.changes.map((change, index) => (
                                <div key={index} className="bg-gray-50 rounded p-3">
                                  <div className="font-medium text-sm text-gray-900 mb-1">
                                    {change.field}
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    {change.old && (
                                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                        旧: {change.old}
                                      </span>
                                    )}
                                    {change.new && (
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                        新: {change.new}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Reason */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">変更理由</h5>
                            <p className="text-gray-700 text-sm bg-gray-50 rounded p-3">
                              {update.changeReason}
                            </p>
                          </div>

                          {/* Evidence Image */}
                          {update.evidenceImage && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">証拠画像</h5>
                              <img
                                src={update.evidenceImage}
                                alt="証拠画像"
                                className="max-w-xs max-h-48 object-contain rounded-lg shadow-sm"
                              />
                            </div>
                          )}

                          {/* Review Info */}
                          {update.status === 'approved' && update.reviewedBy && (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <div className="flex items-center space-x-2 text-green-800">
                                <SafeIcon icon={FiCheck} className="w-4 h-4" />
                                <span className="font-medium">承認済み</span>
                              </div>
                              <div className="text-sm text-green-700 mt-1">
                                {update.reviewedBy}により{update.reviewedAt?.toLocaleDateString('ja-JP')}に承認
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default UpdateHistoryPanel;