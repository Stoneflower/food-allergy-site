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

# CSV変換機能のHTMLテンプレート
CSV_CONVERTER_TEMPLATE = '''
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>詳細CSV変換ツール</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .section h3 { margin-top: 0; color: #333; }
        .form-group { margin: 10px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 3px; }
        .checkbox-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .checkbox-item { display: flex; align-items: center; gap: 5px; }
        .btn { background-color: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 3px; margin: 5px; }
        .btn:hover { background-color: #0056b3; }
        .btn-success { background-color: #28a745; }
        .btn-success:hover { background-color: #1e7e34; }
        .result { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .mapping-row { display: flex; gap: 10px; margin: 5px 0; align-items: center; }
        .mapping-row input { flex: 1; }
        .add-mapping { background-color: #17a2b8; }
        .add-mapping:hover { background-color: #138496; }
    </style>
</head>
<body>
    <h1>🔧 詳細CSV変換ツール</h1>
    
    <!-- データ入力セクション -->
    <div class="section">
        <h3>📊 データ入力</h3>
        <div class="form-group">
            <label>入力方式を選択:</label>
            <select id="inputType" onchange="toggleInputType()">
                <option value="csv">CSVデータ（JSON形式）</option>
                <option value="pdf">PDFファイル</option>
            </select>
        </div>
        
        <!-- CSV入力 -->
        <div id="csvInput" class="form-group">
            <label>CSVデータ（JSON形式）:</label>
            <textarea id="csvData" rows="10" placeholder='[{"menu_name": "アイスカフェラテ", "milk": "direct", "egg": "none", "wheat": "none"}]'></textarea>
            <button class="btn" onclick="loadSampleData()">サンプルデータを読み込み</button>
        </div>
        
        <!-- PDF入力 -->
        <div id="pdfInput" class="form-group" style="display: none;">
            <label>PDFファイルをアップロード:</label>
            <input type="file" id="pdfFile" accept=".pdf" onchange="handlePDFUpload()">
            <div id="pdfPreview" style="margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 3px; display: none;">
                <h4>📄 PDFプレビュー</h4>
                <div id="pdfContent"></div>
            </div>
            <button class="btn" onclick="processPDF()" id="processPDFBtn" style="display: none;">PDFを処理</button>
        </div>
    </div>
    
    <!-- 列選択セクション -->
    <div class="section">
        <h3>📋 列の選択</h3>
        <div class="form-group">
            <label>表示する列を選択:</label>
            <div id="columnCheckboxes" class="checkbox-group"></div>
        </div>
        <button class="btn" onclick="previewData()">プレビュー</button>
    </div>
    
    <!-- データマッピングセクション -->
    <div class="section">
        <h3>🔄 データマッピング</h3>
        <div id="mappingContainer">
            <div class="mapping-row">
                <input type="text" placeholder="元の列名" class="source-column">
                <span>→</span>
                <input type="text" placeholder="新しい列名" class="target-column">
                <button class="btn add-mapping" onclick="addMapping()">追加</button>
            </div>
        </div>
    </div>
    
    <!-- フィルタセクション -->
    <div class="section">
        <h3>🔍 フィルタ設定</h3>
        <div class="form-group">
            <label>アレルギー含有メニューのみ:</label>
            <div class="checkbox-group">
                <div class="checkbox-item">
                    <input type="checkbox" id="filterMilk" value="milk">
                    <label for="filterMilk">牛乳</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="filterEgg" value="egg">
                    <label for="filterEgg">卵</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="filterWheat" value="wheat">
                    <label for="filterWheat">小麦</label>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label>メニュー名に含まれるキーワード:</label>
            <input type="text" id="menuKeywords" placeholder="カフェ,ラテ,ヨーデル">
        </div>
    </div>
    
    <!-- 変換実行 -->
    <div class="section">
        <h3>⚡ 変換実行</h3>
        <button class="btn btn-success" onclick="convertData()">データを変換</button>
        <button class="btn" onclick="exportCSV()">CSVエクスポート</button>
    </div>
    
    <!-- 結果表示 -->
    <div id="result" class="result" style="display: none;">
        <h3>📊 変換結果</h3>
        <div id="resultContent"></div>
    </div>

    <script>
        let currentData = [];
        let columnMapping = {};
        let pdfData = '';
        
        // 入力タイプを切り替え
        function toggleInputType() {
            const inputType = document.getElementById('inputType').value;
            const csvInput = document.getElementById('csvInput');
            const pdfInput = document.getElementById('pdfInput');
            
            if (inputType === 'csv') {
                csvInput.style.display = 'block';
                pdfInput.style.display = 'none';
            } else {
                csvInput.style.display = 'none';
                pdfInput.style.display = 'block';
            }
        }
        
        // PDFファイルをアップロード
        function handlePDFUpload() {
            const file = document.getElementById('pdfFile').files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                pdfData = e.target.result;
                
                // PDFプレビューを表示
                document.getElementById('pdfPreview').style.display = 'block';
                document.getElementById('pdfContent').innerHTML = `
                    <p><strong>ファイル名:</strong> ${file.name}</p>
                    <p><strong>ファイルサイズ:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                    <p><strong>ステータス:</strong> アップロード完了</p>
                `;
                document.getElementById('processPDFBtn').style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        }
        
        // PDFを処理
        function processPDF() {
            if (!pdfData) {
                alert('PDFファイルを選択してください');
                return;
            }
            
            fetch('/csv-converter', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'process_pdf',
                    pdf_data: pdfData
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('エラー: ' + data.error);
                    return;
                }
                
                // 抽出されたテキストを表示
                document.getElementById('pdfContent').innerHTML += `
                    <h5>📝 抽出されたテキスト:</h5>
                    <pre style="background-color: white; padding: 10px; border-radius: 3px; max-height: 200px; overflow-y: auto;">${data.extracted_text}</pre>
                `;
                
                // アレルギー情報をCSVデータに変換
                currentData = data.allergy_data;
                
                // CSVデータエリアに表示
                document.getElementById('csvData').value = JSON.stringify(currentData, null, 2);
                
                // 列のチェックボックスを更新
                updateColumnCheckboxes();
                
                alert(`PDF処理完了: ${data.count}件のメニューを抽出しました`);
            })
            .catch(error => {
                alert('PDF処理エラー: ' + error.message);
            });
        }
        
        // サンプルデータを読み込み
        function loadSampleData() {
            const sampleData = [
                {"menu_name": "アイスカフェラテ", "milk": "direct", "egg": "none", "wheat": "none"},
                {"menu_name": "いきいき乳酸菌ヨーデル", "milk": "direct", "egg": "none", "wheat": "none"},
                {"menu_name": "コーヒー", "milk": "none", "egg": "none", "wheat": "none"},
                {"menu_name": "パン", "milk": "none", "egg": "none", "wheat": "direct"}
            ];
            
            document.getElementById('csvData').value = JSON.stringify(sampleData, null, 2);
            currentData = sampleData;
            updateColumnCheckboxes();
        }
        
        // 列のチェックボックスを更新
        function updateColumnCheckboxes() {
            if (currentData.length === 0) return;
            
            const columns = Object.keys(currentData[0]);
            const container = document.getElementById('columnCheckboxes');
            container.innerHTML = '';
            
            columns.forEach(col => {
                const div = document.createElement('div');
                div.className = 'checkbox-item';
                div.innerHTML = `
                    <input type="checkbox" id="col_${col}" value="${col}" checked>
                    <label for="col_${col}">${col}</label>
                `;
                container.appendChild(div);
            });
        }
        
        // データをプレビュー
        function previewData() {
            try {
                const csvText = document.getElementById('csvData').value;
                currentData = JSON.parse(csvText);
                
                const selectedColumns = Array.from(document.querySelectorAll('#columnCheckboxes input:checked'))
                    .map(cb => cb.value);
                
                fetch('/csv-converter', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        action: 'preview',
                        csv_data: currentData,
                        selected_columns: selectedColumns
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert('エラー: ' + data.error);
                        return;
                    }
                    
                    displayResult(data.data);
                });
            } catch (error) {
                alert('JSONの解析エラー: ' + error.message);
            }
        }
        
        // データを変換
        function convertData() {
            try {
                const csvText = document.getElementById('csvData').value;
                currentData = JSON.parse(csvText);
                
                // フィルタ設定を取得
                const filters = {};
                
                // アレルギーフィルタ
                const allergyFilters = Array.from(document.querySelectorAll('#filterMilk, #filterEgg, #filterWheat:checked'))
                    .map(cb => cb.value);
                if (allergyFilters.length > 0) {
                    filters.allergy_contains = { items: allergyFilters };
                }
                
                // メニュー名フィルタ
                const keywords = document.getElementById('menuKeywords').value.split(',').map(k => k.trim()).filter(k => k);
                if (keywords.length > 0) {
                    filters.menu_name_contains = { keywords: keywords };
                }
                
                fetch('/csv-converter', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        action: 'convert',
                        csv_data: currentData,
                        column_mapping: columnMapping,
                        filters: filters
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert('エラー: ' + data.error);
                        return;
                    }
                    
                    document.getElementById('result').style.display = 'block';
                    document.getElementById('resultContent').innerHTML = `
                        <p>変換完了: ${data.count}件のデータ</p>
                        <div style="max-height: 400px; overflow-y: auto;">
                            ${createTable(data.data)}
                        </div>
                    `;
                });
            } catch (error) {
                alert('エラー: ' + error.message);
            }
        }
        
        // マッピングを追加
        function addMapping() {
            const container = document.getElementById('mappingContainer');
            const newRow = document.createElement('div');
            newRow.className = 'mapping-row';
            newRow.innerHTML = `
                <input type="text" placeholder="元の列名" class="source-column">
                <span>→</span>
                <input type="text" placeholder="新しい列名" class="target-column">
                <button class="btn add-mapping" onclick="removeMapping(this)">削除</button>
            `;
            container.appendChild(newRow);
        }
        
        // マッピングを削除
        function removeMapping(button) {
            button.parentElement.remove();
        }
        
        // テーブルを作成
        function createTable(data) {
            if (data.length === 0) return '<p>データがありません</p>';
            
            const columns = Object.keys(data[0]);
            let html = '<table class="table"><thead><tr>';
            columns.forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            data.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    html += `<td>${row[col] || ''}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            return html;
        }
        
        // 結果を表示
        function displayResult(data) {
            document.getElementById('result').style.display = 'block';
            document.getElementById('resultContent').innerHTML = `
                <p>データ件数: ${data.length}件</p>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${createTable(data)}
                </div>
            `;
        }
        
        // CSVエクスポート
        function exportCSV() {
            const resultContent = document.getElementById('resultContent');
            const table = resultContent.querySelector('.table');
            if (!table) {
                alert('変換結果がありません');
                return;
            }
            
            let csv = '';
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                const csvRow = Array.from(cells).map(cell => `"${cell.textContent}"`).join(',');
                csv += csvRow + '\\n';
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'converted_data.csv';
            link.click();
        }
    </script>
</body>
</html>
'''

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
    
    <div style="margin: 20px 0; padding: 15px; background-color: #e7f3ff; border-radius: 5px;">
        <h3>🔧 詳細CSV変換ツール</h3>
        <p>データの詳細な変換・フィルタリング機能をご利用いただけます。</p>
        <a href="/csv-converter" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block;">CSV変換ツールを開く</a>
    </div>
    
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
        
        # productsテーブルに送信するデータを準備
        product_data = []
        for i, item in enumerate(allergy_data):
            # まず商品をproductsテーブルに挿入
            product_data.append({
                'name': item['menu_name'],
                'brand': 'OCR Import',
                'category': 'Food',
                'description': f'OCRで抽出されたメニュー: {item["source_file"]}',
                'created_at': item['extracted_at']
            })
        
        print(f"送信データ: {product_data}")
        
        # SupabaseにPOSTリクエスト
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        url = f"{SUPABASE_URL}/rest/v1/products"
        print(f"送信URL: {url}")
        
        for data in product_data:
            print(f"送信中: {data}")
            response = requests.post(url, json=data, headers=headers)
            print(f"レスポンス: {response.status_code} - {response.text}")
            
            if response.status_code not in [200, 201]:
                print(f"Supabase送信エラー: {response.status_code} - {response.text}")
                return False
        
        print(f"Supabaseに{len(product_data)}件のデータを送信しました")
        return True
        
    except Exception as e:
        print(f"Supabase送信エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/env-check')
def env_check():
    """環境変数の確認用エンドポイント"""
    return jsonify({
        'supabase_url': SUPABASE_URL,
        'supabase_key': SUPABASE_KEY[:20] + '...' if SUPABASE_KEY else None,
        'supabase_url_set': bool(SUPABASE_URL),
        'supabase_key_set': bool(SUPABASE_KEY),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/csv-converter', methods=['GET', 'POST'])
def csv_converter():
    """詳細なCSV変換機能（PDF対応）"""
    if request.method == 'GET':
        return render_template_string(CSV_CONVERTER_TEMPLATE)
    
    try:
        data = request.json
        action = data.get('action')
        
        if action == 'preview':
            # CSVプレビュー機能
            csv_data = data.get('csv_data', [])
            selected_columns = data.get('selected_columns', [])
            
            if not csv_data:
                return jsonify({'error': 'CSVデータがありません'})
            
            # 選択された列のみを抽出
            if selected_columns:
                filtered_data = []
                for row in csv_data:
                    filtered_row = {col: row.get(col, '') for col in selected_columns}
                    filtered_data.append(filtered_row)
                return jsonify({'data': filtered_data})
            
            return jsonify({'data': csv_data})
        
        elif action == 'convert':
            # CSV変換機能
            csv_data = data.get('csv_data', [])
            column_mapping = data.get('column_mapping', {})
            filters = data.get('filters', {})
            
            # データ変換処理
            converted_data = []
            for row in csv_data:
                # カスタムマッピング適用
                mapped_row = {}
                for source_col, target_col in column_mapping.items():
                    if source_col in row:
                        mapped_row[target_col] = row[source_col]
                
                # フィルタ適用
                if apply_filters(mapped_row, filters):
                    converted_data.append(mapped_row)
            
            return jsonify({
                'success': True,
                'data': converted_data,
                'count': len(converted_data)
            })
        
        elif action == 'process_pdf':
            # PDF処理機能
            pdf_data = data.get('pdf_data', '')
            if not pdf_data:
                return jsonify({'error': 'PDFデータがありません'})
            
            # PDFからテキスト抽出（サンプル版）
            extracted_text = extract_text_from_pdf_content(pdf_data)
            
            # テキストからアレルギー情報を解析
            allergy_data = parse_allergy_info(extracted_text, 'uploaded_pdf')
            
            return jsonify({
                'success': True,
                'extracted_text': extracted_text,
                'allergy_data': allergy_data,
                'count': len(allergy_data)
            })
        
        return jsonify({'error': '不明なアクション'})
        
    except Exception as e:
        return jsonify({'error': f'エラー: {str(e)}'})

def extract_text_from_pdf_content(pdf_content):
    """PDFコンテンツからテキストを抽出"""
    try:
        # サンプルPDFテキスト（実際の実装ではPyPDF2やpdfplumberを使用）
        sample_text = """
        メニュー一覧
        
        アイスカフェラテ
        牛乳含有
        卵なし
        小麦なし
        
        いきいき乳酸菌ヨーデル
        牛乳含有
        卵なし
        小麦なし
        
        コーヒー
        牛乳なし
        卵なし
        小麦なし
        
        パン
        牛乳なし
        卵なし
        小麦含有
        """
        return sample_text.strip()
    except Exception as e:
        print(f"PDF処理エラー: {str(e)}")
        return ""

def apply_filters(row, filters):
    """フィルタを適用"""
    try:
        for filter_type, filter_config in filters.items():
            if filter_type == 'allergy_contains':
                allergy_items = filter_config.get('items', [])
                for item in allergy_items:
                    if item in str(row.get('allergy_info', '')).lower():
                        return True
                return False
            
            elif filter_type == 'menu_name_contains':
                keywords = filter_config.get('keywords', [])
                menu_name = str(row.get('menu_name', '')).lower()
                for keyword in keywords:
                    if keyword.lower() in menu_name:
                        return True
                return False
        
        return True
    except:
        return True

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
