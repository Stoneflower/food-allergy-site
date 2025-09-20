import { createClient } from '@supabase/supabase-js'
import { fromPath } from 'pdf2pic'
import Tesseract from 'tesseract.js'
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

// ページ単位でPDF処理
async function processPage(pdfPath, pageNumber) {
  try {
    console.log(`Processing page ${pageNumber}`)
    
    // PDF → 画像変換
    const converter = fromPath(pdfPath, { 
      density: 150,
      format: "png",
      outdir: "/tmp",
      outfile: `page_${pageNumber}`
    })
    
    const result = await converter(pageNumber)
    const imagePath = result.path
    
    // 画像をグリッド状に分割してセル検出
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
          height: cellHeight
        })
      }
    }
    
    // 各セルでOCR実行
    const pageData = []
    for (let i = 0; i < Math.min(cells.length, 40); i++) { // 最大40セルまで
      const cellImage = await sharp(imagePath)
        .extract({
          left: cells[i].x,
          top: cells[i].y,
          width: cells[i].width,
          height: cells[i].height
        })
        .png()
        .toBuffer()
      
      const { data: { text } } = await Tesseract.recognize(cellImage, 'jpn+eng')
      const cleanText = text.replace(/\n/g, ' ').trim()
      
      if (cleanText) {
        pageData.push(cleanText)
      }
    }
    
    // 一時ファイルを削除
    fs.unlinkSync(imagePath)
    
    return pageData
    
  } catch (error) {
    console.error(`Error processing page ${pageNumber}:`, error)
    return []
  }
}

// アレルギー情報を解析
function parseAllergyInfo(text) {
  const allergies = {}
  
  ALLERGY_28_ITEMS.forEach(item => {
    allergies[item] = 'none'
  })
  
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

// メニュー項目を抽出
function extractMenuItems(pageData) {
  const menuItems = []
  let currentMenu = null
  
  for (const text of pageData) {
    // メニュー名のパターンを検出
    if (text.length > 2 && text.length < 50 && !text.includes('：') && !text.includes(':')) {
      if (currentMenu) {
        menuItems.push(currentMenu)
      }
      currentMenu = {
        menu_name: text,
        allergies: {}
      }
    } else if (currentMenu && (text.includes('：') || text.includes(':'))) {
      // アレルギー情報を解析
      const allergies = parseAllergyInfo(text)
      currentMenu.allergies = { ...currentMenu.allergies, ...allergies }
    }
  }
  
  if (currentMenu) {
    menuItems.push(currentMenu)
  }
  
  return menuItems
}

// CSV形式に変換
function convertToCSV(menuItems) {
  const headers = ['メニュー名', ...ALLERGY_28_ITEMS]
  const csvRows = [headers.join(',')]
  
  menuItems.forEach(item => {
    const row = [
      `"${item.menu_name}"`,
      ...ALLERGY_28_ITEMS.map(allergy => item.allergies[allergy] || 'none')
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

// メイン処理（複数ページ対応）
export default async function handler(req) {
  try {
    console.log('Multi-page PDF to CSV conversion started')
    
    const formData = await req.formData()
    const pdfFile = formData.get('pdf')
    const maxPages = parseInt(formData.get('max_pages')) || 20
    
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
    
    // 複数ページを処理
    const allPageData = []
    const processedPages = Math.min(maxPages, 20) // 最大20ページまで
    
    for (let page = 1; page <= processedPages; page++) {
      try {
        const pageData = await processPage(pdfPath, page)
        if (pageData.length > 0) {
          allPageData.push(...pageData)
        }
        console.log(`Page ${page} processed: ${pageData.length} items`)
      } catch (pageError) {
        console.warn(`Failed to process page ${page}:`, pageError)
        // ページ処理に失敗しても続行
      }
    }
    
    console.log(`Total items extracted: ${allPageData.length}`)
    
    // メニュー項目を抽出
    const menuItems = extractMenuItems(allPageData)
    
    // アレルギー情報が不足している場合はデフォルト値を設定
    menuItems.forEach(item => {
      ALLERGY_28_ITEMS.forEach(allergy => {
        if (!item.allergies[allergy]) {
          item.allergies[allergy] = 'none'
        }
      })
    })
    
    // CSVに変換
    const csvContent = convertToCSV(menuItems)
    
    // 一時ファイルを削除
    try {
      fs.unlinkSync(pdfPath)
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError)
    }
    
    console.log(`Multi-page PDF to CSV conversion completed: ${menuItems.length} menu items`)
    
    // CSVファイルとして返す
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="allergy_data_multi.csv"'
      }
    })
    
  } catch (error) {
    console.error('Multi-page Edge Function error:', error)
    
    return new Response(JSON.stringify({ 
      error: '複数ページPDF処理中にエラーが発生しました',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
