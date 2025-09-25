import { supabase } from './supabase';

class SearchService {
  constructor() {
    this.supabase = supabase;
  }

  // 全文検索（インデックス使用）
  async fullTextSearch(searchTerm, filters = {}) {
    let query = this.supabase
      .from('products')
      .select(`
        *,
        product_allergies(
          allergy_item_id,
          presence_type,
          notes
        ),
        store_locations(
          id,
          branch_name,
          address,
          store_list_url
        )
      `);

    if (searchTerm) {
      // 全文検索インデックスを使用
      query = query.textSearch('fts', searchTerm, {
        type: 'websearch',
        config: 'english'
      });
    }

    // フィルタリング
    if (filters.allergies?.length > 0) {
      query = query.in('product_allergies.allergy_item_id', filters.allergies);
    }

    if (filters.area) {
      query = query.ilike('store_locations.address', `%${filters.area}%`);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .limit(filters.limit || 50);

    return { data, error };
  }

  // ハイブリッド検索（全文検索 + LIKE検索）
  async hybridSearch(searchTerm, filters = {}) {
    if (!searchTerm) {
      return this.fullTextSearch('', filters);
    }

    try {
      // 全文検索とLIKE検索の両方を実行
      const [fullTextResults, likeResults] = await Promise.all([
        this.fullTextSearch(searchTerm, filters),
        this.likeSearch(searchTerm, filters)
      ]);

      // 結果をマージして重複を除去
      const mergedResults = this.mergeSearchResults(fullTextResults.data, likeResults.data);
      
      return { data: mergedResults, error: fullTextResults.error || likeResults.error };
    } catch (error) {
      console.error('ハイブリッド検索エラー:', error);
      // フォールバック: LIKE検索のみ実行
      return this.likeSearch(searchTerm, filters);
    }
  }

  // LIKE検索（フォールバック用）
  async likeSearch(searchTerm, filters = {}) {
    let query = this.supabase
      .from('products')
      .select(`
        *,
        product_allergies(
          allergy_item_id,
          presence_type,
          notes
        ),
        store_locations(
          id,
          branch_name,
          address,
          store_list_url
        )
      `);

    if (searchTerm) {
      query = query.or(`
        name.ilike.%${searchTerm}%,
        product_title.ilike.%${searchTerm}%,
        brand.ilike.%${searchTerm}%,
        description.ilike.%${searchTerm}%
      `);
    }

    // フィルタリング
    if (filters.allergies?.length > 0) {
      query = query.in('product_allergies.allergy_item_id', filters.allergies);
    }

    if (filters.area) {
      query = query.ilike('store_locations.address', `%${filters.area}%`);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .limit(filters.limit || 50);

    return { data, error };
  }

  // 検索結果のマージ
  mergeSearchResults(fullTextData, likeData) {
    const merged = new Map();
    
    // 全文検索結果を優先（スコア1.0）
    fullTextData?.forEach(item => {
      merged.set(item.id, { ...item, searchScore: 1.0 });
    });
    
    // LIKE検索結果を追加（重複はスコアを下げる）
    likeData?.forEach(item => {
      if (merged.has(item.id)) {
        // 既存の結果がある場合、スコアを上げる
        merged.get(item.id).searchScore = Math.max(merged.get(item.id).searchScore, 0.8);
      } else {
        // 新規結果
        merged.set(item.id, { ...item, searchScore: 0.8 });
      }
    });
    
    return Array.from(merged.values())
      .sort((a, b) => b.searchScore - a.searchScore);
  }

  // アレルギー成分での検索
  async searchByAllergies(allergyIds, filters = {}) {
    let query = this.supabase
      .from('products')
      .select(`
        *,
        product_allergies!inner(
          allergy_item_id,
          presence_type,
          notes
        ),
        store_locations(
          id,
          branch_name,
          address,
          store_list_url
        )
      `)
      .in('product_allergies.allergy_item_id', allergyIds);

    // 追加フィルタリング
    if (filters.area) {
      query = query.ilike('store_locations.address', `%${filters.area}%`);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .limit(filters.limit || 50);

    return { data, error };
  }

  // エリア検索
  async searchByArea(area, filters = {}) {
    let query = this.supabase
      .from('products')
      .select(`
        *,
        product_allergies(
          allergy_item_id,
          presence_type,
          notes
        ),
        store_locations!inner(
          id,
          branch_name,
          address,
          store_list_url
        )
      `)
      .ilike('store_locations.address', `%${area}%`);

    // 追加フィルタリング
    if (filters.allergies?.length > 0) {
      query = query.in('product_allergies.allergy_item_id', filters.allergies);
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .limit(filters.limit || 50);

    return { data, error };
  }

  // パフォーマンスログの記録
  async logSearchPerformance(searchTerm, executionTime, resultCount) {
    try {
      console.log('パフォーマンスログ記録開始:', { searchTerm, executionTime, resultCount });
      
      // まずRPC関数を試行
      const { error: rpcError } = await this.supabase.rpc('log_search_performance', {
        search_term: searchTerm,
        execution_time_ms: executionTime,
        result_count: resultCount
      });
      
      if (rpcError) {
        console.warn('RPC関数でのログ記録に失敗、直接挿入を試行:', rpcError);
        
        // フォールバック: 直接テーブルに挿入
        const { error: insertError } = await this.supabase
          .from('search_performance_log')
          .insert({
            search_term: searchTerm,
            execution_time_ms: executionTime,
            result_count: resultCount,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('直接挿入も失敗:', insertError);
        } else {
          console.log('直接挿入でパフォーマンスログ記録成功');
        }
      } else {
        console.log('RPC関数でパフォーマンスログ記録成功');
      }
    } catch (error) {
      console.error('検索パフォーマンスログの記録に失敗:', error);
    }
  }

  // 検索統計の取得
  async getSearchStats() {
    try {
      const { data, error } = await this.supabase
        .from('search_performance_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return {
        totalSearches: data.length,
        avgExecutionTime: data.reduce((sum, item) => sum + item.execution_time_ms, 0) / data.length,
        avgResultCount: data.reduce((sum, item) => sum + item.result_count, 0) / data.length,
        recentSearches: data.slice(0, 10)
      };
    } catch (error) {
      console.error('検索統計の取得エラー:', error);
      return null;
    }
  }
}

export const searchService = new SearchService();
