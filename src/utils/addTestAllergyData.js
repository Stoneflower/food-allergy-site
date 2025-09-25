import { supabase } from '../lib/supabase';

// テスト用のアレルギー情報を追加する関数
export const addTestAllergyData = async () => {
  try {
    console.log('🔧 テスト用アレルギー情報の追加を開始...');

    // 1. 既存の商品を取得
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(5);

    if (productsError) {
      console.error('❌ 商品取得エラー:', productsError);
      return;
    }

    console.log('📦 取得した商品:', products);

    // 2. 既存のアレルギー品目を取得
    const { data: allergyItems, error: allergyError } = await supabase
      .from('allergy_items')
      .select('item_id, name')
      .limit(5);

    if (allergyError) {
      console.error('❌ アレルギー品目取得エラー:', allergyError);
      return;
    }

    console.log('🥚 取得したアレルギー品目:', allergyItems);

    // 3. テスト用のアレルギー情報を追加
    const testAllergyData = [];
    
    if (products.length > 0 && allergyItems.length > 0) {
      // 最初の商品に複数のアレルギー情報を追加
      const product = products[0];
      
      allergyItems.slice(0, 3).forEach((allergy, index) => {
        testAllergyData.push({
          product_id: product.id,
          allergy_item_id: allergy.item_id,
          presence_type: index === 0 ? 'direct' : index === 1 ? 'trace' : 'heated',
          amount_level: index === 0 ? 'high' : index === 1 ? 'low' : 'medium',
          notes: `テスト用アレルギー情報 - ${allergy.name}`
        });
      });

      // 2番目の商品にもアレルギー情報を追加
      if (products.length > 1) {
        const product2 = products[1];
        testAllergyData.push({
          product_id: product2.id,
          allergy_item_id: allergyItems[0].item_id,
          presence_type: 'direct',
          amount_level: 'high',
          notes: `テスト用アレルギー情報 - ${allergyItems[0].name}`
        });
      }
    }

    console.log('📝 追加するアレルギー情報:', testAllergyData);

    // 4. アレルギー情報をデータベースに挿入
    if (testAllergyData.length > 0) {
      const { data, error } = await supabase
        .from('product_allergies')
        .insert(testAllergyData)
        .select();

      if (error) {
        console.error('❌ アレルギー情報挿入エラー:', error);
        return;
      }

      console.log('✅ テスト用アレルギー情報を追加しました:', data);
    } else {
      console.log('⚠️ 追加するアレルギー情報がありません');
    }

  } catch (error) {
    console.error('❌ テスト用アレルギー情報追加エラー:', error);
  }
};

// 既存のアレルギー情報を確認する関数
export const checkExistingAllergyData = async () => {
  try {
    console.log('🔍 既存のアレルギー情報を確認中...');

    const { data, error } = await supabase
      .from('product_allergies')
      .select(`
        *,
        products (name),
        allergy_items (name, icon)
      `)
      .limit(10);

    if (error) {
      console.error('❌ アレルギー情報取得エラー:', error);
      return;
    }

    console.log('📊 既存のアレルギー情報:', data);
    console.log(`📈 アレルギー情報の総数: ${data.length}件`);

    return data;
  } catch (error) {
    console.error('❌ アレルギー情報確認エラー:', error);
  }
};
