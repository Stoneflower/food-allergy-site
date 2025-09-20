import { createClient } from '@supabase/supabase-js'
import { fromPath } from 'pdf2pic'
import Tesseract from 'tesseract.js'
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

// PDF → 画像変換（1ページずつ）
async function pdfToImages(pdfPath, pageNumber = 1) {
  try {
    const converter = fromPath(pdfPath, { 
      density: 150, // 高速化のためDPIを下げる
      format: "png",
      outdir: "/tmp",
      outfile: `page_${pageNumber}`
    })
    
    const result = await converter(pageNumber)
    return result.path
  } catch (error) {
    console.error('PDF to image conversion error:', error)
    throw error
  }
}

// 簡易的な表のセル検出（OpenCVの代替として画像処理）
async function detectTableCells(imagePath) {
  try {
    // Sharpを使用して画像を処理
    const image = sharp(imagePath)
    const { width, height } = await image.metadata()
    
    // グレースケール変換
    const grayscale = await image
      .greyscale()
      .threshold(150)
      .png()
      .toBuffer()
    
    // 簡易的なセル検出（実際のOpenCVの代替）
    // ここでは画像をグリッド状に分割してセルとして扱う
    const cellWidth = Math.floor(width / 10) // 10列に分割
    const cellHeight = Math.floor(height / 20) // 20行に分割
    
    const cells = []
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        cells.push({
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight
        })
      }
    }
    
    return cells
  } catch (error) {
    console.error('Cell detection error:', error)
    return []
  }
}

// TesseractでOCR実行
async function performOCR(imagePath, cellRect) {
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
    
    // Tesseract OCR実行
    const { data: { text } } = await Tesseract.recognize(
      cellImage,
      'jpn+eng',
      {
        logger: m => console.log(m)
      }
    )
    
    return text.replace(/\n/g, ' ').trim()
  } catch (error) {
    console.error('OCR error:', error)
    return ''
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

// CSV形式に変換
function convertToCSV(data) {
  const headers = ['メニュー名', ...ALLERGY_28_ITEMS]
  const csvRows = [headers.join(',')]
  
  data.forEach(item => {
    const row = [
      `"${item.menu_name}"`,
      ...ALLERGY_28_ITEMS.map(allergy => item.allergies[allergy] || 'none')
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

// メイン処理
export default async function handler(req) {
  try {
    console.log('PDF to CSV conversion started')
    
    // リクエストボディを取得
    const formData = await req.formData()
    const pdfFile = formData.get('pdf')
    const storeName = formData.get('store_name') || 'PDF Import'
    const storeRegion = formData.get('store_region') || ''
    const sourceUrl = formData.get('source_url') || ''
    const storeUrl = formData.get('store_url') || ''
    
    if (!pdfFile) {
      return new Response(JSON.stringify({ error: 'PDFファイルが指定されていません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // PDFファイルを一時保存
    const pdfPath = `/tmp/input_${Date.now()}.pdf`
    const pdfBuffer = await pdfFile.arrayBuffer()
    fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer))
    
    console.log(`PDF saved: ${pdfPath}`)
    
    // 1ページ目を処理（複数ページ対応は後で実装）
    const imagePath = await pdfToImages(pdfPath, 1)
    console.log(`Image converted: ${imagePath}`)
    
    // 表のセルを検出
    const cells = await detectTableCells(imagePath)
    console.log(`Cells detected: ${cells.length}`)
    
    // 各セルでOCR実行
    const extractedTexts = []
    for (let i = 0; i < Math.min(cells.length, 50); i++) { // 最大50セルまで処理
      const text = await performOCR(imagePath, cells[i])
      if (text) {
        extractedTexts.push(text)
      }
    }
    
    console.log(`OCR completed: ${extractedTexts.length} texts extracted`)
    
    // アレルギー情報を解析
    const combinedText = extractedTexts.join(' ')
    const allergies = parseAllergyInfo(combinedText)
    
    // メニュー名を抽出（最初のテキストをメニュー名として使用）
    const menuName = extractedTexts[0] || 'メニュー一覧'
    
    // データを構造化
    const allergyData = [{
      menu_name: menuName,
      allergies: allergies
    }]
    
    // CSVに変換
    const csvContent = convertToCSV(allergyData)
    
    // 一時ファイルを削除
    try {
      fs.unlinkSync(pdfPath)
      fs.unlinkSync(imagePath)
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError)
    }
    
    console.log('PDF to CSV conversion completed')
    
    // CSVファイルとして返す
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="allergy_data.csv"'
      }
    })
    
  } catch (error) {
    console.error('Edge Function error:', error)
    
    return new Response(JSON.stringify({ 
      error: 'PDF処理中にエラーが発生しました',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
