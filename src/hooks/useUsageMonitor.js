import { useState, useEffect } from 'react';
import translationService from '../services/translationService';

// DeepL API使用量監視フック
export const useUsageMonitor = () => {
  const [usageStats, setUsageStats] = useState({
    current: 0,
    limit: 500000,
    remaining: 500000,
    percentage: 0
  });

  const [isNearLimit, setIsNearLimit] = useState(false);
  const [isOverLimit, setIsOverLimit] = useState(false);

  // 使用量統計を更新
  const updateUsageStats = () => {
    const stats = translationService.getTranslationStats();
    if (stats.usage) {
      setUsageStats(stats.usage);
      setIsNearLimit(stats.usage.percentage > 80);
      setIsOverLimit(stats.usage.percentage >= 100);
    }
  };

  // 使用量をリセット（月次リセット用）
  const resetUsage = () => {
    translationService.resetUsageCount();
    updateUsageStats();
  };

  // 使用量警告を表示
  const getUsageWarning = () => {
    if (isOverLimit) {
      return {
        type: 'error',
        message: 'DeepL API月間制限に達しました。翻訳機能は一時的に利用できません。',
        action: '来月まで待つか、手動翻訳を追加してください。'
      };
    }
    
    if (isNearLimit) {
      return {
        type: 'warning',
        message: 'DeepL API月間制限に近づいています。',
        action: '重要な翻訳は手動で追加することをお勧めします。'
      };
    }
    
    return null;
  };

  // 使用量予測（過去の使用パターンから）
  const getUsageProjection = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    
    if (daysPassed === 0) return null;
    
    const dailyAverage = usageStats.current / daysPassed;
    const projectedMonthly = dailyAverage * daysInMonth;
    const projectedRemaining = dailyAverage * daysRemaining;
    
    return {
      dailyAverage: Math.round(dailyAverage),
      projectedMonthly: Math.round(projectedMonthly),
      projectedRemaining: Math.round(projectedRemaining),
      willExceedLimit: projectedMonthly > usageStats.limit
    };
  };

  // 推奨アクションを取得
  const getRecommendedActions = () => {
    const actions = [];
    const projection = getUsageProjection();
    
    if (isOverLimit) {
      actions.push('手動翻訳を追加して自動翻訳を減らす');
      actions.push('キャッシュをクリアして不要な翻訳を削除');
      return actions;
    }
    
    if (isNearLimit) {
      actions.push('重要な翻訳を手動で追加');
      actions.push('使用頻度の低い翻訳をキャッシュから削除');
    }
    
    if (projection && projection.willExceedLimit) {
      actions.push('月間使用量が制限を超える予測です');
      actions.push('手動翻訳の比率を増やすことを検討してください');
    }
    
    if (actions.length === 0) {
      actions.push('現在の使用量は正常です');
    }
    
    return actions;
  };

  useEffect(() => {
    updateUsageStats();
    
    // 定期的に使用量をチェック（5分間隔）
    const interval = setInterval(updateUsageStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    usageStats,
    isNearLimit,
    isOverLimit,
    updateUsageStats,
    resetUsage,
    getUsageWarning,
    getUsageProjection,
    getRecommendedActions
  };
};

export default useUsageMonitor;
