import { createClient } from '@supabase/supabase-js';

// Supabase設定（環境変数から取得）
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== 削除処理APIテスト開始 ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '設定済み' : '未設定');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeletionAPI() {
  try {
    console.log('\n1. 削除前の状態確認');
    
    // 削除前の状態確認
    const { data: beforeDelete, error: beforeError } = await supabase
      .from('store_locations')
      .select('id, address, product_id')
      .in('address', ['鳥取県', '島根県'])
      .order('address');
    
    if (beforeError) {
      console.error('❌ データ取得エラー:', beforeError);
      return;
    }
    
    console.log('削除前のレコード数:', beforeDelete.length);
    console.log('削除前のレコード:', beforeDelete);
    
    if (beforeDelete.length === 0) {
      console.log('✅ 削除対象のレコードが存在しません');
      return;
    }
    
    console.log('\n2. 削除処理のAPI呼び出しテスト');
    
    // 削除処理のAPI呼び出しテスト
    for (const record of beforeDelete) {
      console.log(`削除中: ${record.address} (ID: ${record.id})`);
      
      // Supabaseクライアントを使用した削除
      const { error: deleteError } = await supabase
        .from('store_locations')
        .delete()
        .eq('id', record.id);
      
      if (deleteError) {
        console.error(`❌ 削除失敗: ${record.address}`, deleteError);
        console.error('  - エラー詳細:', deleteError.message);
        console.error('  - エラーコード:', deleteError.code);
        console.error('  - エラーハッシュ:', deleteError.hint);
      } else {
        console.log(`✅ 削除完了: ${record.address}`);
      }
    }
    
    console.log('\n3. 削除後の状態確認');
    
    // 削除後の状態確認
    const { data: afterDelete, error: afterError } = await supabase
      .from('store_locations')
      .select('id, address, product_id')
      .in('address', ['鳥取県', '島根県'])
      .order('address');
    
    if (afterError) {
      console.error('❌ 削除後データ取得エラー:', afterError);
      return;
    }
    
    console.log('削除後のレコード数:', afterDelete.length);
    console.log('削除後のレコード:', afterDelete);
    
    if (afterDelete.length === 0) {
      console.log('🎉 削除処理が正常に完了しました！');
    } else {
      console.log('❌ 削除処理に問題があります');
    }
    
    console.log('\n4. 権限確認テスト');
    
    // 権限確認テスト
    const { data: testData, error: testError } = await supabase
      .from('store_locations')
      .select('id, address')
      .limit(1);
    
    if (testError) {
      console.error('❌ 権限エラー:', testError);
      console.error('  - エラー詳細:', testError.message);
      console.error('  - エラーコード:', testError.code);
    } else {
      console.log('✅ 読み取り権限: 正常');
    }
    
    // 書き込み権限テスト（テスト用のレコードを作成・削除）
    const { data: insertData, error: insertError } = await supabase
      .from('store_locations')
      .insert([{ 
        product_id: 999, 
        address: 'テスト都道府県', 
        phone: 'テスト電話' 
      }])
      .select();
    
    if (insertError) {
      console.error('❌ 書き込み権限エラー:', insertError);
      console.error('  - エラー詳細:', insertError.message);
      console.error('  - エラーコード:', insertError.code);
    } else {
      console.log('✅ 書き込み権限: 正常');
      
      // テスト用レコードを削除
      if (insertData && insertData.length > 0) {
        const { error: deleteTestError } = await supabase
          .from('store_locations')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteTestError) {
          console.error('❌ 削除権限エラー:', deleteTestError);
        } else {
          console.log('✅ 削除権限: 正常');
        }
      }
    }
    
  } catch (error) {
    console.error('🚨 テスト中にエラーが発生:', error);
    console.error('  - エラー名:', error.name);
    console.error('  - エラーメッセージ:', error.message);
    console.error('  - スタックトレース:', error.stack);
  }
}

testDeletionAPI()
  .then(() => {
    console.log('\n=== テスト完了 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 テスト中にエラーが発生:', error);
    process.exit(1);
  });
