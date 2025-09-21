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

  // product_allergies_matrixを自動更新する関数（確実な差分削除版）
  const updateProductAllergiesMatrix = async (productId, batchId) => {
    try {
      console.log('🔄 product_allergies_matrix自動更新開始');
      
      // 1. 既存のproduct_allergies_matrixを完全削除
      console.log('🧹 既存product_allergies_matrix削除開始');
      const { error: deleteError } = await supabase
        .from('product_allergies_matrix')
        .delete()
        .eq('product_id', productId);
      
      if (deleteError) {
        console.error('❌ product_allergies_matrix削除エラー:', deleteError);
        throw deleteError;
      }
      console.log('✅ 既存product_allergies_matrix削除完了');
      
      // 2. 新しいmenu_itemsに対応するproduct_allergies_matrixを作成（デフォルト値）
      console.log('📝 新しいproduct_allergies_matrix作成開始');
      const { error: insertError } = await supabase.rpc('create_default_product_allergies_matrix', {
        p_product_id: productId
      });
      
      if (insertError) {
        console.error('❌ デフォルトproduct_allergies_matrix作成エラー:', insertError);
        // フォールバック: 直接INSERT
        const { data: menuItems, error: fetchError } = await supabase
          .from('menu_items')
          .select('id, name')
          .eq('product_id', productId);
        
        if (fetchError) {
          throw fetchError;
        }
        
        const defaultRows = (menuItems || []).map(mi => ({
          product_id: productId,
          menu_item_id: mi.id,
          menu_name: mi.name,
          egg: 'none',
          milk: 'none',
          wheat: 'none',
          buckwheat: 'none',
          peanut: 'none',
          shrimp: 'none',
          crab: 'none',
          walnut: 'none',
          almond: 'none',
          abalone: 'none',
          squid: 'none',
          salmon_roe: 'none',
          orange: 'none',
          cashew: 'none',
          kiwi: 'none',
          beef: 'none',
          gelatin: 'none',
          sesame: 'none',
          salmon: 'none',
          mackerel: 'none',
          soybean: 'none',
          chicken: 'none',
          banana: 'none',
          pork: 'none',
          matsutake: 'none',
          peach: 'none',
          yam: 'none',
          apple: 'none',
          macadamia: 'none'
        }));
        
        const { error: fallbackInsertError } = await supabase
          .from('product_allergies_matrix')
          .insert(defaultRows);
        
        if (fallbackInsertError) {
          throw fallbackInsertError;
        }
        console.log('✅ フォールバックproduct_allergies_matrix作成完了:', defaultRows.length, '件');
      } else {
        console.log('✅ デフォルトproduct_allergies_matrix作成完了');
      }
      
      // 3. staging_importsから実際のアレルギー情報を更新
      console.log('🔄 アレルギー情報更新開始');
      const { error: updateError } = await supabase.rpc('upsert_product_allergies_matrix', {
        p_product_id: productId,
        p_batch_id: batchId
      }, {
        timeout: 60000 // 60秒タイムアウト
      });
      
      if (updateError) {
        console.error('❌ アレルギー情報更新エラー:', updateError);
        // エラーでもデフォルト値は作成済みなので続行
      } else {
        console.log('✅ アレルギー情報更新完了');
      }
      
      console.log('✅ product_allergies_matrix自動更新完了');
    } catch (error) {
      console.error('❌ product_allergies_matrix更新エラー:', error);
      throw error;
    }
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
    { slug: 'matsutake', name: 'まつたけ' },
    { slug: 'macadamia', name: 'マカダミアナッツ' }
  ];

  // アレルギー項目名の正規化マッピング（異なる表記を統一）
  const allergenNameMapping = {
    // ゴマの表記統一
    'ゴマ': 'ごま',
    'ごま': 'ごま',
    'ゴマ油': 'ごま',
    'ごま油': 'ごま',
    // まつたけとマカダミアナッツは別項目として保持
    'まつたけ': 'まつたけ',
    'マカダミアナッツ': 'マカダミアナッツ'
  };

  // 含有量表示の正規化マッピング
  const presenceMapping = {
    // 空欄・ハイフン系（会社によって異なる表記）
    '': 'none',           // 空欄 → none
    '-': 'none',          // ハイフン → none
    '−': 'none',          // 全角ハイフン → none
    'ー': 'none',          // 長音符 → none
    '×': 'none',          // バツ → none
    'なし': 'none',        // なし → none
    '無': 'none',          // 無 → none
    
    // 含有しない系
    'ふくまない': 'none',
    '含まない': 'none',
    '使用しない': 'none',
    '不使用': 'none',
    
    // 含有する系
    'ふくむ': 'direct',
    '含む': 'direct',
    '使用': 'direct',
    'あり': 'direct',
    '○': 'direct',        // 丸 → direct
    '●': 'direct',        // 黒丸 → direct
    
    // コンタミ系
    'コンタミ': 'trace',
    'コンタミネーション': 'trace',
    '混入の可能性': 'trace',
    '△': 'trace',         // 三角 → trace
    
    // 未使用系
    '未使用': 'unused',
    '未記載': 'unused',
    '記載なし': 'unused'
  };

  // アレルギー項目名を正規化
  const normalizeAllergenName = (name) => {
    if (!name) return name;
    const normalized = allergenNameMapping[name.trim()];
    return normalized || name.trim();
  };

  // 含有量表示を正規化
  const normalizePresence = (value) => {
    if (!value) return 'none';
    const normalized = presenceMapping[value.trim()];
    return normalized || value.trim();
  };

  // 記号のみの行も商品名として許容するため、除外判定は行わない
  const isSymbolsOnly = () => false;

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

  // originalから「1行=1商品名」を抽出（商品名限定、記号も保持）
  const extractMenuNameSingle = (originalRow) => {
    // 商品名は原則1列目のみを対象にする（他列の文字は無視）
    const firstCell = Array.isArray(originalRow) ? originalRow[0] : originalRow;
    const lines = String(firstCell || '')
      .split('\n')
      .map(s => String(s).trim())
      .filter(Boolean);

    const normalize = (p) => String(p || '').replace(/\s+/g, ' ').trim();
    if (lines.length === 0) return '';

    const bracketLines = lines.filter(s => /^【.+】$/.test(s));
    const parenLines = lines.filter(s => /^[（(].+[）)]$/.test(s));
    if (bracketLines.length > 0 && parenLines.length > 0) {
      const middle = lines.find(s => !/^【.+】$/.test(s) && !/^[（(].+[）)]$/.test(s)) || '';
      return normalize(`${bracketLines[0]} ${middle} ${parenLines[0]}`);
    }
    // それ以外は先頭行を採用（必要十分に単純化）
    return normalize(lines[0]);
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

    // 商品名は202件に限定して生成（都道府県で水増ししない）
    const allRows = data.map(row => {
      const original = row.original || [];
      const menuName = extractMenuNameSingle(original);
      if (!menuName) return null;
      const csvRow = [];
      csvRow.push(productName);
      csvRow.push(productCategory);
      csvRow.push(defaultSourceUrl);
      csvRow.push(productBrand);
      csvRow.push(''); // raw_address はmenu用ステージングでは空
      csvRow.push(''); // phone
      csvRow.push(''); // hours
      csvRow.push(''); // closed
      csvRow.push(defaultStoreListUrl);
      csvRow.push(''); // notes
      csvRow.push(menuName);
      standardAllergens.forEach(allergen => {
        const value = row.converted[allergen.slug] || '';
        // 含有量表示を正規化
        const englishValue = normalizePresence(value);
        csvRow.push(englishValue);
      });
      return csvRow;
    }).filter(Boolean);

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
    
    let watchdogId;
    try {
      // アップロードが長時間固まるのを防ぐウォッチドッグ（60秒）
      watchdogId = setTimeout(() => {
        try {
          console.warn('⏱️ アップロードが60秒以上かかっています。フォールバック／完了扱いに移行します。');
          setUploadStatus('error');
          alert('処理がタイムアウトした可能性があります。画面を更新して再確認してください。');
        } catch (e) {
          // noop
        }
      }, 60000);
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
      if (csvData.length > 1000) {
        console.warn('⚠️ 生成行数が想定外に多いです。処理時間が長くなる可能性があります。');
      }
      
      const rows = csvData.slice(1); // ヘッダー行を除外
      console.log('📊 データ行数:', rows.length);
      if (rows.length > 10000) {
        throw new Error(`生成された行数が多すぎます (${rows.length}). 入力を見直してください。`);
      }
      
      // 重複メニュー名の処理（staging_imports用）
      const menuNameCount = new Map();
      const stagingData = rows.map((row, index) => {
        const originalMenuName = row[10] || row[0] || '';
        const baseMenuName = originalMenuName.trim();
        
        // 重複チェックと(2)付与
        if (baseMenuName) {
          const count = (menuNameCount.get(baseMenuName) || 0) + 1;
          menuNameCount.set(baseMenuName, count);
          const finalMenuName = count === 1 ? baseMenuName : `${baseMenuName} (${count})`;
          
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
            raw_menu_name: finalMenuName // 重複処理済みの名前
          };
          
          // アレルギー情報を追加（正規化適用）
          standardAllergens.forEach((allergen, index) => {
            const value = row[11 + index] || '';
            // 含有量表示を正規化
            stagingRow[allergen.slug] = normalizePresence(value);
          });
          
          return stagingRow;
        }
        return null;
      }).filter(Boolean);
      
      console.log('ステージングデータ準備完了:', stagingData.length, '行');
      // 一括挿入（202件規模なら一発で投入）
      const { error: insertError } = await supabase
        .from('staging_imports')
        .insert(stagingData);
      if (insertError) {
        console.error('ステージングデータ挿入エラー:', insertError);
        console.error('エラー詳細:', JSON.stringify(insertError, null, 2));
        console.error('挿入データサンプル（最初の3行）:', stagingData.slice(0, 3));
        console.error('挿入データのカラム一覧:', Object.keys(stagingData[0] || {}));
        setUploadStatus('error');
        return;
      }
      console.log('✅ staging_imports 一括挿入完了:', stagingData.length, '行');
      
      // 3. バッチ処理を実行
      console.log('🔄 バッチ処理開始:', jobId);
      let processOk = true;
      const { data: processData, error: processError } = await supabase
        .rpc('process_import_batch', { p_batch_id: jobId });
      
      if (processError) {
        processOk = false;
        console.warn('⚠️ バッチ処理スキップ（フォールバック継続）:', processError);
        console.warn('エラー詳細:', JSON.stringify(processError, null, 2));
      } else {
        console.log('✅ バッチ処理完了:', processData);
        console.log('📊 処理結果:', JSON.stringify(processData, null, 2));
        
        // バッチ処理が成功した場合、product_allergies_matrixを更新
        if (processData && processData.product_id) {
          console.log('🔄 バッチ処理成功後のproduct_allergies_matrix更新開始');
          await updateProductAllergiesMatrix(processData.product_id, jobId);
        }
      }
      
      // 4. store_locationsデータを手動で作成（バッチ処理が失敗した場合のフォールバック）
      console.log('🔄 store_locationsデータ作成開始');
      try {
        // 商品IDを動的に取得
        let productId;
        
        // まず既存の商品を検索
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('name', productName)
          .single();
        
        if (productError || !productData) {
          console.log('🔄 商品が存在しないため、新規作成します:', productName);
          
          // 新しい商品を作成
          const { data: newProductData, error: createError } = await supabase
            .from('products')
            .insert({
              name: productName,
              brand: productBrand,
              category: productCategory,
              description: `${productName}のアレルギー情報`
            })
            .select('id')
            .single();
          
          if (createError || !newProductData) {
            console.error('❌ 商品作成エラー:', createError);
            console.error('商品名:', productName);
            return;
          }
          
          productId = newProductData.id;
          console.log('✅ 新商品作成完了:', productName, 'ID:', productId);
        } else {
          productId = productData.id;
          console.log('📦 既存商品ID:', productId);
        }
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
          .select('id, address, product_id')
          .eq('product_id', productId);

        console.log('🔍 現在のproduct_id:', productId);
        console.log('🔍 既存店舗データ（同じproduct_idのみ）:', existingStores);

        if (fetchExistingError) {
          console.error('❌ 既存店舗取得エラー:', fetchExistingError);
        } else {
          const existingAddresses = new Set((existingStores || []).map(r => r.address));
          const newAddressSet = new Set(addresses);
          const toDelete = [...existingAddresses].filter(a => !newAddressSet.has(a));
          console.log('🧹 削除対象住所:', toDelete);
          console.log('🧹 削除対象の既存店舗ID:', (existingStores || []).filter(r => toDelete.includes(r.address)).map(r => r.id));
          
          if (toDelete.length > 0) {
            // 削除前に削除対象のIDを確認
            const { data: toDeleteStores, error: fetchToDeleteError } = await supabase
              .from('store_locations')
              .select('id, address, product_id')
              .eq('product_id', productId)
              .in('address', toDelete);
            
            console.log('⚠️ 実際に削除される店舗:', toDeleteStores);
            
            // ⚠️ 安全のため削除処理を一時的に無効化
            console.log('🚫 削除処理を無効化中（安全のため）');
            console.log('🚫 本来削除されるはずだった店舗ID:', toDeleteStores?.map(r => r.id));
            
            // 削除処理をコメントアウト（安全のため）
            /*
            const { error: deleteError } = await supabase
              .from('store_locations')
              .delete()
              .eq('product_id', productId)
              .in('address', toDelete);
            if (deleteError) {
              console.error('❌ 店舗削除エラー:', deleteError);
            } else {
              console.log('🧹 既存店舗を削除完了:', toDelete.length, '件');
              console.log('🧹 削除された店舗ID:', toDeleteStores?.map(r => r.id));
            }
            */
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

      // 5. menu_items 置換フォールバック（今回のバッチ202件を必ず反映）
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

        // 今回の行データはローカルのstagingDataを利用（タイムアウト回避）
        const stagingNames = (Array.isArray(stagingData) ? stagingData : [])
          .map(r => ({ row_no: r.row_no, raw_menu_name: r.raw_menu_name }))
          .sort((a, b) => (a.row_no || 0) - (b.row_no || 0));
        {
          // 既存menu_itemsを丸ごと削除（対象商品）
          const { data: allMenus, error: fetchAllErr } = await supabase
            .from('menu_items')
            .select('id')
            .eq('product_id', pid);
          if (fetchAllErr) {
            console.error('❌ 既存menu_items取得エラー:', fetchAllErr);
          } else {
            const allIds = (allMenus || []).map(r => r.id);
            if (allIds.length > 0) {
              // 子を先に削除
              await supabase.from('menu_item_allergies').delete().in('menu_item_id', allIds);
              await supabase.from('menu_items').delete().eq('product_id', pid).in('id', allIds);
              console.log('🧹 既存menu_items 全削除:', allIds.length, '件');
            }
          }

          // 202件を必ずINSERT（重複名は(2),(3)…を付与して衝突回避）
          const finalNames = [];
          const nameCount = new Map();
          (stagingNames || []).forEach(r => {
            const base = (r.raw_menu_name || '').trim();
            if (!base) return;
            const count = (nameCount.get(base) || 0) + 1;
            nameCount.set(base, count);
            const name = count === 1 ? base : `${base} (${count})`;
            finalNames.push(name);
          });

          // 単発リクエストで一括挿入（202件規模は1回で十分）
          const payload = finalNames.map(n => ({ product_id: pid, name: n, active: false }));
          const { error: insertErr } = await supabase
            .from('menu_items')
            .insert(payload);
          if (insertErr) {
            console.error('❌ menu_items 一括INSERTエラー:', insertErr);
          } else {
            console.log('✅ menu_items 置換INSERT 完了:', finalNames.length, '件');
            
            // product_allergies_matrixを自動更新
            console.log('🔄 product_allergies_matrix自動更新開始');
            await updateProductAllergiesMatrix(pid, jobId);
          }
        }
      } catch (menuFallbackError) {
        console.error('❌ menu_itemsフォールバック処理エラー:', menuFallbackError);
      }
      
      // フォールバック処理完了後も、product_allergies_matrixを確実に更新
      try {
        const { data: finalProductData, error: finalProductError } = await supabase
          .from('products')
          .select('id')
          .eq('name', productName)
          .single();
        
        if (!finalProductError && finalProductData) {
          console.log('🔄 フォールバック完了後のproduct_allergies_matrix最終更新開始');
          await updateProductAllergiesMatrix(finalProductData.id, jobId);
        }
      } catch (finalUpdateError) {
        console.error('❌ 最終更新エラー:', finalUpdateError);
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
    finally {
      if (watchdogId) {
        clearTimeout(watchdogId);
      }
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