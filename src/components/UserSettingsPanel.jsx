import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiUser, FiShield, FiThermometer, FiInfo, FiCheck, FiX } = FiIcons;

const UserSettingsPanel = ({ userSettings, onSettingsChange, onClose }) => {
  const [tempSettings, setTempSettings] = useState({
    allowTrace: userSettings?.allowTrace ?? false,
    allowHeated: userSettings?.allowHeated ?? true,
    severityLevel: userSettings?.severityLevel ?? 'medium', // light, medium, strict
    childMode: userSettings?.childMode ?? true,
    ...userSettings
  });

  const handleSave = () => {
    onSettingsChange(tempSettings);
    onClose();
  };

  const severityLevels = [
    {
      id: 'light',
      name: '軽度',
      description: '微量でも症状が軽い',
      icon: '😊',
      settings: { allowTrace: true, allowHeated: true }
    },
    {
      id: 'medium',
      name: '中程度',
      description: '注意が必要',
      icon: '😐',
      settings: { allowTrace: false, allowHeated: true }
    },
    {
      id: 'strict',
      name: '重度',
      description: '完全除去が必要',
      icon: '😰',
      settings: { allowTrace: false, allowHeated: false }
    }
  ];

  const handleSeverityChange = (severity) => {
    const level = severityLevels.find(l => l.id === severity);
    setTempSettings(prev => ({
      ...prev,
      severityLevel: severity,
      ...level.settings
    }));
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
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiSettings} className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">設定</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 表示モード */}
          <div>
            <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-3">
              <SafeIcon icon={FiUser} className="w-5 h-5" />
              <span>表示モード</span>
            </h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempSettings.childMode}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, childMode: e.target.checked }))}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-900">👶 お子様向け表示</span>
                  <p className="text-sm text-gray-600">大きなアイコンと簡単な表示</p>
                </div>
              </label>
            </div>
          </div>

          {/* アレルギーの重度設定 */}
          <div>
            <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-3">
              <SafeIcon icon={FiShield} className="w-5 h-5" />
              <span>アレルギーの重度</span>
            </h4>
            <div className="space-y-3">
              {severityLevels.map(level => (
                <motion.button
                  key={level.id}
                  onClick={() => handleSeverityChange(level.id)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    ${tempSettings.severityLevel === level.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{level.icon}</span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{level.name}</h5>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                    {tempSettings.severityLevel === level.id && (
                      <SafeIcon icon={FiCheck} className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 詳細設定 */}
          <div>
            <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-3">
              <SafeIcon icon={FiInfo} className="w-5 h-5" />
              <span>詳細設定</span>
            </h4>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempSettings.allowTrace}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, allowTrace: e.target.checked }))}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-1"
                />
                <div>
                  <span className="font-medium text-gray-900">⚠️ 微量なら摂取可能</span>
                  <p className="text-sm text-gray-600">
                    「微量」と表示された食品を「OK」として表示します
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempSettings.allowHeated}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, allowHeated: e.target.checked }))}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-1"
                />
                <div>
                  <span className="font-medium text-gray-900">🔥 加熱済みなら摂取可能</span>
                  <p className="text-sm text-gray-600">
                    加熱で変化する成分を「OK」として表示します
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 設定の説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-semibold text-blue-800 mb-2">設定について</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 設定は安全性の目安です</li>
                  <li>• 必ず医師にご相談ください</li>
                  <li>• 症状の変化があった場合は設定を見直してください</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserSettingsPanel;