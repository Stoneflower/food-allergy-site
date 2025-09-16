import React from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShield, FiUser, FiFileText, FiExternalLink, FiCamera, FiCheck, FiInfo } = FiIcons;

const SourceBadge = ({ source, className = "" }) => {
  const getSourceInfo = (sourceType) => {
    switch (sourceType) {
      case 'official':
        return {
          icon: FiShield,
          label: '公式情報',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'レストラン・メーカー公式サイトの情報'
        };
      case 'pdf':
        return {
          icon: FiFileText,
          label: 'PDF解析',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: '公式PDFから自動抽出された情報'
        };
      case 'user_upload':
        return {
          icon: FiCamera,
          label: 'ユーザー投稿',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'ユーザーが撮影・投稿した情報'
        };
      case 'community':
        return {
          icon: FiUser,
          label: 'コミュニティ',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          description: 'コミュニティメンバーが共有した情報'
        };
      case 'verified':
        return {
          icon: FiCheck,
          label: '検証済み',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          description: '運営が検証・確認済みの情報'
        };
      default:
        return {
          icon: FiInfo,
          label: '情報',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: '一般的な情報'
        };
    }
  };

  const sourceInfo = getSourceInfo(source?.type || 'community');

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${sourceInfo.color} ${className}`}>
      <SafeIcon icon={sourceInfo.icon} className="w-3 h-3" />
      <span>{sourceInfo.label}</span>
    </div>
  );
};

export const SourceDetails = ({ source, showDetails = false }) => {
  if (!source) return null;

  const getSourceInfo = (sourceType) => {
    switch (sourceType) {
      case 'official':
        return {
          icon: FiShield,
          label: '公式情報',
          color: 'text-green-600',
          description: 'レストラン・メーカー公式サイトの情報'
        };
      case 'pdf':
        return {
          icon: FiFileText,
          label: 'PDF解析',
          color: 'text-blue-600',
          description: '公式PDFから自動抽出された情報'
        };
      case 'user_upload':
        return {
          icon: FiCamera,
          label: 'ユーザー投稿',
          color: 'text-orange-600',
          description: 'ユーザーが撮影・投稿した情報'
        };
      case 'community':
        return {
          icon: FiUser,
          label: 'コミュニティ',
          color: 'text-purple-600',
          description: 'コミュニティメンバーが共有した情報'
        };
      case 'verified':
        return {
          icon: FiCheck,
          label: '検証済み',
          color: 'text-emerald-600',
          description: '運営が検証・確認済みの情報'
        };
      default:
        return {
          icon: FiInfo,
          label: '情報',
          color: 'text-gray-600',
          description: '一般的な情報'
        };
    }
  };

  const sourceInfo = getSourceInfo(source.type);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
      <div className="flex items-center space-x-2 mb-2">
        <SafeIcon icon={sourceInfo.icon} className={`w-4 h-4 ${sourceInfo.color}`} />
        <span className="font-semibold text-gray-900">{sourceInfo.label}</span>
        {source.verified && (
          <SafeIcon icon={FiCheck} className="w-4 h-4 text-green-500" />
        )}
      </div>
      
      <p className="text-gray-600 mb-2">{sourceInfo.description}</p>
      
      {showDetails && (
        <div className="space-y-1 text-xs text-gray-500">
          {source.contributor && (
            <div>投稿者: {source.contributor}</div>
          )}
          {source.lastUpdated && (
            <div>更新日: {new Date(source.lastUpdated).toLocaleDateString('ja-JP')}</div>
          )}
          {source.confidence && (
            <div>信頼度: {source.confidence}%</div>
          )}
          {source.reviewCount && (
            <div>{source.reviewCount}人が確認済み</div>
          )}
          {source.url && (
            <div>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
              >
                <span>情報元を確認</span>
                <SafeIcon icon={FiExternalLink} className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SourceBadge;