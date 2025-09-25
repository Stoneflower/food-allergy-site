import { supabase } from './supabase';

class OptimizedSearchService {
  constructor() {
    this.supabase = supabase;
  }

  // 最適化された全文検索
  async fullTextSearch(searchTerm, filters = {}) {
    console.log('🔍 最適化全文検索開始:', { searchTerm, filters });
    
    try {
      // Typesenseの/search APIを呼び出し
      const searchParams = new URLSearchParams();
      
      if (searchTerm) {
        searchParams.append('q', searchTerm);
      }
      
      if (filters.category) {
        searchParams.append('filter_by', `category:=${filters.category}`);
      }
      
      if (filters.area) {
        searchParams.append('filter_by', `address:*${filters.area}*`);
      }
      
      if (filters.allergies?.length > 0) {
        const allergyFilter = filters.allergies.map(id => `allergy_item_id:=${id}`).join(' || ');
        searchParams.append('filter_by', allergyFilter);
      }
      
      searchParams.append('per_page', filters.limit || '200');
      searchParams.append('sort_by', 'updated_at:desc');
      
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Typesense API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 Typesense検索結果:', { 
        hits: result.hits?.length || 0, 
        total: result.found || 0 
      });
      
      // Typesenseの結果をSupabase形式に変換
      const data = result.hits?.map(hit => hit.document) || [];
      
      return { data, error: null };
    } catch (error) {
      console.error('Typesense検索エラー:', error);
      
      // フォールバック: 最適化されたSupabaseクエリ
      console.log('🔍 フォールバック: 最適化Supabaseクエリ実行');
      return this.optimizedFallbackSearch(searchTerm, filters);
    }
  }

  // 最適化されたフォールバック検索
  async optimizedFallbackSearch(searchTerm, filters = {}) {
    console.log('🔍 最適化フォールバック検索開始:', { searchTerm, filters });
    
    let query = this.supabase
      .from('products')
      .select(`
        *,
        product_allergies!inner(
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
      // 全文検索の使用（GINインデックス活用）
      query = query.textSearch('fts', searchTerm);
      console.log('🔍 全文検索条件追加:', searchTerm);
    }

    // アレルギー成分フィルタリング
    if (filters.allergies?.length > 0) {
      query = query.in('product_allergies.allergy_item_id', filters.allergies);
      console.log('🔍 アレルギーフィルター条件追加:', filters.allergies);
    }

    // エリアフィルタリング（トリグラムインデックス活用）
    if (filters.area) {
      query = query.ilike('store_locations.address', `%${filters.area}%`);
      console.log('🔍 エリアフィルター条件追加:', filters.area);
    }

    // カテゴリフィルタリング
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
      console.log('🔍 カテゴリフィルター条件追加:', filters.category);
    }

    // 並び順とリミット
    query = query
      .order('updated_at', { ascending: false })
      .limit(filters.limit || 200);

    const { data, error } = await query;
    
    console.log('🔍 最適化フォールバック検索結果:', { dataCount: data?.length || 0, error });
    return { data, error };
  }

  // 類似商品検索
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

  // ハイブリッド検索
  async hybridSearch(searchTerm, filters = {}) {
    console.log('🔍 ハイブリッド検索開始:', { searchTerm, filters });
    
    // Typesense検索を優先
    return this.fullTextSearch(searchTerm, filters);
  }

  // アレルギー検索
  async allergySearch(allergies, filters = {}) {
    console.log('🔍 アレルギー検索開始:', { allergies, filters });
    
    const searchFilters = {
      ...filters,
      allergies: allergies
    };
    
    return this.fullTextSearch('', searchFilters);
  }

  // エリア検索
  async areaSearch(area, filters = {}) {
    console.log('🔍 エリア検索開始:', { area, filters });
    
    const searchFilters = {
      ...filters,
      area: area
    };
    
    return this.fullTextSearch('', searchFilters);
  }

  // パフォーマンスログ記録
  async logPerformance(searchType, searchTerm, filters, executionTime, resultCount) {
    try {
      console.log('パフォーマンスログ記録開始:', {
        searchType,
        searchTerm,
        filters,
        executionTime,
        resultCount
      });

      const { error } = await this.supabase
        .from('search_performance_logs')
        .insert({
          search_type: searchType,
          search_term: searchTerm,
          filters: JSON.stringify(filters),
          execution_time_ms: executionTime,
          result_count: resultCount,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('パフォーマンスログ記録エラー:', error);
      } else {
        console.log('パフォーマンスログ記録成功');
      }
    } catch (error) {
      console.error('パフォーマンスログ記録例外:', error);
    }
  }
}

export default new OptimizedSearchService();
