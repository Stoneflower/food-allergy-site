import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiCheckCircle, FiArrowLeft, FiFileText, FiUpload } from 'react-icons/fi';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

const CsvExporter = ({ data, onBack }) => {
  const [downloadStatus, setDownloadStatus] = useState('ready');
  const [uploadStatus, setUploadStatus] = useState('ready');
  const [fileName, setFileName] = useState('converted_allergy_data.csv');
  const [selectedPrefectures, setSelectedPrefectures] = useState(['兵庫県']);
  const [detailedAddresses, setDetailedAddresses] = useState({});
  const [defaultSourceUrl, setDefaultSourceUrl] = useState('https://example.com');
  const [defaultStoreListUrl, setDefaultStoreListUrl] = useState('https://example.com/stores');
  const [productName, setProductName] = useState('びっくりドンキー');
  const [productBrand, setProductBrand] = useState('ハンバーグレストラン');
  const [productCategory, setProductCategory] = useState('レストラン');

  // 47都道府県リスト
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  // プレフィックス重複を正す
  const normalizeAddress = (prefecture, detailed) => {
    const base = (detailed || '').trim();
    if (!base) return prefecture;
    let normalized = base;
    // 先頭に同じ県名が二重以上付いている場合は一つに圧縮
    while (normalized.startsWith(prefecture + prefecture)) {
      normalized = normalized.slice(prefecture.length);
    }
    if (normalized.startsWith(prefecture)) {
      return normalized;
    }
    return `${prefecture}${normalized}`;
  };

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

  // 見出し/説明のみの行を除外する判定
  const isHeadingLike = (text) => {
    if (!text) return true;
    const t = String(text).trim();
    if (t === '') return true;
    // 【見出し】や（見出し）、記号のみ
    if (/^[【（(].*[】）)]$/.test(t)) return true;
    if (/^[★☆※◇◆□■-]+$/.test(t)) return true;
    return false;
  };

  // 括弧を外して中身だけ取り出す（全角・半角）
  const stripBrackets = (text) => {
    if (!text) return '';
    let t = String(text).trim();
    // 先頭と末尾が対応する括弧で囲まれている場合は外す（繰り返し）
    // 全角カッコ・角括弧・丸括弧
    const patterns = [
      [/^【([^】]+)】$/, '$1'],
      [/^\[([^\]]+)\]$/, '$1'],
      [/^（([^）]+)）$/, '$1'],
      [/^\(([^)]+)\)$/,'$1']
    ];
    let changed = true;
    while (changed) {
      changed = false;
      for (const [re, rep] of patterns) {
        if (re.test(t)) {
          t = t.replace(re, rep).trim();
          changed = true;
        }
      }
    }
    return t;
  };

  // original配列からメニュー名を抽出
  const extractMenuName = (originalRow) => {
    const cells = Array.isArray(originalRow) ? originalRow : [originalRow];
    const parts = [];
    cells.forEach((cell) => {
      if (!cell) return;
      String(cell)
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(s => parts.push(s));
    });
    // 見出し行（【…】など）は除外し、残りをスペースで結合して1行名へ
    const body = parts
      .filter(p => !isHeadingLike(p))
      .map(stripBrackets)
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    if (body.length === 0) return '';
    return body.join(' ');
  };

  // 都道府県選択のヘルパー関数
  const handlePrefectureToggle = (prefecture) => {
    setSelectedPrefectures(prev => {
      const isSelected = prev.includes(prefecture);
      const next = isSelected ? prev.filter(p => p !== prefecture) : [...prev, prefecture];
      // 自動入力: 選択時に詳細住所へ都道府県名を仮入力、解除時は削除
      setDetailedAddresses(current => {
        const copy = { ...current };
        if (!isSelected) {
          // 追加時: まだユーザー入力が無ければ県名を初期値として入れる
          if (!copy[prefecture] || copy[prefecture].trim() === '') {
            copy[prefecture] = prefecture;
          }
        } else {
          // 解除時: 入力値をクリア
          delete copy[prefecture];
        }
        return copy;
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPrefectures([...prefectures]);
    // 詳細住所へ都道府県名を一括初期入力（未入力のみ）
    setDetailedAddresses(prev => {
      const next = { ...prev };
      prefectures.forEach(p => {
        if (!next[p] || next[p].trim() === '') {
          next[p] = p;
        }
      });
      return next;
    });
  };

  const handleSelectNone = () => {
    setSelectedPrefectures([]);
    // 詳細住所のクリア
    setDetailedAddresses({});
  };

  const handleDetailedAddressChange = (prefecture, address) => {
    setDetailedAddresses(prev => ({
      ...prev,
      [prefecture]: address
    }));
  };

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

    // 選択された都道府県ごとにデータ行を作成
    const allRows = [];
    
    selectedPrefectures.forEach(prefecture => {
      const detailedAddress = detailedAddresses[prefecture] || '';
      const fullAddress = normalizeAddress(prefecture, detailedAddress);
      
      data.forEach(row => {
        const csvRow = [];
        
        // 元データから基本情報を抽出
        const original = row.original || [];
        const menuName = extractMenuName(original);
        if (!menuName) {
          return; // 見出し・空行はスキップ
        }
        csvRow.push(productName); // raw_product_name (products.name)
        csvRow.push(productCategory); // raw_category (products.category)
        csvRow.push(defaultSourceUrl); // raw_source_url
        csvRow.push(productBrand); // raw_branch_name (products.brand)
        csvRow.push(fullAddress); // raw_address (都道府県 + 詳細住所)
        csvRow.push(''); // raw_phone
        csvRow.push(''); // raw_hours
        csvRow.push(''); // raw_closed
        csvRow.push(defaultStoreListUrl); // raw_store_list_url
        csvRow.push(''); // raw_notes
        csvRow.push(menuName); // raw_menu_name
        
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

        allRows.push(csvRow);
      });
    });

    return [headers, ...allRows];
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
    console.log('=== Supabaseアップロード開始 ===');
    console.log('データ:', data);
    console.log('データ長:', data?.length);
    console.log('選択都道府県:', selectedPrefectures);
    console.log('詳細住所:', detailedAddresses);
    
    if (!data || data.length === 0) {
      console.error('❌ データがありません');
      setUploadStatus('error');
      return;
    }
    
    console.log('✅ データ検証完了、アップロード開始');
    setUploadStatus('uploading');
    
    try {
      // 1. import_jobsテーブルにジョブを作成
      const jobId = crypto.randomUUID();
      console.log('🔄 ジョブ作成開始:', jobId);
      
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert([{
          id: jobId,
          status: 'running'
        }])
        .select()
        .single();
      
      if (jobError) {
        console.error('❌ ジョブ作成エラー:', jobError);
        console.error('エラー詳細:', JSON.stringify(jobError, null, 2));
        setUploadStatus('error');
        return;
      }
      
      console.log('✅ ジョブ作成完了:', jobData);
      
      // 2. staging_importsテーブルにデータを挿入
      console.log('🔄 CSVデータ生成開始');
      const csvData = generateCsvData();
      console.log('✅ CSVデータ生成完了:', csvData.length, '行');
      
      const rows = csvData.slice(1); // ヘッダー行を除外
      console.log('📊 データ行数:', rows.length);
      
      const stagingData = rows.map((row, index) => {
        const stagingRow = {
          import_batch_id: jobId,
          row_no: index + 1,
          raw_product_name: productName, // products.name
          raw_category: productCategory, // products.category
          raw_source_url: row[2] || defaultSourceUrl,
          raw_branch_name: productBrand, // products.brand
          raw_address: row[4] || '', // 都道府県 + 詳細住所
          raw_phone: row[5] || '',
          raw_hours: row[6] || '',
          raw_closed: row[7] || '',
          raw_store_list_url: row[8] || defaultStoreListUrl,
          raw_notes: row[9] || '',
          raw_menu_name: row[10] || row[0] || ''
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
      console.log('🔄 バッチ処理開始:', jobId);
      const { data: processData, error: processError } = await supabase
        .rpc('process_import_batch', { p_batch_id: jobId });
      
      if (processError) {
        console.error('❌ バッチ処理エラー:', processError);
        console.error('エラー詳細:', JSON.stringify(processError, null, 2));
        setUploadStatus('error');
        return;
      }
      
      console.log('✅ バッチ処理完了:', processData);
      console.log('📊 処理結果:', JSON.stringify(processData, null, 2));
      
      // 4. store_locationsデータを手動で作成（バッチ処理が失敗した場合のフォールバック）
      console.log('🔄 store_locationsデータ作成開始');
      try {
        // 商品IDを動的に取得
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('name', productName)
          .single();
        
        if (productError || !productData) {
          console.error('❌ 商品ID取得エラー:', productError);
          console.error('商品名:', productName);
          return;
        }
        
        const productId = productData.id;
        console.log('📦 商品ID:', productId);
        
        // 選択された都道府県から住所を生成
        const addresses = selectedPrefectures.map(prefecture => {
          const detailedAddress = detailedAddresses[prefecture] || '';
          return normalizeAddress(prefecture, detailedAddress);
        });
        
        console.log('📍 生成された住所:', addresses);
        
        // 既存店舗を取得して差分を取り、存在しない住所は削除（上書き運用）
        const { data: existingStores, error: fetchExistingError } = await supabase
          .from('store_locations')
          .select('address')
          .eq('product_id', productId);

        if (fetchExistingError) {
          console.error('❌ 既存店舗取得エラー:', fetchExistingError);
        } else {
          const existingAddresses = new Set((existingStores || []).map(r => r.address));
          const newAddressSet = new Set(addresses);
          const toDelete = [...existingAddresses].filter(a => !newAddressSet.has(a));
          console.log('🧹 削除対象住所:', toDelete);
          if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
              .from('store_locations')
              .delete()
              .eq('product_id', productId)
              .in('address', toDelete);
            if (deleteError) {
              console.error('❌ 店舗削除エラー:', deleteError);
            } else {
              console.log('🧹 既存店舗を削除完了:', toDelete.length, '件');
            }
          }
        }

        // 挿入・更新を一括upsert（URL等の更新も反映）
        const upsertPayload = addresses.map(address => ({
          product_id: productId,
          branch_name: null,
          address,
          source_url: defaultSourceUrl,
          store_list_url: defaultStoreListUrl
        }));

        const { data: upsertData, error: upsertError } = await supabase
          .from('store_locations')
          .upsert(upsertPayload, { onConflict: 'product_id,address' })
          .select();

        if (upsertError) {
          console.error('❌ store_locations一括upsertエラー:', upsertError);
          console.error('エラー詳細:', JSON.stringify(upsertError, null, 2));
        } else {
          console.log('✅ store_locations一括upsert完了:', upsertData?.length || 0, '件');
        }
        
        // 挿入結果を確認
        const { data: verifyData, error: verifyError } = await supabase
          .from('store_locations')
          .select('*')
          .eq('product_id', productId);
        
        if (verifyError) {
          console.error('❌ store_locations確認エラー:', verifyError);
        } else {
          console.log('✅ store_locations確認完了:', verifyData.length, '件');
        }
        
      } catch (fallbackError) {
        console.error('❌ store_locations作成フォールバックエラー:', fallbackError);
        console.error('エラー詳細:', JSON.stringify(fallbackError, null, 2));
      }

      // 5. menu_items 不足分フォールバック（staging_imports からユニーク名を補完）
      try {
        // product_id を再取得（上のブロック変数に依存しない）
        const { data: prodRow, error: prodErr } = await supabase
          .from('products')
          .select('id')
          .eq('name', productName)
          .single();
        if (prodErr || !prodRow) {
          console.error('❌ menu_items補完用 product取得エラー:', prodErr);
          throw prodErr || new Error('product not found');
        }
        const pid = prodRow.id;

        // 対象商品の既存メニュー名を取得
        const { data: existingMenus, error: existingMenusError } = await supabase
          .from('menu_items')
          .select('name')
          .eq('product_id', pid);
        if (existingMenusError) {
          console.error('❌ 既存menu_items取得エラー:', existingMenusError);
        }

        // 今回バッチのstaging_importsからユニーク名を収集
        const { data: stagingNames, error: stagingNamesError } = await supabase
          .from('staging_imports')
          .select('raw_menu_name')
          .eq('import_batch_id', jobId);
        if (stagingNamesError) {
          console.error('❌ staging_imports取得エラー:', stagingNamesError);
        } else {
          const uniqueNames = Array.from(new Set((stagingNames || [])
            .map(r => (r.raw_menu_name || '').trim())
            .filter(n => n !== '')));
          const existingSet = new Set((existingMenus || []).map(m => m.name));
          const toInsert = uniqueNames.filter(n => !existingSet.has(n));
          console.log(`🧩 menu_items不足検知: 既存=${existingSet.size}件, 今回ユニーク=${uniqueNames.length}件, 追加予定=${toInsert.length}件`);
          if (toInsert.length > 0) {
            const payload = toInsert.map(n => ({ product_id: pid, name: n, active: false }));
            const { error: insertMenusError } = await supabase
              .from('menu_items')
              .upsert(payload, { onConflict: 'product_id,name' });
            if (insertMenusError) {
              console.error('❌ menu_items upsertエラー:', insertMenusError);
            } else {
              console.log('✅ menu_items upsert完了:', payload.length, '件');
            }
          }
        }
      } catch (menuFallbackError) {
        console.error('❌ menu_itemsフォールバック処理エラー:', menuFallbackError);
      }
      setUploadStatus('completed');
      
      // 成功メッセージを表示してからアプリケーションのデータを再読み込み
      setTimeout(() => {
        alert('✅ アップロードが正常に完了しました！\n\nデータがSupabaseに正常に登録されました。\nアプリケーションで確認できます。');
        window.location.reload();
      }, 3000);
      
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品名 (products.name)
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="びっくりドンキー"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ブランド (products.brand)
            </label>
            <input
              type="text"
              value={productBrand}
              onChange={(e) => setProductBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="ハンバーグレストラン"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ (products.category)
            </label>
            <select
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="レストラン">レストラン</option>
              <option value="テイクアウト">テイクアウト</option>
              <option value="スーパー">スーパー</option>
              <option value="ネットショップ">ネットショップ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              都道府県選択 ({selectedPrefectures.length}/47)
            </label>
            
            {/* 一括選択ボタン */}
            <div className="flex space-x-2 mb-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                全選択
              </button>
              <button
                type="button"
                onClick={handleSelectNone}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                全解除
              </button>
            </div>

            {/* 都道府県チェックボックス */}
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {prefectures.map(prefecture => (
                <label key={prefecture} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPrefectures.includes(prefecture)}
                    onChange={() => handlePrefectureToggle(prefecture)}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-gray-700">{prefecture}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 選択された都道府県の詳細住所入力 */}
          {selectedPrefectures.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                詳細住所（任意）
              </label>
              <div className="space-y-2">
                {selectedPrefectures.map(prefecture => (
                  <div key={prefecture} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-20 flex-shrink-0">{prefecture}:</span>
                    <input
                      type="text"
                      value={detailedAddresses[prefecture] || ''}
                      onChange={(e) => handleDetailedAddressChange(prefecture, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="例: 神戸市中央区三宮町1-1-1"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                各都道府県に続けて詳細住所を入力できます（例: 兵庫県神戸市中央区三宮町1-1-1）
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              情報元URL
            </label>
            <input
              type="text"
              value={defaultSourceUrl}
              onChange={(e) => setDefaultSourceUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              店舗一覧URL
            </label>
            <input
              type="text"
              value={defaultStoreListUrl}
              onChange={(e) => setDefaultStoreListUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="https://example.com/stores"
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
             <div className="text-sm mt-2">
               <p className="font-semibold text-green-800">
                 ✅ アップロードが正常に完了しました！
               </p>
               <p className="mt-1">
                 データがSupabaseに正常に登録されました。アプリケーションで確認できます。
               </p>
               <p className="mt-1 text-xs text-gray-600">
                 3秒後にアプリケーションが再読み込みされます...
               </p>
             </div>
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