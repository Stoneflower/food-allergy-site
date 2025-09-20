import { createClient } from '@supabase/supabase-js'
import Tesseract from 'tesseract.js'
import cv from 'opencv4nodejs'
import sharp from 'sharp'
import fs from 'fs'

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

// OpenCVを使用した表セル検出
function detectTableCells(imagePath) {
  try {
    console.log('Detecting table cells with OpenCV...')
    
    // 画像を読み込み
    const img = cv.imread(imagePath)
    const gray = img.bgrToGray()
    
    // 二値化処理
    const binary = gray.threshold(150, 255, cv.THRESH_BINARY_INV)
    
    // モルフォロジー処理でノイズ除去
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
    const morph = binary.morphologyEx(kernel, cv.MORPH_CLOSE)
    
    // 輪郭検出
    const contours = morph.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    
    // セル候補を抽出
    const cells = []
    for (let i = 0; i < contours.length; i++) {
      const contour = contours[i]
      const area = contour.area
      const rect = contour.boundingRect()
      
      // セルとして適切なサイズの矩形のみを選択
      if (area > 100 && rect.width > 20 && rect.height > 10) {
        cells.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          area: area
        })
      }
    }
    
    // Y座標で行ソート、X座標で列ソート
    cells.sort((a, b) => {
      const yDiff = Math.abs(a.y - b.y)
      if (yDiff < 20) { // 同じ行とみなす閾値
        return a.x - b.x
      }
      return a.y - b.y
    })
    
    console.log(`Detected ${cells.length} table cells`)
    return cells
    
  } catch (error) {
    console.error('OpenCV cell detection error:', error)
    // フォールバック: グリッド分割
    return detectTableCellsFallback(imagePath)
  }
}

// フォールバック: グリッド分割によるセル検出
async function detectTableCellsFallback(imagePath) {
  try {
    const image = sharp(imagePath)
    const { width, height } = await image.metadata()
    
    const cellWidth = Math.floor(width / 8) // 8列
    const cellHeight = Math.floor(height / 15) // 15行
    
    const cells = []
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 8; col++) {
        cells.push({
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
          area: cellWidth * cellHeight
        })
      }
    }
    
    console.log(`Fallback: Created ${cells.length} grid cells`)
    return cells
  } catch (error) {
    console.error('Fallback cell detection error:', error)
    return []
  }
}

// 高精度OCR処理
async function performAdvancedOCR(imagePath, cellRect) {
  try {
    // セル領域を切り出し
    const cellImage = await sharp(imagePath)
      .extract({
        left: cellRect.x,
        top: cellRect.y,
        width: cellRect.width,
        height: cellRect.height
      })
      .png()
      .toBuffer()
    
    // 画像前処理でOCR精度向上
    const processedImage = await sharp(cellImage)
      .greyscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer()
    
    // Tesseract OCR実行（無料枠対応の高速設定）
    const { data } = await Tesseract.recognize(
      processedImage,
      'jpn+eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
          }
        },
        tessedit_pageseg_mode: '6', // 単一のテキストブロック
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん：:含有ありなし無コンタミ混入'
      }
    )
    
    const text = data.text.replace(/\n/g, ' ').trim()
    const confidence = data.confidence
    
    return {
      text: text,
      confidence: confidence
    }
    
  } catch (error) {
    console.error('Advanced OCR error:', error)
    return {
      text: '',
      confidence: 0
    }
  }
}

// アレルギー情報を解析
function parseAllergyInfo(text) {
  const allergies = {}
  
  // アレルギー28品目を初期化
  ALLERGY_28_ITEMS.forEach(item => {
    allergies[item] = 'none'
  })
  
  // テキストからアレルギー情報を抽出
  ALLERGY_28_ITEMS.forEach(item => {
    const patterns = [
      new RegExp(`${item}[：:](.*?)(?:\\s|$)`, 'i'),
      new RegExp(`${item}(.*?)(?:\\s|$)`, 'i')
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const value = match[1] || match[0]
        if (value.includes('含有') || value.includes('あり') || value.includes('入')) {
          allergies[item] = 'direct'
        } else if (value.includes('コンタミ') || value.includes('混入')) {
          allergies[item] = 'contamination'
        } else if (value.includes('なし') || value.includes('無')) {
          allergies[item] = 'none'
        }
        break
      }
    }
  })
  
  return allergies
}

// 単一ページ処理
async function processPage(pageData) {
  try {
    const startTime = Date.now()
    console.log(`Processing page ${pageData.page_number}...`)
    
    // ステータスをprocessingに更新
    await supabase
      .from('pdf_page_queue')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', pageData.id)
    
    // 表セル検出
    const cells = detectTableCells(pageData.pdf_page_path)
    
    // 各セルでOCR実行（無料枠対応で制限）
    const pageResults = []
    const maxCells = Math.min(cells.length, 50) // 最大50セルまで処理
    
    for (let i = 0; i < maxCells; i++) {
      const cell = cells[i]
      const ocrResult = await performAdvancedOCR(pageData.pdf_page_path, cell)
      
      if (ocrResult.text && ocrResult.confidence > 30) { // 信頼度30%以上
        const allergies = parseAllergyInfo(ocrResult.text)
        
        pageResults.push({
          cell_position: {
            x: cell.x,
            y: cell.y,
            width: cell.width,
            height: cell.height
          },
          text: ocrResult.text,
          allergies: allergies,
          confidence: ocrResult.confidence
        })
      }
    }
    
    const processingTime = Date.now() - startTime
    
    // 結果をDBに保存
    await supabase
      .from('pdf_pages')
      .insert({
        job_id: pageData.job_id,
        page_number: pageData.page_number,
        json_data: pageResults,
        status: 'completed',
        processing_time_ms: processingTime
      })
    
    // アレルギー情報を個別テーブルに保存
    for (const result of pageResults) {
      if (result.text.length > 2) { // メニュー名として適切な長さ
        await supabase
          .from('allergy_extractions')
          .insert({
            job_id: pageData.job_id,
            menu_name: result.text,
            allergies: result.allergies,
            page_number: pageData.page_number,
            cell_position: result.cell_position,
            confidence_score: result.confidence
          })
      }
    }
    
    // Queueステータスを完了に更新
    await supabase
      .from('pdf_page_queue')
      .update({ 
        status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', pageData.id)
    
    // ジョブの完了ページ数を更新
    const { data: jobData } = await supabase
      .from('pdf_jobs')
      .select('completed_pages')
      .eq('id', pageData.job_id)
      .single()
    
    await supabase
      .from('pdf_jobs')
      .update({ completed_pages: (jobData.completed_pages || 0) + 1 })
      .eq('id', pageData.job_id)
    
    // 全ページ完了チェック
    const { data: allPages } = await supabase
      .from('pdf_page_queue')
      .select('status')
      .eq('job_id', pageData.job_id)
    
    const completedPages = allPages.filter(p => p.status === 'completed').length
    const totalPages = allPages.length
    
    if (completedPages === totalPages) {
      await supabase
        .from('pdf_jobs')
        .update({ status: 'completed' })
        .eq('id', pageData.job_id)
    }
    
    console.log(`Page ${pageData.page_number} completed in ${processingTime}ms`)
    return { success: true, processingTime }
    
  } catch (error) {
    console.error(`Error processing page ${pageData.page_number}:`, error)
    
    // エラーステータスを更新
    await supabase
      .from('pdf_page_queue')
      .update({
        status: 'error',
        error_message: error.message
      })
      .eq('id', pageData.id)
    
    return { success: false, error: error.message }
  }
}

// メイン処理（並列処理）
export default async function handler(req) {
  try {
    console.log('Process pages function called')
    
    // 並列処理数を取得（無料枠対応）
    const parallelCount = parseInt(req.headers.get('x-parallel-count')) || 3
    
    // pendingページを取得
    const { data: pendingPages, error: queueError } = await supabase
      .from('pdf_page_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(parallelCount)
    
    if (queueError) {
      throw new Error(`Queue query failed: ${queueError.message}`)
    }
    
    if (!pendingPages || pendingPages.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No pending pages to process',
        processed_count: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`Processing ${pendingPages.length} pages in parallel`)
    
    // 並列処理実行
    const results = await Promise.all(
      pendingPages.map(page => processPage(page))
    )
    
    // 結果集計
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalProcessingTime = results
      .filter(r => r.processingTime)
      .reduce((sum, r) => sum + r.processingTime, 0)
    
    console.log(`Processing completed: ${successful} successful, ${failed} failed`)
    
    return new Response(JSON.stringify({
      message: 'Pages processed',
      processed_count: pendingPages.length,
      successful_count: successful,
      failed_count: failed,
      total_processing_time_ms: totalProcessingTime,
      average_processing_time_ms: successful > 0 ? Math.round(totalProcessingTime / successful) : 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Process pages error:', error)
    
    return new Response(JSON.stringify({
      error: 'ページ処理中にエラーが発生しました',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
