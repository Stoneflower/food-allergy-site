import React from 'react';
import useUsageMonitor from '../hooks/useUsageMonitor';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiAlertTriangle, FiAlertCircle, FiInfo, FiX } = FiIcons;

// DeepL API使用量警告コンポーネント
const UsageWarning = () => {
  const { 
    usageStats, 
    isNearLimit, 
    isOverLimit, 
    getUsageWarning, 
    getRecommendedActions 
  } = useUsageMonitor();

  const [isDismissed, setIsDismissed] = React.useState(false);

  // 警告レベルが低い場合は表示しない
  if (!isNearLimit && !isOverLimit) {
    return null;
  }

  // ユーザーが閉じた場合は表示しない
  if (isDismissed) {
    return null;
  }

  const warning = getUsageWarning();
  const actions = getRecommendedActions();

  if (!warning) return null;

  const getWarningStyle = () => {
    if (isOverLimit) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        icon: FiAlertCircle,
        title: 'DeepL API制限超過'
      };
    }
    
    if (isNearLimit) {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        icon: FiAlertTriangle,
        title: 'DeepL API使用量警告'
      };
    }
    
    return {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      icon: FiInfo,
      title: 'DeepL API情報'
    };
  };

  const style = getWarningStyle();

  return (
    <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg border-l-4 ${style.bgColor} ${style.borderColor} shadow-lg z-50`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <SafeIcon icon={style.icon} className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${style.iconColor}`}>
            {style.title}
          </h3>
          <div className="mt-2 text-sm text-gray-700">
            <p className="mb-2">{warning.message}</p>
            <p className="mb-3">{warning.action}</p>
            
            {/* 使用量プログレスバー */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>使用量: {usageStats.current.toLocaleString()} / {usageStats.limit.toLocaleString()} 文字</span>
                <span>{usageStats.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    usageStats.percentage > 80 ? 'bg-red-500' :
                    usageStats.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageStats.percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* 推奨アクション */}
            {actions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">推奨アクション:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {actions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => setIsDismissed(true)}
            className={`inline-flex ${style.iconColor} hover:opacity-75`}
          >
            <SafeIcon icon={FiX} className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageWarning;
