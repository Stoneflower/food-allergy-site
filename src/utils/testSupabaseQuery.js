import { supabase } from '../lib/supabase';

// Supabaseクエリをテストする関数
export const testSupabaseQuery = async () => {
  try {
    console.log('🔧 Supabaseクエリテスト開始...');

    // 1. 基本的な商品取得テスト
    console.log('📦 1. 基本的な商品取得テスト');
    const { data: basicProducts, error: basicError } = await supabase
      .from('products')
      .select('id, name, category')
      .limit(3);

    if (basicError) {
      console.error('❌ 基本商品取得エラー:', basicError);
      return;
    }

    console.log('✅ 基本商品取得成功:', basicProducts);

    // 2. product_allergiesテーブルの存在確認
    console.log('🥚 2. product_allergiesテーブルの存在確認');
    const { data: allergyData, error: allergyError } = await supabase
      .from('product_allergies')
      .select('*')
      .limit(5);

    if (allergyError) {
      console.error('❌ product_allergies取得エラー:', allergyError);
      console.error('❌ エラー詳細:', JSON.stringify(allergyError, null, 2));
    } else {
      console.log('✅ product_allergies取得成功:', allergyData);
      console.log(`📊 product_allergiesの総数: ${allergyData?.length || 0}件`);
    }

    // 3. 結合クエリのテスト
    console.log('🔗 3. 結合クエリのテスト');
    const { data: joinedData, error: joinedError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category,
        product_allergies(
          id,
          allergy_item_id,
          presence_type,
          allergy_items(
            name,
            icon
          )
        )
      `)
      .limit(3);

    if (joinedError) {
      console.error('❌ 結合クエリエラー:', joinedError);
      console.error('❌ エラー詳細:', JSON.stringify(joinedError, null, 2));
    } else {
      console.log('✅ 結合クエリ成功:', joinedData);
      
      // 各商品のアレルギー情報を確認
      joinedData?.forEach((product, index) => {
        console.log(`📦 商品${index + 1}: ${product.name}`);
        console.log(`   - アレルギー情報: ${product.product_allergies?.length || 0}件`);
        if (product.product_allergies?.length > 0) {
          product.product_allergies.forEach((allergy, allergyIndex) => {
            console.log(`     ${allergyIndex + 1}. ${allergy.allergy_items?.name} (${allergy.presence_type})`);
          });
        }
      });
    }

    // 4. allergy_itemsテーブルの確認
    console.log('🏷️ 4. allergy_itemsテーブルの確認');
    const { data: allergyItems, error: allergyItemsError } = await supabase
      .from('allergy_items')
      .select('item_id, name, icon')
      .limit(5);

    if (allergyItemsError) {
      console.error('❌ allergy_items取得エラー:', allergyItemsError);
    } else {
      console.log('✅ allergy_items取得成功:', allergyItems);
      console.log(`📊 allergy_itemsの総数: ${allergyItems?.length || 0}件`);
    }

    return {
      basicProducts,
      allergyData,
      joinedData,
      allergyItems
    };

  } catch (error) {
    console.error('❌ Supabaseクエリテストエラー:', error);
  }
};

// 現在のsearchServiceと同じクエリをテストする関数
export const testSearchServiceQuery = async () => {
  try {
    console.log('🔧 searchServiceクエリテスト開始...');

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_allergies(
          id,
          allergy_item_id,
          presence_type,
          amount_level,
          notes,
          allergy_items(
            id,
            name,
            name_en,
            category,
            icon
          )
        ),
        store_locations(
          id,
          branch_name,
          address,
          store_list_url
        )
      `)
      .limit(3);

    if (error) {
      console.error('❌ searchServiceクエリエラー:', error);
      console.error('❌ エラー詳細:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ searchServiceクエリ成功:', data);
      
      // 各商品の詳細を確認
      data?.forEach((product, index) => {
        console.log(`📦 商品${index + 1}: ${product.name}`);
        console.log(`   - product_allergies: ${product.product_allergies?.length || 0}件`);
        console.log(`   - store_locations: ${product.store_locations?.length || 0}件`);
        
        if (product.product_allergies?.length > 0) {
          product.product_allergies.forEach((allergy, allergyIndex) => {
            console.log(`     ${allergyIndex + 1}. ${allergy.allergy_items?.name} (${allergy.presence_type})`);
          });
        }
      });
    }

    return { data, error };

  } catch (error) {
    console.error('❌ searchServiceクエリテストエラー:', error);
  }
};
