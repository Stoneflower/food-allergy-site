import os
import io
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, render_template_string
from werkzeug.utils import secure_filename
# import pandas as pd  # Netlify対応のため一時的にコメントアウト
import requests

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# OCR初期化（Netlify対応のため簡易版）
# ocr = PaddleOCR(use_angle_cls=True, lang='jap')
ocr = None  # 一時的に無効化

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
    <h1>🍽️ アレルギー情報 OCR 変換ツール（Netlify版）</h1>
    <p>画像やPDFファイルをアップロードして、アレルギー情報をCSV形式でSupabaseに送信します。</p>
    <p><strong>注意:</strong> 現在はデモ版です。実際のOCR処理はRender版で利用可能です。</p>
    
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

# 前処理関数は削除（Netlify対応のため）

def extract_text_from_image(image_path):
    """画像からテキストを抽出（Netlify対応版）"""
    try:
        # NetlifyでPaddleOCRがビルドできないため、簡易的なテキスト抽出
        # 実際のOCR処理は後でRenderで実装
        
        # サンプルデータを返す（デモ用）
        sample_text = """
        アイスカフェラテ
        牛乳含有
        卵なし
        小麦なし
        
        いきいき乳酸菌ヨーデル
        牛乳含有
        卵なし
        小麦なし
        """
        
        return sample_text.strip()
        
    except Exception as e:
        print(f"画像OCRエラー: {str(e)}")
        return ""

def extract_text_from_pdf(pdf_path):
    """PDFからテキストを抽出（Netlify対応版）"""
    try:
        # Netlify対応のため、サンプルデータを返す
        sample_text = """
        メニュー一覧
        アイスカフェラテ - 牛乳含有
        いきいき乳酸菌ヨーデル - 牛乳含有
        """
        return sample_text.strip()
    except Exception as e:
        print(f"PDF処理エラー: {str(e)}")
        return ""

# PDF画像OCR関数は削除（Netlify対応のため）

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
        print(f"Supabase送信開始: URL={SUPABASE_URL}, KEY={SUPABASE_KEY[:20]}...")
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("Supabase設定が不完全です")
            print(f"URL: {SUPABASE_URL}")
            print(f"KEY: {SUPABASE_KEY[:20] if SUPABASE_KEY else 'None'}...")
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
        
        print(f"送信データ: {staging_data}")
        
        # SupabaseにPOSTリクエスト
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        url = f"{SUPABASE_URL}/rest/v1/staging_imports"
        print(f"送信URL: {url}")
        
        for data in staging_data:
            print(f"送信中: {data}")
            response = requests.post(url, json=data, headers=headers)
            print(f"レスポンス: {response.status_code} - {response.text}")
            
            if response.status_code not in [200, 201]:
                print(f"Supabase送信エラー: {response.status_code} - {response.text}")
                return False
        
        print(f"Supabaseに{len(staging_data)}件のデータを送信しました")
        return True
        
    except Exception as e:
        print(f"Supabase送信エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
