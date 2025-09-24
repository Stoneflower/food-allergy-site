// 翻訳機能のテスト用ユーティリティ
import translationService from '../services/translationService';

export const testTranslation = async () => {
  try {
    console.log('🧪 翻訳機能テスト開始...');
    
    // テスト用の翻訳
    const testText = '商品の成分表示を撮影するだけ！';
    const result = await translationService.getTranslation(
      testText,
      'en',
      'ja'
    );
    
    console.log('✅ 翻訳成功:', {
      original: testText,
      translated: result
    });
    
    // 使用量統計を表示
    const stats = translationService.getTranslationStats();
    console.log('📊 使用量統計:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ 翻訳テスト失敗:', error);
    return false;
  }
};

// 使用量監視テスト
export const testUsageMonitoring = () => {
  const stats = translationService.getTranslationStats();
  
  console.log('📈 使用量監視テスト:');
  console.log('- 手動翻訳数:', stats.manual);
  console.log('- キャッシュ翻訳数:', stats.cached);
  console.log('- 合計翻訳数:', stats.total);
  
  if (stats.usage) {
    console.log('- 現在の使用量:', stats.usage.current.toLocaleString(), '文字');
    console.log('- 月間制限:', stats.usage.limit.toLocaleString(), '文字');
    console.log('- 残り文字数:', stats.usage.remaining.toLocaleString(), '文字');
    console.log('- 使用率:', stats.usage.percentage + '%');
  }
  
  return stats;
};

export default { testTranslation, testUsageMonitoring };
