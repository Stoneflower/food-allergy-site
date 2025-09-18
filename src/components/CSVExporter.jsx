import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiCheckCircle, FiArrowLeft, FiFileText, FiUpload } from 'react-icons/fi';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

const CsvExporter = ({ data, onBack }) => {
  const [downloadStatus, setDownloadStatus] = useState('ready');
  const [uploadStatus, setUploadStatus] = useState('ready');
  const [fileName, setFileName] = useState('converted_allergy_data.csv');

  // 標準アレルギー項目
  const standardAllergens = [
    { slug: 'egg', name: '卵' },
    { slug: 'milk', name: '乳' },
    { slug: 'wheat', name: '小麦' },
    { slug: 'buckwheat', name: 'そば' },
    { slug: 'peanut', name: '落花生' },
    { slug: 'shrimp', name: 'えび' },
    { slug: 'crab', name: 'かに' },
    { slug: 'walnut', name: 'くるみ' },
    { slug: 'soy', name: '大豆' },
    { slug: 'beef', name: '牛肉' },
    { slug: 'pork', name: '豚肉' },
    { slug: 'chicken', name: '鶏肉' },
    { slug: 'salmon', name: 'さけ' },
    { slug: 'mackerel', name: 'さば' },
    { slug: 'abalone', name: 'あわび' },
    { slug: 'squid', name: 'いか' },
    { slug: 'salmon_roe', name: 'いくら' },
    { slug: 'orange', name: 'オレンジ' },
    { slug: 'kiwi', name: 'キウイフルーツ' },
    { slug: 'peach', name: 'もも' },
    { slug: 'apple', name: 'りんご' },
    { slug: 'yam', name: 'やまいも' },
    { slug: 'gelatin', name: 'ゼラチン' },
    { slug: 'banana', name: 'バナナ' },
    { slug: 'cashew', name: 'カシューナッツ' },
    { slug: 'sesame', name: 'ごま' },
    { slug: 'almond', name: 'アーモンド' },
    { slug: 'matsutake', name: 'まつたけ' }
  ];

  const generateCsvData = () => {
    if (!data || data.length === 0) return [];

    // Supabase用のヘッダー行を作成
    const headers = [
      'raw_product_name',
      'raw_category', 
      'raw_source_url',
      'raw_branch_name',
      'raw_address',
      'raw_phone',
      'raw_hours',
      'raw_closed',
      'raw_store_list_url',
      'raw_notes',
      'raw_menu_name',
      ...standardAllergens.map(a => a.slug)
    ];

    // データ行を作成
    const rows = data.map(row => {
      const csvRow = [];
      
      // 元データから基本情報を抽出
      const original = row.original || [];
      csvRow.push(original[0] || ''); // raw_product_name
      csvRow.push(original[2] || ''); // raw_category
      csvRow.push(original[7] || ''); // raw_source_url
      csvRow.push(original[1] || ''); // raw_branch_name
      csvRow.push(original[3] || ''); // raw_address
      csvRow.push(original[4] || ''); // raw_phone
      csvRow.push(original[5] || ''); // raw_hours
      csvRow.push(original[6] || ''); // raw_closed
      csvRow.push(original[8] || ''); // raw_store_list_url
      csvRow.push(''); // raw_notes
      csvRow.push(original[9] || ''); // raw_menu_name
      
      // アレルギー情報を追加（日本語ラベルを英語に変換）
      standardAllergens.forEach(allergen => {
        const value = row.converted[allergen.slug] || '';
        let englishValue = '';
        switch (value) {
          case 'ふくむ': englishValue = 'direct'; break;
          case 'ふくまない': englishValue = 'none'; break;
          case 'コンタミ': englishValue = 'trace'; break;
          case '未使用': englishValue = 'unused'; break;
          default: englishValue = value;
        }
        csvRow.push(englishValue);
      });

      return csvRow;
    });

    return [headers, ...rows];
  };

  const handleDownload = () => {
    console.log('ダウンロード開始:', { data: data, dataLength: data?.length });
    
    if (!data || data.length === 0) {
      console.error('データがありません');
      setDownloadStatus('error');
      return;
    }
    
    setDownloadStatus('downloading');
    
    try {
      const csvData = generateCsvData();
      console.log('CSVデータ生成完了:', csvData);
      
      if (!csvData || csvData.length === 0) {
        console.error('CSVデータが生成されませんでした');
        setDownloadStatus('error');
        return;
      }
      
      const csv = Papa.unparse(csvData);
      console.log('CSV文字列生成完了:', csv.substring(0, 200) + '...');
      
      // ファイル名にタイムスタンプを追加
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const finalFileName = fileName.replace('.csv', `_${timestamp}.csv`);
      
      // ダウンロード
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', finalFileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('ダウンロード完了');
      setDownloadStatus('completed');
    } catch (error) {
      console.error('CSV export error:', error);
      setDownloadStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (downloadStatus) {
      case 'downloading':
        return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>;
      case 'completed':
        return <FiCheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">!</div>;
      default:
        return <FiDownload className="w-6 h-6 text-orange-500" />;
    }
  };

  const getStatusText = () => {
    switch (downloadStatus) {
      case 'downloading':
        return 'ダウンロード中...';
      case 'completed':
        return 'ダウンロード完了';
      case 'error':
        return 'エラーが発生しました';
      default:
        return 'CSVファイルをダウンロード';
    }
  };

  const getStatusColor = () => {
    switch (downloadStatus) {
      case 'downloading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-orange-50 border-orange-200 text-orange-800';
    }
  };

  const handleUpload = async () => {
    console.log('Supabaseアップロード開始:', { data: data, dataLength: data?.length });
    
    if (!data || data.length === 0) {
      console.error('データがありません');
      setUploadStatus('error');
      return;
    }
    
    setUploadStatus('uploading');
    
    try {
      // 1. import_jobsテーブルにジョブを作成
      const jobId = crypto.randomUUID();
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert([{
          id: jobId,
          status: 'queued'
        }])
        .select()
        .single();
      
      if (jobError) {
        console.error('ジョブ作成エラー:', jobError);
        setUploadStatus('error');
        return;
      }
      
      console.log('ジョブ作成完了:', jobData);
      
      // 2. staging_importsテーブルにデータを挿入
      const csvData = generateCsvData();
      const rows = csvData.slice(1); // ヘッダー行を除外
      
      const stagingData = rows.map(row => {
        const stagingRow = {
          job_id: jobId,
          raw_product_name: row[0] || '',
          raw_category: row[1] || '',
          raw_source_url: row[2] || '',
          raw_branch_name: row[3] || '',
          raw_address: row[4] || '',
          raw_phone: row[5] || '',
          raw_hours: row[6] || '',
          raw_closed: row[7] || '',
          raw_store_list_url: row[8] || '',
          raw_notes: row[9] || '',
          raw_menu_name: row[10] || ''
        };
        
        // アレルギー情報を追加
        standardAllergens.forEach((allergen, index) => {
          const value = row[11 + index] || '';
          stagingRow[allergen.slug] = value;
        });
        
        return stagingRow;
      });
      
      console.log('ステージングデータ準備完了:', stagingData.length, '行');
      
      // バッチで挿入（100行ずつ）
      const batchSize = 100;
      for (let i = 0; i < stagingData.length; i += batchSize) {
        const batch = stagingData.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('staging_imports')
          .insert(batch);
        
        if (insertError) {
          console.error('ステージングデータ挿入エラー:', insertError);
          setUploadStatus('error');
          return;
        }
        
        console.log(`バッチ ${i + 1}-${Math.min(i + batchSize, stagingData.length)} 挿入完了`);
      }
      
      // 3. バッチ処理を実行
      const { data: processData, error: processError } = await supabase
        .rpc('process_import_batch', { batch_id: jobId });
      
      if (processError) {
        console.error('バッチ処理エラー:', processError);
        setUploadStatus('error');
        return;
      }
      
      console.log('バッチ処理完了:', processData);
      setUploadStatus('completed');
      
    } catch (error) {
      console.error('アップロードエラー:', error);
      setUploadStatus('error');
    }
  };

  const getUploadStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>;
      case 'completed':
        return <FiCheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">!</div>;
      default:
        return <FiUpload className="w-6 h-6 text-blue-500" />;
    }
  };

  const getUploadStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'アップロード中...';
      case 'completed':
        return 'アップロード完了';
      case 'error':
        return 'エラーが発生しました';
      default:
        return 'Supabaseに直接アップロード';
    }
  };

  const getUploadStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          データアップロード
        </h2>
        <p className="text-gray-600">
          変換されたデータをSupabaseに直接アップロードできます
        </p>
      </div>

      {/* 出力情報 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FiFileText className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              出力ファイル情報
            </h3>
            <p className="text-sm text-gray-600">
              {data?.length || 0} 行のデータが変換されました
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ファイル名
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              出力フォーマット
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>direct:</strong> アレルギー成分を含有</p>
              <p>• <strong>trace:</strong> コンタミネーション（混入の可能性）</p>
              <p>• <strong>none:</strong> アレルギー成分を使用しない</p>
              <p>• <strong>unused:</strong> 未使用（記号なし）</p>
            </div>
          </div>
        </div>
      </div>

      {/* メインアクション: アップロードボタン */}
      <div className="text-center">
        <motion.button
          onClick={handleUpload}
          disabled={uploadStatus === 'uploading'}
          className={`inline-flex items-center space-x-3 px-10 py-5 rounded-lg font-medium text-lg transition-colors ${
            uploadStatus === 'uploading'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
          }`}
          whileHover={uploadStatus !== 'uploading' ? { scale: 1.05 } : {}}
          whileTap={uploadStatus !== 'uploading' ? { scale: 0.95 } : {}}
        >
          {getUploadStatusIcon()}
          <span>{getUploadStatusText()}</span>
        </motion.button>
      </div>

      {/* サブアクション: ダウンロードボタン */}
      <div className="text-center">
        <motion.button
          onClick={handleDownload}
          disabled={downloadStatus === 'downloading'}
          className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            downloadStatus === 'downloading'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
          whileHover={downloadStatus !== 'downloading' ? { scale: 1.05 } : {}}
          whileTap={downloadStatus !== 'downloading' ? { scale: 0.95 } : {}}
        >
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </motion.button>
      </div>

      {/* アップロードステータス表示（メイン） */}
      {uploadStatus !== 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-lg p-4 ${getUploadStatusColor()}`}
        >
          <div className="flex items-center space-x-2">
            {getUploadStatusIcon()}
            <span className="font-medium">{getUploadStatusText()}</span>
          </div>
          {uploadStatus === 'completed' && (
            <p className="text-sm mt-2">
              データが正常にSupabaseにアップロードされました。アプリケーションで確認できます。
            </p>
          )}
          {uploadStatus === 'error' && (
            <p className="text-sm mt-2">
              アップロード中にエラーが発生しました。コンソールログを確認してください。
            </p>
          )}
        </motion.div>
      )}

      {/* ダウンロードステータス表示（サブ） */}
      {downloadStatus !== 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-lg p-4 ${getStatusColor()}`}
        >
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          {downloadStatus === 'completed' && (
            <p className="text-sm mt-2">
              ファイルが正常にダウンロードされました。バックアップとして保存できます。
            </p>
          )}
          {downloadStatus === 'error' && (
            <p className="text-sm mt-2">
              ダウンロード中にエラーが発生しました。ブラウザを再読み込みして再試行してください。
            </p>
          )}
        </motion.div>
      )}

      {/* アクションボタン */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>戻る</span>
        </button>

        {downloadStatus === 'completed' && (
          <div className="text-sm text-gray-600">
            <p>✅ 変換完了！</p>
            <p>ダウンロードしたCSVファイルをSupabaseにインポートできます</p>
          </div>
        )}
      </div>

      {/* 使用方法 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          🚀 推奨フロー
        </h3>
        <div className="space-y-2 text-sm text-green-800">
          <p>1. <strong>「Supabaseに直接アップロード」</strong>をクリック（推奨）</p>
          <p>2. アップロード完了後、アプリケーションでデータを確認</p>
          <p>3. 必要に応じて「CSVファイルをダウンロード」でバックアップ保存</p>
          <p>4. データが正しく登録されているか検索機能で確認</p>
        </div>
      </div>
    </div>
  );
};

export default CsvExporter;