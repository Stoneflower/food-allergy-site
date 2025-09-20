import os
import io
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, render_template_string
from werkzeug.utils import secure_filename
import pandas as pd
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
import PyPDF2
import requests
from paddleocr import PaddleOCR
import base64

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# PaddleOCR初期化（日本語対応）
ocr = PaddleOCR(use_angle_cls=True, lang='jap')

# Supabase設定（環境変数から取得）
SUPABASE_URL = os.getenv('SUPABASE_URL', 'your_supabase_url')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your_supabase_key')

# アップロードフォルダ
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# HTMLテンプレート
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PaddleOCR - 画像・PDFからCSV変換</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
        .upload-area.dragover { border-color: #007bff; background-color: #f8f9fa; }
        button { background-color: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        .result { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
        .error { background-color: #f8d7da; color: #721c24; }
        .success { background-color: #d4edda; color: #155724; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🍽️ アレルギー情報 OCR 変換ツール</h1>
    <p>画像やPDFファイルをアップロードして、アレルギー情報をCSV形式でSupabaseに送信します。</p>
    
    <div class="upload-area" id="uploadArea">
        <p>📁 ファイルをドラッグ&ドロップまたはクリックして選択</p>
        <input type="file" id="fileInput" accept=".jpg,.jpeg,.png,.pdf" multiple style="display: none;">
        <button onclick="document.getElementById('fileInput').click()">ファイル選択</button>
    </div>
    
    <div id="result"></div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const resultDiv = document.getElementById('result');

        // ドラッグ&ドロップイベント
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function handleFiles(files) {
            if (files.length === 0) return;

            resultDiv.innerHTML = '<div class="result">処理中...</div>';

            const formData = new FormData();
            for (let file of files) {
                formData.append('files', file);
            }

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="result success">
                            <h3>✅ 処理完了</h3>
                            <p>処理されたファイル数: ${data.processed_files}</p>
                            <p>抽出されたメニュー数: ${data.total_menus}</p>
                            <p>Supabaseに送信: ${data.supabase_sent ? '成功' : '失敗'}</p>
                            ${data.csv_data ? `
                                <h4>📊 抽出されたデータ:</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>メニュー名</th>
                                            <th>牛乳</th>
                                            <th>卵</th>
                                            <th>小麦</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.csv_data.map(row => `
                                            <tr>
                                                <td>${row.menu_name || ''}</td>
                                                <td>${row.milk || ''}</td>
                                                <td>${row.egg || ''}</td>
                                                <td>${row.wheat || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : ''}
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="result error">
                            <h3>❌ エラー</h3>
                            <p>${data.error}</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                resultDiv.innerHTML = `
                    <div class="result error">
                        <h3>❌ エラー</h3>
                        <p>通信エラー: ${error.message}</p>
                    </div>
                `;
            });
        }
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'ファイルが選択されていません'})

        files = request.files.getlist('files')
        if not files or files[0].filename == '':
            return jsonify({'success': False, 'error': 'ファイルが選択されていません'})

        processed_files = 0
        all_extracted_data = []
        batch_id = str(uuid.uuid4())

        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)

                try:
                    # ファイルタイプに応じてOCR処理
                    if filename.lower().endswith('.pdf'):
                        extracted_text = extract_text_from_pdf(filepath)
                    else:
                        extracted_text = extract_text_from_image(filepath)

                    # テキストからアレルギー情報を抽出
                    allergy_data = parse_allergy_info(extracted_text, filename)
                    all_extracted_data.extend(allergy_data)
                    processed_files += 1

                except Exception as e:
                    print(f"ファイル処理エラー {filename}: {str(e)}")
                    continue
                finally:
                    # 一時ファイルを削除
                    if os.path.exists(filepath):
                        os.remove(filepath)

        # Supabaseに送信
        supabase_sent = False
        if all_extracted_data:
            supabase_sent = send_to_supabase(all_extracted_data, batch_id)

        return jsonify({
            'success': True,
            'processed_files': processed_files,
            'total_menus': len(all_extracted_data),
            'supabase_sent': supabase_sent,
            'csv_data': all_extracted_data[:10]  # 最初の10件のみ表示
        })

    except Exception as e:
        return jsonify({'success': False, 'error': f'サーバーエラー: {str(e)}'})

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    """画像の前処理でOCR精度を向上"""
    try:
        # OpenCVで画像を読み込み
        img = cv2.imread(image_path)
        
        # グレースケール変換
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # ガウシアンブラーでノイズ除去
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # アダプティブ閾値処理
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # 前処理済み画像を保存
        processed_path = image_path.replace('.', '_processed.')
        cv2.imwrite(processed_path, thresh)
        
        return processed_path
    except Exception as e:
        print(f"画像前処理エラー: {str(e)}")
        return image_path

def extract_text_from_image(image_path):
    """画像からテキストを抽出"""
    try:
        # 画像前処理
        processed_path = preprocess_image(image_path)
        
        # PaddleOCRでテキスト抽出
        result = ocr.ocr(processed_path, cls=True)
        extracted_text = []
        
        if result and result[0]:
            for line in result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]
                    confidence = line[1][1]
                    if confidence > 0.6:  # 信頼度60%以上（前処理により精度向上）
                        extracted_text.append(text)
        
        # 前処理済み画像を削除
        if processed_path != image_path and os.path.exists(processed_path):
            os.remove(processed_path)
        
        return '\n'.join(extracted_text)
    except Exception as e:
        print(f"画像OCRエラー: {str(e)}")
        return ""

def extract_text_from_pdf(pdf_path):
    """PDFからテキストを抽出"""
    try:
        extracted_text = []
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                if text.strip():
                    # PDFのテキスト抽出が不十分な場合、画像としてOCR処理
                    if len(text.strip()) < 50:  # テキストが少ない場合
                        # PDFを画像に変換してOCR処理
                        text = extract_text_from_pdf_as_image(pdf_path, page_num)
                    
                    extracted_text.append(text)
        
        return '\n'.join(extracted_text)
    except Exception as e:
        print(f"PDF処理エラー: {str(e)}")
        return ""

def extract_text_from_pdf_as_image(pdf_path, page_num):
    """PDFを画像としてOCR処理"""
    try:
        # ここでは簡易的に空文字を返す（実際の実装ではpdf2imageライブラリを使用）
        return f"[PDF Page {page_num + 1} - OCR処理が必要]"
    except Exception as e:
        print(f"PDF画像OCRエラー: {str(e)}")
        return ""

def parse_allergy_info(text, filename):
    """抽出されたテキストからアレルギー情報を解析"""
    try:
        lines = text.split('\n')
        allergy_data = []
        
        # メニュー名とアレルギー情報を抽出するパターンマッチング
        current_menu = None
        current_allergies = {'milk': 'none', 'egg': 'none', 'wheat': 'none'}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # メニュー名の検出（アレルギー情報以外の行）
            if not any(keyword in line.lower() for keyword in ['牛乳', '卵', '小麦', 'milk', 'egg', 'wheat']):
                if len(line) > 2 and not line.isdigit():  # 短すぎず、数字のみでない
                    current_menu = line
                    current_allergies = {'milk': 'none', 'egg': 'none', 'wheat': 'none'}
            
            # アレルギー情報の検出
            if '牛乳' in line or 'milk' in line.lower():
                if '含有' in line or '含む' in line or 'direct' in line.lower():
                    current_allergies['milk'] = 'direct'
                elif '交差' in line or 'cross' in line.lower():
                    current_allergies['milk'] = 'cross'
            
            if '卵' in line or 'egg' in line.lower():
                if '含有' in line or '含む' in line or 'direct' in line.lower():
                    current_allergies['egg'] = 'direct'
                elif '交差' in line or 'cross' in line.lower():
                    current_allergies['egg'] = 'cross'
            
            if '小麦' in line or 'wheat' in line.lower():
                if '含有' in line or '含む' in line or 'direct' in line.lower():
                    current_allergies['wheat'] = 'direct'
                elif '交差' in line or 'cross' in line.lower():
                    current_allergies['wheat'] = 'cross'
            
            # メニューが確定した場合、データに追加
            if current_menu and (current_allergies['milk'] != 'none' or 
                               current_allergies['egg'] != 'none' or 
                               current_allergies['wheat'] != 'none'):
                allergy_data.append({
                    'menu_name': current_menu,
                    'milk': current_allergies['milk'],
                    'egg': current_allergies['egg'],
                    'wheat': current_allergies['wheat'],
                    'source_file': filename,
                    'extracted_at': datetime.now().isoformat()
                })
                current_menu = None
        
        return allergy_data
    except Exception as e:
        print(f"アレルギー情報解析エラー: {str(e)}")
        return []

def send_to_supabase(allergy_data, batch_id):
    """Supabaseにデータを送信"""
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("Supabase設定が不完全です")
            return False
        
        # staging_importsテーブルに送信するデータを準備
        staging_data = []
        for i, item in enumerate(allergy_data):
            staging_data.append({
                'import_batch_id': batch_id,
                'row_no': i + 1,
                'raw_menu_name': item['menu_name'],
                'milk': item['milk'],
                'egg': item['egg'],
                'wheat': item['wheat'],
                'source_file': item['source_file'],
                'created_at': item['extracted_at']
            })
        
        # SupabaseにPOSTリクエスト
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        url = f"{SUPABASE_URL}/rest/v1/staging_imports"
        
        for data in staging_data:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code not in [200, 201]:
                print(f"Supabase送信エラー: {response.status_code} - {response.text}")
                return False
        
        print(f"Supabaseに{len(staging_data)}件のデータを送信しました")
        return True
        
    except Exception as e:
        print(f"Supabase送信エラー: {str(e)}")
        return False

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
