import { createClient } from '@supabase/supabase-js';

// Supabase設定（直接指定）
const supabaseUrl = 'https://your-project.supabase.co'; // 実際のURLに置き換え
const supabaseKey = 'your-anon-key'; // 実際のキーに置き換え

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '設定済み' : '未設定');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeletion() {
  try {
    console.log('=== 削除処理テスト開始 ===');
    
    // 1. 削除前の状態確認
    console.log('\n1. 削除前の状態確認');
    const { data: beforeDelete, error: beforeError } = await supabase
      .from('store_locations')
      .select('id, address, product_id')
      .in('address', ['鳥取県', '島根県'])
      .order('address');
    
    if (beforeError) throw beforeError;
    
    console.log('削除前のレコード数:', beforeDelete.length);
    console.log('削除前のレコード:', beforeDelete);
    
    if (beforeDelete.length === 0) {
      console.log('✅ 削除対象のレコードが存在しません');
      return;
    }
    
    // 2. 削除処理の実行
    console.log('\n2. 削除処理の実行');
    for (const record of beforeDelete) {
      console.log(`削除中: ${record.address} (ID: ${record.id})`);
      
      const { error: deleteError } = await supabase
        .from('store_locations')
        .delete()
        .eq('id', record.id);
      
      if (deleteError) {
        console.error(`❌ 削除失敗: ${record.address}`, deleteError);
      } else {
        console.log(`✅ 削除完了: ${record.address}`);
      }
    }
    
    // 3. 削除後の状態確認
    console.log('\n3. 削除後の状態確認');
    const { data: afterDelete, error: afterError } = await supabase
      .from('store_locations')
      .select('id, address, product_id')
      .in('address', ['鳥取県', '島根県'])
      .order('address');
    
    if (afterError) throw afterError;
    
    console.log('削除後のレコード数:', afterDelete.length);
    console.log('削除後のレコード:', afterDelete);
    
    if (afterDelete.length === 0) {
      console.log('🎉 削除処理が正常に完了しました！');
    } else {
      console.log('❌ 削除処理に問題があります');
    }
    
  } catch (error) {
    console.error('🚨 エラーが発生しました:', error.message);
  }
}

testDeletion()
  .then(() => {
    console.log('\n=== テスト完了 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 テスト中にエラーが発生:', error);
    process.exit(1);
  });
