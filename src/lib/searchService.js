import { supabase } from './supabase';

class SearchService {
  constructor() {
    this.supabase = supabase;
  }

  // 最適化された全文検索（Supabase直接使用）
  async fullTextSearch(searchTerm, filters = {}) {
    console.log('🔍 最適化全文検索開始（Supabase直接）:', { searchTerm, filters });
    
    // 直接Supabaseクエリを使用（Typesense APIが存在しないため）
    return this.optimizedFallbackSearch(searchTerm, filters);
  }

  // 最適化されたフォールバック検索（インデックス活用）
  async optimizedFallbackSearch(searchTerm, filters = {}) {
    console.log('🔍 最適化フォールバック検索開始:', { searchTerm, filters });
    
    let query = this.supabase
      .from('products')
      .select(`
        *,
        product_allergies(
          allergy_item_id,
          presence_type,
          notes,
          allergy_items(
            id,
            name
          )
        ),
        store_locations(
          id,
          branch_name,
          address,
          store_list_url
        )
      `);

    if (searchTerm) {
      // 基本的なLIKE検索を使用
      query = query.or(`name.ilike.%${searchTerm}%,product_title.ilike.%${searchTerm}%`);
      console.log('🔍 LIKE検索条件追加:', searchTerm);
    }

    // アレルギー成分フィルタリング（一時的に無効化）
    // if (filters.allergies?.length > 0) {
    //   query = query.in('product_allergies.allergy_item_id', filters.allergies);
    //   console.log('🔍 アレルギーフィルター条件追加:', filters.allergies);
    // }

    // エリアフィルタリング（一時的に無効化）
    // if (filters.area) {
    //   query = query.ilike('store_locations.address', `%${filters.area}%`);
    //   console.log('🔍 エリアフィルター条件追加:', filters.area);
    // }

    // カテゴリフィルタリング（一時的に無効化）
    // if (filters.category && filters.category !== 'all') {
    //   query = query.eq('category', filters.category);
    //   console.log('🔍 カテゴリフィルター条件追加:', filters.category);
    // }

    // 並び順とリミット
    query = query
      .order('updated_at', { ascending: false })
      .limit(filters.limit || 200);

    const { data, error } = await query;
    
    console.log('🔍 最適化フォールバック検索結果:', { dataCount: data?.length || 0, error });
    return { data, error };
  }

  // ハイブリッド検索（Typesense検索のみ）
  async hybridSearch(searchTerm, filters = {}) {
    console.log('🔍 ハイブリッド検索開始（最適化版）:', { searchTerm, filters });
    
    // Typesense検索を優先
    return this.fullTextSearch(searchTerm, filters);
  }

  // アレルギー検索
  async allergySearch(allergies, filters = {}) {
    console.log('🔍 アレルギー検索開始（最適化版）:', { allergies, filters });
    
    const searchFilters = {
      ...filters,
      allergies: allergies
    };
    
    return this.fullTextSearch('', searchFilters);
  }

  // エリア検索
  async areaSearch(area, filters = {}) {
    console.log('🔍 エリア検索開始（最適化版）:', { area, filters });
    
    const searchFilters = {
      ...filters,
      area: area
    };
    
    return this.fullTextSearch('', searchFilters);
  }

  // 類似商品検索（将来実装）
  async findSimilarProducts(productId, limit = 5) {
    console.log('🔍 類似商品検索開始:', { productId, limit });
    
    try {
      const { data, error } = await this.supabase
        .rpc('find_similar_products', {
          target_product_id: productId,
          similarity_limit: limit
        });
      
      console.log('🔍 類似商品検索結果:', { dataCount: data?.length || 0, error });
      return { data, error };
    } catch (error) {
      console.error('類似商品検索エラー:', error);
      return { data: [], error };
    }
  }

  // 地理検索（将来実装）
  async geographicSearch(lat, lng, radiusKm = 10, filters = {}) {
    console.log('🔍 地理検索開始:', { lat, lng, radiusKm, filters });
    
    try {
      const { data, error } = await this.supabase
        .rpc('search_nearby_stores', {
          lat: lat,
          lng: lng,
          radius_meters: radiusKm * 1000
        });
      
      console.log('🔍 地理検索結果:', { dataCount: data?.length || 0, error });
      return { data, error };
    } catch (error) {
      console.error('地理検索エラー:', error);
      return { data: [], error };
    }
  }

  // パフォーマンスログ記録（一時的に無効化）
  async logPerformance(searchType, searchTerm, filters, executionTime, resultCount) {
    try {
      console.log('パフォーマンスログ記録開始:', {
        searchType,
        searchTerm,
        filters,
        executionTime,
        resultCount
      });

      // パフォーマンスログテーブルが存在しないため一時的に無効化
      console.log('パフォーマンスログ記録（無効化中）');
      
      // const { error } = await this.supabase
      //   .from('search_performance_logs')
      //   .insert({
      //     search_type: searchType,
      //     search_term: searchTerm,
      //     filters: JSON.stringify(filters),
      //     execution_time_ms: executionTime,
      //     result_count: resultCount,
      //     created_at: new Date().toISOString()
      //   });

      // if (error) {
      //   console.error('パフォーマンスログ記録エラー:', error);
      // } else {
      //   console.log('パフォーマンスログ記録成功');
      // }
    } catch (error) {
      console.error('パフォーマンスログ記録例外:', error);
    }
  }
}

export default new SearchService();