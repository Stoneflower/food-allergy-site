import { createClient } from '@supabase/supabase-js'
import { fromPath } from 'pdf2pic'
import Tesseract from 'tesseract.js'
import cv from 'opencv4nodejs'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

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

// PDF → 画像変換（高精度）
async function pdfToImages(pdfPath, pageNumber = 1) {
  try {
    console.log(`Converting PDF page ${pageNumber} to image...`)
    
    const converter = fromPath(pdfPath, { 
      density: 200, // 高精度のためDPIを上げる
      format: "png",
      outdir: "/tmp",
      outfile: `page_${pageNumber}_${Date.now()}`
    })
    
    const result = await converter(pageNumber)
    console.log(`Page ${pageNumber} converted: ${result.path}`)
    return result.path
  } catch (error) {
    console.error(`PDF to image conversion error for page ${pageNumber}:`, error)
    throw error
  }
}

// OpenCVを使用した高精度な表セル検出
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
    
    // Tesseract OCR実行（高精度設定）
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

// ページ処理（非同期）
async function processPageAsync(jobId, pageNumber, pdfPath) {
  try {
    console.log(`Starting async processing for page ${pageNumber}`)
    
    // ページステータスを更新
    await supabase
      .from('pdf_pages')
      .update({ status: 'processing' })
      .eq('job_id', jobId)
      .eq('page_number', pageNumber)
    
    const startTime = Date.now()
    
    // PDF → 画像変換
    const imagePath = await pdfToImages(pdfPath, pageNumber)
    
    // 表セル検出
    const cells = detectTableCells(imagePath)
    
    // 各セルでOCR実行
    const pageResults = []
    for (let i = 0; i < Math.min(cells.length, 100); i++) { // 最大100セルまで処理
      const cell = cells[i]
      const ocrResult = await performAdvancedOCR(imagePath, cell)
      
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
      .update({
        json_data: pageResults,
        status: 'completed',
        processing_time_ms: processingTime
      })
      .eq('job_id', jobId)
      .eq('page_number', pageNumber)
    
    // アレルギー情報を個別テーブルに保存
    for (const result of pageResults) {
      if (result.text.length > 2) { // メニュー名として適切な長さ
        await supabase
          .from('allergy_extractions')
          .insert({
            job_id: jobId,
            menu_name: result.text,
            allergies: result.allergies,
            page_number: pageNumber,
            cell_position: result.cell_position,
            confidence_score: result.confidence
          })
      }
    }
    
    // 完了ページ数を更新
    const { data: jobData } = await supabase
      .from('pdf_jobs')
      .select('completed_pages')
      .eq('id', jobId)
      .single()
    
    await supabase
      .from('pdf_jobs')
      .update({ completed_pages: (jobData.completed_pages || 0) + 1 })
      .eq('id', jobId)
    
    // 全ページ完了チェック
    const { data: allPages } = await supabase
      .from('pdf_pages')
      .select('status')
      .eq('job_id', jobId)
    
    const completedPages = allPages.filter(p => p.status === 'completed').length
    const totalPages = allPages.length
    
    if (completedPages === totalPages) {
      await supabase
        .from('pdf_jobs')
        .update({ status: 'completed' })
        .eq('id', jobId)
    }
    
    // 一時ファイルを削除
    try {
      fs.unlinkSync(imagePath)
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError)
    }
    
    console.log(`Page ${pageNumber} processing completed in ${processingTime}ms`)
    
  } catch (error) {
    console.error(`Error processing page ${pageNumber}:`, error)
    
    // エラーステータスを更新
    await supabase
      .from('pdf_pages')
      .update({
        status: 'error',
        error_message: error.message
      })
      .eq('job_id', jobId)
      .eq('page_number', pageNumber)
  }
}

// メイン処理（ジョブ開始）
export default async function handler(req) {
  try {
    console.log('Advanced PDF processor started')
    
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
    
    // PDFページ数を取得（簡易版）
    const totalPages = Math.min(maxPages, 20) // 最大20ページまで
    
    // ジョブの総ページ数を更新
    await supabase
      .from('pdf_jobs')
      .update({ total_pages: totalPages })
      .eq('id', job.id)
    
    // ページレコードを作成
    const pageRecords = []
    for (let i = 1; i <= totalPages; i++) {
      pageRecords.push({
        job_id: job.id,
        page_number: i,
        status: 'pending'
      })
    }
    
    await supabase
      .from('pdf_pages')
      .insert(pageRecords)
    
    // 各ページを非同期で処理開始
    for (let page = 1; page <= totalPages; page++) {
      // 非同期で処理を開始（awaitしない）
      processPageAsync(job.id, page, pdfPath).catch(error => {
        console.error(`Async processing error for page ${page}:`, error)
      })
    }
    
    // 一時ファイルを削除（非同期処理が完了するまで待たない）
    setTimeout(() => {
      try {
        fs.unlinkSync(pdfPath)
      } catch (cleanupError) {
        console.warn('PDF cleanup error:', cleanupError)
      }
    }, 10000) // 10秒後に削除
    
    console.log(`Job ${job.id} started with ${totalPages} pages`)
    
    return new Response(JSON.stringify({
      job_id: job.id,
      total_pages: totalPages,
      status: 'processing',
      message: 'PDF処理を開始しました。進捗はポーリングで確認してください。'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Advanced PDF processor error:', error)
    
    return new Response(JSON.stringify({
      error: 'PDF処理中にエラーが発生しました',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
