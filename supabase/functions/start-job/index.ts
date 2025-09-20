import { createClient } from '@supabase/supabase-js'
import { fromPath } from 'pdf2pic'
import fs from 'fs'

// Supabase設定
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

// PDF → 画像変換（ページ分割）
async function pdfToImages(pdfPath, maxPages = 20) {
  try {
    console.log(`Converting PDF to images (max ${maxPages} pages)...`)
    
    const converter = fromPath(pdfPath, { 
      density: 150, // 無料枠対応のためDPIを下げる
      format: "png",
      outdir: "/tmp",
      outfile: `page_${Date.now()}`
    })
    
    const images = []
    const totalPages = Math.min(maxPages, 20) // 最大20ページまで
    
    for (let i = 1; i <= totalPages; i++) {
      try {
        const result = await converter(i)
        images.push(result.path)
        console.log(`Page ${i} converted: ${result.path}`)
      } catch (pageError) {
        console.warn(`Failed to convert page ${i}:`, pageError)
        // ページ変換に失敗しても続行
        break
      }
    }
    
    console.log(`Total ${images.length} pages converted`)
    return images
    
  } catch (error) {
    console.error('PDF to images conversion error:', error)
    throw error
  }
}

// メイン処理
export default async function handler(req) {
  try {
    console.log('Job start function called')
    
    // リクエストボディを取得
    const formData = await req.formData()
    const pdfFile = formData.get('pdf')
    const maxPages = parseInt(formData.get('max_pages')) || 20
    const userId = formData.get('user_id') || null
    
    if (!pdfFile) {
      return new Response(JSON.stringify({ error: 'PDFファイルが指定されていません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // ファイルサイズチェック（無料枠対応）
    if (pdfFile.size > 10 * 1024 * 1024) { // 10MB制限
      return new Response(JSON.stringify({ error: 'ファイルサイズが大きすぎます（10MB制限）' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // ジョブを作成
    const { data: job, error: jobError } = await supabase
      .from('pdf_jobs')
      .insert({
        user_id: userId,
        file_name: pdfFile.name,
        file_size: pdfFile.size,
        status: 'processing',
        total_pages: 0,
        completed_pages: 0
      })
      .select()
      .single()
    
    if (jobError) {
      throw new Error(`Job creation failed: ${jobError.message}`)
    }
    
    console.log(`Job created: ${job.id}`)
    
    // PDFファイルを一時保存
    const pdfPath = `/tmp/input_${job.id}.pdf`
    const pdfBuffer = await pdfFile.arrayBuffer()
    fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer))
    
    try {
      // PDF → 画像変換
      const images = await pdfToImages(pdfPath, maxPages)
      
      if (images.length === 0) {
        throw new Error('PDFから画像を生成できませんでした')
      }
      
      // ジョブの総ページ数を更新
      await supabase
        .from('pdf_jobs')
        .update({ total_pages: images.length })
        .eq('id', job.id)
      
      // ページごとにQueueに登録
      const queueRecords = []
      for (let i = 0; i < images.length; i++) {
        queueRecords.push({
          job_id: job.id,
          page_number: i + 1,
          pdf_page_path: images[i],
          status: 'pending'
        })
      }
      
      const { error: queueError } = await supabase
        .from('pdf_page_queue')
        .insert(queueRecords)
      
      if (queueError) {
        throw new Error(`Queue creation failed: ${queueError.message}`)
      }
      
      console.log(`Queue created with ${queueRecords.length} pages for job ${job.id}`)
      
      // 一時ファイルを削除（非同期処理が完了するまで待たない）
      setTimeout(() => {
        try {
          fs.unlinkSync(pdfPath)
          console.log(`Temporary PDF file deleted: ${pdfPath}`)
        } catch (cleanupError) {
          console.warn('PDF cleanup error:', cleanupError)
        }
      }, 30000) // 30秒後に削除
      
      return new Response(JSON.stringify({
        job_id: job.id,
        total_pages: images.length,
        status: 'processing',
        message: 'ジョブが作成され、Queueに登録されました。ページ処理を開始してください。'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (processingError) {
      // エラー時はジョブステータスを更新
      await supabase
        .from('pdf_jobs')
        .update({ 
          status: 'error',
          error_message: processingError.message
        })
        .eq('id', job.id)
      
      throw processingError
    }
    
  } catch (error) {
    console.error('Start job error:', error)
    
    return new Response(JSON.stringify({
      error: 'ジョブ開始中にエラーが発生しました',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
