import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

// ジョブステータス確認
export default async function handler(req) {
  try {
    const url = new URL(req.url)
    const jobId = url.pathname.split('/').pop()
    
    if (!jobId) {
      return new Response(JSON.stringify({ error: 'ジョブIDが指定されていません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // ジョブ情報を取得
    const { data: job, error: jobError } = await supabase
      .from('pdf_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    
    if (jobError) {
      return new Response(JSON.stringify({ error: 'ジョブが見つかりません' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // ページ処理状況を取得（Queue対応）
    const { data: pages, error: pagesError } = await supabase
      .from('pdf_pages')
      .select('page_number, status, processing_time_ms, error_message')
      .eq('job_id', jobId)
      .order('page_number')
    
    if (pagesError) {
      console.error('Pages query error:', pagesError)
    }
    
    // Queue状況を取得
    const { data: queueItems, error: queueError } = await supabase
      .from('pdf_page_queue')
      .select('page_number, status, processing_started_at, processing_completed_at, error_message')
      .eq('job_id', jobId)
      .order('page_number')
    
    if (queueError) {
      console.error('Queue query error:', queueError)
    }
    
    // アレルギー抽出結果数を取得
    const { data: extractions, error: extractionsError } = await supabase
      .from('allergy_extractions')
      .select('id')
      .eq('job_id', jobId)
    
    if (extractionsError) {
      console.error('Extractions query error:', extractionsError)
    }
    
    // 進捗計算
    const totalPages = job.total_pages || 0
    const completedPages = job.completed_pages || 0
    const progress = totalPages > 0 ? (completedPages / totalPages) * 100 : 0
    
    // エラーページ数を計算
    const errorPages = pages ? pages.filter(p => p.status === 'error').length : 0
    const errorQueueItems = queueItems ? queueItems.filter(q => q.status === 'error').length : 0
    
    // 平均処理時間を計算
    const completedPagesWithTime = pages ? pages.filter(p => p.processing_time_ms) : []
    const avgProcessingTime = completedPagesWithTime.length > 0 
      ? completedPagesWithTime.reduce((sum, p) => sum + p.processing_time_ms, 0) / completedPagesWithTime.length
      : 0
    
    // Queue統計
    const queueStats = queueItems ? {
      total: queueItems.length,
      pending: queueItems.filter(q => q.status === 'pending').length,
      processing: queueItems.filter(q => q.status === 'processing').length,
      completed: queueItems.filter(q => q.status === 'completed').length,
      error: errorQueueItems
    } : {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      error: 0
    }
    
    const response = {
      job_id: job.id,
      file_name: job.file_name,
      file_size: job.file_size,
      status: job.status,
      total_pages: totalPages,
      completed_pages: completedPages,
      error_pages: errorPages,
      progress: Math.round(progress * 100) / 100,
      extracted_items: extractions ? extractions.length : 0,
      avg_processing_time_ms: Math.round(avgProcessingTime),
      created_at: job.created_at,
      updated_at: job.updated_at,
      error_message: job.error_message,
      pages: pages || [],
      queue_stats: queueStats,
      queue_items: queueItems || []
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Job status error:', error)
    
    return new Response(JSON.stringify({
      error: 'ジョブステータス取得中にエラーが発生しました',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
