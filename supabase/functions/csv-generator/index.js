import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

// アレルギー28品目リスト
const ALLERGY_28_ITEMS = [
  '卵', '乳', '小麦', 'えび', 'かに', 'そば', '落花生', 'クルミ', 'アーモンド', 'あわび', 
  'いか', 'いくら', 'オレンジ', 'カシューナッツ', 'キウイフルーツ', '牛肉', 'ごま', 'さけ', 'さば', '大豆', 
  '鶏肉', 'バナナ', '豚肉', 'もも', 'やまいも', 'りんご', 'ゼラチン', 'マカダミアナッツ'
]

// CSV形式に変換
function convertToCSV(extractions) {
  // ヘッダー行
  const headers = ['メニュー名', 'ページ番号', '信頼度', ...ALLERGY_28_ITEMS]
  
  // データ行
  const rows = extractions.map(item => {
    const row = [
      `"${item.menu_name}"`,
      item.page_number,
      item.confidence_score,
      ...ALLERGY_28_ITEMS.map(allergy => item.allergies[allergy] || 'none')
    ]
    return row.join(',')
  })
  
  return [headers.join(','), ...rows].join('\n')
}

// メイン処理
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
    
    // ジョブの完了確認
    const { data: job, error: jobError } = await supabase
      .from('pdf_jobs')
      .select('status, file_name')
      .eq('id', jobId)
      .single()
    
    if (jobError) {
      return new Response(JSON.stringify({ error: 'ジョブが見つかりません' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (job.status !== 'completed') {
      return new Response(JSON.stringify({ 
        error: 'ジョブがまだ完了していません',
        status: job.status,
        message: '処理が完了するまでお待ちください'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // アレルギー抽出結果を取得
    const { data: extractions, error: extractionsError } = await supabase
      .from('allergy_extractions')
      .select('*')
      .eq('job_id', jobId)
      .order('page_number, created_at')
    
    if (extractionsError) {
      throw new Error(`Extractions query failed: ${extractionsError.message}`)
    }
    
    if (!extractions || extractions.length === 0) {
      return new Response(JSON.stringify({ 
        error: '抽出されたデータがありません',
        message: 'PDFからアレルギー情報を抽出できませんでした'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // CSV生成
    const csvContent = convertToCSV(extractions)
    
    // ファイル名を生成
    const fileName = job.file_name 
      ? job.file_name.replace('.pdf', '_allergy_data.csv')
      : `allergy_data_${jobId}.csv`
    
    console.log(`CSV generated for job ${jobId}: ${extractions.length} items`)
    
    // CSVファイルとして返す
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('CSV generator error:', error)
    
    return new Response(JSON.stringify({
      error: 'CSV生成中にエラーが発生しました',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
