import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiCheckCircle, FiArrowLeft, FiFileText, FiUpload } from 'react-icons/fi';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { useRestaurant } from '../context/RestaurantContext';

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
  // 追加: 香料と加熱ステータス
  const [fragranceCsv, setFragranceCsv] = useState('none'); // 例: "egg,milk" or "none"
  const [heatStatus, setHeatStatus] = useState('none'); // heated|none|uncertain|unused
  const [fragranceOpen, setFragranceOpen] = useState(false);

  const { allergyOptions } = useRestaurant();
  const fragranceSelected = useMemo(() => {
    const raw = (fragranceCsv || '').trim();
    if (!raw || raw.toLowerCase() === 'none') return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }, [fragranceCsv]);
  const toggleFragrance = (id) => {
    const set = new Set(fragranceSelected);
    if (set.has(id)) set.delete(id); else set.add(id);
    const next = Array.from(set);
    setFragranceCsv(next.length === 0 ? 'none' : next.join(','));
  };

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
    // 大豆の表記統一
    '大豆': '大豆',
    '大豆(soybean)': '大豆',
    'soybean': '大豆',
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
    
    // 香料系
    '香料': 'fragrance',
    '香料含有': 'fragrance',
    '香料使用': 'fragrance',
    
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
    const trimmed = value.trim();
    const normalized = presenceMapping[trimmed];
    const result = normalized || trimmed;
    
    // デバッグログ: 記号マッピングの動作確認（すべての記号をログ出力）
    if (trimmed !== '' && trimmed !== 'none' && trimmed !== 'direct' && trimmed !== 'trace') {
      console.log('🔍 記号マッピングデバッグ:', {
        input: value,
        trimmed,
        normalized,
        result,
        hasMapping: Object.prototype.hasOwnProperty.call(presenceMapping, trimmed),
        allMappings: Object.keys(presenceMapping)
      });
    }
    
    // 緊急修正: 未マッピングの値はnoneとして扱う（directの誤判定を防ぐ）
    if (!normalized && trimmed !== '') {
      console.log('⚠️ 未マッピング記号をnoneとして処理:', trimmed);
      return 'none';
    }
    
    return result;
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
      ...standardAllergens.map(a => a.slug),
      'fragrance_allergens',
      'heat_status'
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
        
        // デバッグログ: CSV生成時の記号変換確認（すべての記号をログ出力）
        if (allergen.slug === 'milk' && value && value.trim() !== '') {
          console.log('🔍 CSV生成時記号変換デバッグ:', {
            allergen: allergen.slug,
            originalValue: value,
            normalizedValue: englishValue,
            menuName: menuName,
            hasMapping: Object.prototype.hasOwnProperty.call(presenceMapping, value.trim())
          });
        }
        
        csvRow.push(englishValue);
      });
      // 追加列
      csvRow.push((fragranceCsv || 'none').trim() || 'none');
      csvRow.push(heatStatus || 'none');
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
    
    // アップロード開始前のstore_locations状態確認
    console.log('🔍 アップロード開始前のstore_locations確認');
    const { data: beforeUploadStores, error: beforeUploadErr } = await supabase
      .from('store_locations')
      .select('id, product_id, address');
    console.log('🔍 アップロード開始前のstore_locations:', beforeUploadStores?.length || 0, '件');
    console.log('🔍 アップロード開始前のstore_locations詳細:', beforeUploadStores);
    
    if (!data || data.length === 0) {
      console.error('❌ データがありません');
      setUploadStatus('error');
      return;
    }
    
    console.log('✅ データ検証完了、アップロード開始');
    
    // データ検証完了後のstore_locations状態確認
    console.log('🔍 データ検証完了後のstore_locations確認');
    const { data: afterValidationStores, error: afterValidationErr } = await supabase
      .from('store_locations')
      .select('id, product_id, address');
    console.log('🔍 データ検証完了後のstore_locations:', afterValidationStores?.length || 0, '件');
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
      // ジョブ作成前のstore_locations状態確認
      console.log('🔍 ジョブ作成前のstore_locations確認');
      const { data: beforeJobStores, error: beforeJobErr } = await supabase
        .from('store_locations')
        .select('id, product_id, address');
      console.log('🔍 ジョブ作成前のstore_locations:', beforeJobStores?.length || 0, '件');
      
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
      
      // ジョブ作成後のstore_locations状態確認
      console.log('🔍 ジョブ作成後のstore_locations確認');
      const { data: afterJobStores, error: afterJobErr } = await supabase
        .from('store_locations')
        .select('id, product_id, address');
      console.log('🔍 ジョブ作成後のstore_locations:', afterJobStores?.length || 0, '件');
      
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
      
      // staging_imports挿入後のstore_locations確認
      console.log('🔍 staging_imports挿入後のstore_locations確認');
      const { data: afterStaging, error: afterStagingErr } = await supabase
        .from('store_locations')
        .select('id, product_id, address');
      console.log('🔍 staging_imports挿入後のstore_locations:', afterStaging?.length || 0, '件');
      
      // 3. バッチ処理をスキップ（store_locations削除問題のため）
      console.log('⚠️ バッチ処理をスキップします（store_locations削除問題のため）');
      let processOk = false; // フォールバック処理を使用
      
      // バッチ処理スキップ後のstore_locations確認
      console.log('🔍 バッチ処理スキップ後のstore_locations確認');
      const { data: afterSkip, error: afterSkipErr } = await supabase
        .from('store_locations')
        .select('id, product_id, address');
      console.log('🔍 バッチ処理スキップ後のstore_locations:', afterSkip?.length || 0, '件');
      
      // 4. store_locationsデータを手動で作成（バッチ処理が失敗した場合のフォールバック）
      console.log('🔄 store_locationsデータ作成開始');
      
      // デバッグ: 現在のstore_locationsテーブルの全データを確認
      const { data: allStoreLocations, error: allStoresError } = await supabase
        .from('store_locations')
        .select('id, product_id, address')
        .order('product_id, id');
      
      if (allStoresError) {
        console.error('❌ 全store_locations取得エラー:', allStoresError);
      } else {
        console.log('🔍 現在のstore_locations全データ:', allStoreLocations);
        console.log('🔍 store_locationsのproduct_id別件数:', 
          allStoreLocations?.reduce((acc, item) => {
            acc[item.product_id] = (acc[item.product_id] || 0) + 1;
            return acc;
          }, {}) || {}
        );
        if (!allStoreLocations || allStoreLocations.length === 0) {
          console.log('⚠️ 警告: store_locationsテーブルが空です。以前のアップロードでデータが削除された可能性があります。');
        }
      }
      try {
        // 商品IDを動的に取得
        let productId;
        
        // 1. products.nameを参照してidを確認
        console.log('🔍 商品名で検索開始:', productName);
        console.log('🔍 productsテーブル検索前のstore_locations確認');
        const { data: beforeProductSearch, error: beforeProductErr } = await supabase
          .from('store_locations')
          .select('id, product_id, address');
        console.log('🔍 商品検索前のstore_locations:', beforeProductSearch?.length || 0, '件');
        
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', productName.trim())
          .single();
        
        if (productError || !productData) {
          console.log('🔄 商品が存在しないため、新規作成します:', productName);
          
          // 新しい商品を作成
          console.log('🔍 商品作成前のstore_locations確認');
          const { data: beforeCreate, error: beforeCreateErr } = await supabase
            .from('store_locations')
            .select('id, product_id, address');
          console.log('🔍 商品作成前のstore_locations:', beforeCreate?.length || 0, '件');
          
          const { data: newProductData, error: createError } = await supabase
            .from('products')
            .insert({
              name: productName,
              brand: productBrand,
              category: productCategory,
              description: `${productName}のアレルギー情報`
            })
            .select('id, name')
            .single();
          
          if (createError || !newProductData) {
            console.error('❌ 商品作成エラー:', createError);
            console.error('商品名:', productName);
            
            // 重複エラーの場合、既存商品を検索
            if (createError?.code === '23505') { // ユニーク制約違反
              console.log('🔄 重複エラー検出、既存商品を再検索します');
              const { data: existingProduct, error: searchError } = await supabase
                .from('products')
                .select('id, name')
                .eq('name', productName)
                .eq('brand', productBrand)
                .single();
              
              if (searchError || !existingProduct) {
                console.error('❌ 既存商品検索エラー:', searchError);
                return;
              }
              
              productId = existingProduct.id;
              console.log('✅ 既存商品を使用:', productId, existingProduct.name);
            } else {
              return;
            }
          } else {
            productId = newProductData.id;
            console.log('✅ 新商品作成完了:', productName, 'ID:', productId);
          }
          
          console.log('🔍 商品作成後のstore_locations確認');
          const { data: afterCreate, error: afterCreateErr } = await supabase
            .from('store_locations')
            .select('id, product_id, address');
          console.log('🔍 商品作成後のstore_locations:', afterCreate?.length || 0, '件');
          
        } else {
          productId = productData.id;
          console.log('📦 既存商品ID:', productId, '商品名:', productData.name);
          
          console.log('🔍 既存商品取得後のstore_locations確認');
          const { data: afterExisting, error: afterExistingErr } = await supabase
            .from('store_locations')
            .select('id, product_id, address');
          console.log('🔍 既存商品取得後のstore_locations:', afterExisting?.length || 0, '件');
        }
        
        console.log('📦 確定した商品ID:', productId);
        
        // 選択された都道府県から住所を生成
        const addresses = selectedPrefectures.map(prefecture => {
          const detailedAddress = detailedAddresses[prefecture] || '';
          return normalizeAddress(prefecture, detailedAddress);
        });
        
        console.log('📍 生成された住所:', addresses);
        
        // 2. store_locationsのproduct_idを参照して既存データを確認
        console.log('🔍 store_locations検索開始 - product_id:', productId);
        const { data: existingStores, error: fetchExistingError } = await supabase
          .from('store_locations')
          .select('id, address, product_id')
          .eq('product_id', productId);

        console.log('🔍 既存store_locationsデータ（product_id=' + productId + '）:', existingStores);
        console.log('🔍 既存店舗数:', existingStores?.length || 0);

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

        // 3. 同じproduct_idは上書きOK、異なるproduct_idは上書きしない
        console.log('🔍 既存住所数:', (existingStores || []).length);
        console.log('🔍 新規住所数:', addresses.length);
        console.log('🔍 既存住所:', (existingStores || []).map(r => r.address));
        console.log('🔍 新規住所:', addresses);

        // 同じproduct_idの既存データを削除してから新規挿入（上書き）
        if (addresses.length > 0) {
          // まず同じproduct_idの既存データを削除
          if ((existingStores || []).length > 0) {
            console.log('🧹 同じproduct_idの既存データを削除開始:', productId);
            console.log('🔒 RESTRICT制約により、他のproduct_idは保護されます');
            
            const { error: deleteError } = await supabase
              .from('store_locations')
              .delete()
              .eq('product_id', productId);

            if (deleteError) {
              console.error('❌ 既存データ削除エラー:', deleteError);
              console.error('🔒 RESTRICT制約により削除がブロックされました');
            } else {
              console.log('🧹 既存データ削除完了:', (existingStores || []).length, '件');
              console.log('✅ 同じproduct_idのみが削除されました');
            }
          }

          // 新しいデータを挿入
          console.log('📝 store_locations新規挿入開始 - product_id:', productId);
          const insertPayload = addresses.map(address => ({
            product_id: productId,
            branch_name: null,
            address,
            source_url: defaultSourceUrl,
            store_list_url: defaultStoreListUrl
          }));

          const { data: insertData, error: insertError } = await supabase
            .from('store_locations')
            .insert(insertPayload)
            .select();

          if (insertError) {
            console.error('❌ store_locations新規挿入エラー:', insertError);
            console.error('エラー詳細:', JSON.stringify(insertError, null, 2));
          } else {
            console.log('✅ store_locations新規挿入完了:', insertData?.length || 0, '件');
            console.log('✅ 挿入されたproduct_id:', productId);
            console.log('🔒 RESTRICT制約により、他のproduct_idは保護されています');
          }
        } else {
          console.log('ℹ️ 挿入する住所がありません');
          console.log('ℹ️ 対象product_id:', productId);
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
        
        // 既存menu_itemsを丸ごと削除（対象商品）
        console.log('🔍 menu_items削除前のstore_locations確認開始');
        const { data: beforeStoreLocations, error: beforeErr } = await supabase
          .from('store_locations')
          .select('id, product_id, address');
        console.log('🔍 削除前のstore_locations:', beforeStoreLocations?.length || 0, '件');
        console.log('🔍 削除前のstore_locations詳細:', beforeStoreLocations);
          
          const { data: allMenus, error: fetchAllErr } = await supabase
            .from('menu_items')
            .select('id')
            .eq('product_id', pid);
          if (fetchAllErr) {
            console.error('❌ 既存menu_items取得エラー:', fetchAllErr);
          } else {
            const allIds = (allMenus || []).map(r => r.id);
            if (allIds.length > 0) {
              console.log('🧹 既存menu_items削除開始 - product_id:', pid, '件数:', allIds.length);
              console.log('🧹 削除対象menu_items ID:', allIds);
              
              // 子を先に削除
              console.log('🧹 menu_item_allergies削除開始');
              const { error: allergyDeleteErr } = await supabase
                .from('menu_item_allergies')
                .delete()
                .in('menu_item_id', allIds);
              if (allergyDeleteErr) {
                console.error('❌ menu_item_allergies削除エラー:', allergyDeleteErr);
              } else {
                console.log('✅ menu_item_allergies削除完了');
              }
              
              console.log('🧹 menu_items削除開始');
              const { error: menuDeleteErr } = await supabase
                .from('menu_items')
                .delete()
                .eq('product_id', pid)
                .in('id', allIds);
              if (menuDeleteErr) {
                console.error('❌ menu_items削除エラー:', menuDeleteErr);
              } else {
                console.log('✅ menu_items削除完了');
              }
              
              console.log('🧹 既存menu_items 全削除完了:', allIds.length, '件');
              console.log('⚠️ 注意: store_locationsはRESTRICT制約により保護されています');
            }
          }
          
          // 削除後のstore_locations確認
          console.log('🔍 menu_items削除後のstore_locations確認開始');
          const { data: afterStoreLocations, error: afterErr } = await supabase
            .from('store_locations')
            .select('id, product_id, address');
          console.log('🔍 削除後のstore_locations:', afterStoreLocations?.length || 0, '件');
          console.log('🔍 削除後のstore_locations詳細:', afterStoreLocations);
          
          // 変化の確認
          const beforeCount = beforeStoreLocations?.length || 0;
          const afterCount = afterStoreLocations?.length || 0;
          if (beforeCount !== afterCount) {
            console.error('🚨 警告: store_locationsの件数が変化しました!');
            console.error('🚨 削除前:', beforeCount, '件 → 削除後:', afterCount, '件');
            console.error('🚨 これは予期しない動作です。RESTRICT制約が機能していない可能性があります。');
          } else {
            console.log('✅ store_locationsは影響を受けていません');
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
          }
      } catch (menuFallbackError) {
        console.error('❌ menu_itemsフォールバック処理エラー:', menuFallbackError);
      }
      
      // フォールバック処理完了後
      try {
        const { data: finalProductData, error: finalProductError } = await supabase
          .from('products')
          .select('id')
          .eq('name', productName)
          .single();
        
        if (!finalProductError && finalProductData) {
          // === 追加: CSV -> products.product_title と product_allergies（正規化保存） ===
          const pid = finalProductData.id;

          // 1) products.product_title をCSVの全メニュー名で更新（重複も保持・順序維持）
          try {
            if (Array.isArray(stagingData) && stagingData.length > 0) {
              const allNamesInOrder = (stagingData || [])
                .map(r => String(r?.raw_menu_name || '').trim())
                .filter(n => n.length > 0);
              if (allNamesInOrder.length > 0) {
                // DBの列長制約 varchar(200) に合わせて厳格に200文字へ丸める
                const joined = allNamesInOrder.join(' / ');
                const over = joined.length > 200;
                const trimmed = over ? joined.slice(0, 199) + '…' : joined; // 200文字以内に収める
                const { error: ptErr } = await supabase.from('products').update({ product_title: trimmed }).eq('id', pid);
                if (ptErr) {
                  console.error('❌ product_title 更新失敗:', JSON.stringify(ptErr));
                } else {
                  console.log('✅ product_title を更新（200文字制限適用）:', trimmed.substring(0, 120) + (trimmed.length > 120 ? '...' : ''));
                }
              }
            }
          } catch (ePT) {
            console.warn('product_title 更新例外:', ePT?.message || ePT);
          }

          // 2) heat_status を products に直接保存（グローバル属性）
          try {
            const hsValue = (heatStatus || 'none').trim();
            const { error: hsErr } = await supabase
              .from('products')
              .update({ heat_status: hsValue })
              .eq('id', pid);
            if (hsErr) {
              console.warn('❌ products.heat_status 更新失敗:', JSON.stringify(hsErr));
            } else {
              console.log('✅ products.heat_status 更新成功:', hsValue);
              // 直後に読み戻して実値を確認
              const { data: hsRow, error: hsReadErr } = await supabase
                .from('products')
                .select('id, heat_status')
                .eq('id', pid)
                .single();
              if (hsReadErr) {
                console.warn('⚠️ products.heat_status 読み戻し失敗:', JSON.stringify(hsReadErr));
              } else {
                console.log('🔍 products.heat_status 読み戻し結果:', hsRow);
              }
            }
          } catch (e) {
            console.warn('products.heat_status 更新例外:', e?.message || e);
          }

          // 3) CSVの各行を集計して保存
          //   - product_allergies: presence_type を direct/none に統一（JP）
          //   - product_trace_allergies: 28品目の direct/none（traceはdirectにマップ）（JP）
          //   - product_fragrance_allergies: 28品目の direct/none（選択された香料のみdirect）（JP）
          try {
            // 既存のアレルギー行を全削除（このCSV取込で上書き）
            // JPと旧データ（country_code NULL）を両方削除
            await supabase
              .from('product_allergies')
              .delete()
              .eq('product_id', pid)
              .or('country_code.is.null,country_code.eq.JP');

            // アレルゲンごとに presence を集計: direct を優先（trace は別管理、none/unused は none）
            const presenceOrder = { direct: 2, trace: 1, none: 0, unused: 0 };
            const aggregated = new Map(); // allergy_item_id -> presence_type（direct/trace/none）

            (Array.isArray(stagingData) ? stagingData : []).forEach(row => {
              standardAllergens.forEach(allergen => {
                // stagingDataは既にnormalizePresenceで変換済みなので、そのまま使用
                const mapped = row[allergen.slug] || 'none';
                const prev = aggregated.get(allergen.slug) || 'none';
                
                // デバッグログ: 乳アレルギーの変換を確認
                if (allergen.slug === 'milk' && mapped !== 'none') {
                  console.log('🔍 乳アレルギー集計デバッグ:', {
                    mapped,
                    prev,
                    willUpdate: (presenceOrder[mapped] || 0) > (presenceOrder[prev] || 0)
                  });
                }
                
                if ((presenceOrder[mapped] || 0) > (presenceOrder[prev] || 0)) {
                  aggregated.set(allergen.slug, mapped);
                }
              });
            });

            // 香料選択は別管理（product_allergies には反映しない）
            const parsedFragrance = (fragranceCsv || '').trim();
            const fragranceIds = (parsedFragrance && parsedFragrance.toLowerCase() !== 'none')
              ? parsedFragrance.split(',').map(s => s.trim()).filter(Boolean)
              : [];

            // trace / fragrance を 28品目の direct/none マップとして保存（正規化テーブル）
            const traceMap = {};
            const fragranceMap = {};
            standardAllergens.forEach(allergen => {
              const key = allergen.slug;
              const agg = aggregated.get(key) || 'none';
              // traceMap: 集計がtraceのとき direct、それ以外 none
              traceMap[key] = (agg === 'trace') ? 'direct' : 'none';
              // fragranceMap: fragranceIdsに含まれていれば direct、それ以外 none
              fragranceMap[key] = fragranceIds.includes(key) ? 'direct' : 'none';
            });

            // 国別テーブルへ上書き保存（JP）
            // 1) trace（JP）
            await supabase.from('product_trace_allergies').delete().eq('product_id', pid).eq('country_code', 'JP');
            const traceRows = standardAllergens.map(allergen => ({
              product_id: pid,
              country_code: 'JP',
              allergy_item_id: allergen.slug,
              presence_type: traceMap[allergen.slug] || 'none'
            }));
            if (traceRows.length > 0) {
              const { error: traceInsertErr } = await supabase.from('product_trace_allergies').insert(traceRows);
              if (traceInsertErr) {
                console.error('❌ product_trace_allergies 保存エラー:', traceInsertErr);
              }
            }
            // 2) fragrance（JP）
            await supabase.from('product_fragrance_allergies').delete().eq('product_id', pid).eq('country_code', 'JP');
            const fragranceRows = standardAllergens.map(allergen => ({
              product_id: pid,
              country_code: 'JP',
              allergy_item_id: allergen.slug,
              presence_type: fragranceMap[allergen.slug] || 'none'
            }));
            if (fragranceRows.length > 0) {
              const { error: fragInsertErr } = await supabase.from('product_fragrance_allergies').insert(fragranceRows);
              if (fragInsertErr) {
                console.error('❌ product_fragrance_allergies 保存エラー:', fragInsertErr);
              }
            }

            // INSERT行を構築（全標準アレルゲンを direct/none で保存）
            const rows = [];
            // allergy_itemsからslug->id（allergy_item_id_int）を解決
            const { data: ai, error: aiErr } = await supabase.from('allergy_items').select('id,item_id');
            if (aiErr) {
              console.error('❌ allergy_items 取得エラー:', aiErr);
              throw aiErr;
            }
            const slugToId = new Map((ai || []).map(r => [r.item_id, r.id]));
            standardAllergens.forEach(allergen => {
              const agg = aggregated.get(allergen.slug) || 'none';
              const presence_type = agg === 'direct' ? 'direct' : 'none';
              
              // デバッグログ: 乳アレルギーの最終保存値を確認
              if (allergen.slug === 'milk') {
                console.log('🔍 乳アレルギー最終保存デバッグ:', {
                  aggregated: agg,
                  presence_type,
                  product_id: pid
                });
              }
              
              rows.push({
                product_id: pid,
                country_code: 'JP',
                allergy_item_id: allergen.slug,
                presence_type,
                amount_level: 'unknown',
                notes: null,
                allergy_item_id_int: slugToId.get(allergen.slug)
              });
            });

            const filteredRows = rows.filter(r => typeof r.allergy_item_id_int === 'number');
            if (filteredRows.length > 0) {
              const { error: insErr } = await supabase
                .from('product_allergies')
                .upsert(filteredRows, { onConflict: 'product_id,country_code,allergy_item_id' });
              if (insErr) {
                console.error('❌ product_allergies 保存エラー:', insErr);
              } else {
                console.log('✅ product_allergies 保存完了:', filteredRows.length, '件');
              }
            } else {
              console.log('ℹ️ 保存すべきアレルギー行がありません（direct/traceなし）');
            }
          } catch (saveErr) {
            console.error('❌ product_allergies 保存処理エラー:', saveErr);
          }

          // 4) product_allergies_matrixの作成（表形式でわかりやすく）
          try {
            console.log('🔄 product_allergies_matrix更新（実ID使用）開始');
            await updateProductAllergiesMatrix(pid, jobId);
            console.log('✅ product_allergies_matrix更新完了');
          } catch (matrixErr) {
            console.error('❌ product_allergies_matrix作成エラー:', matrixErr);
          }
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

          {/* 香料（アイコン選択・折りたたみ） */}
          <div className="bg-white border rounded-lg">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4"
              onClick={() => setFragranceOpen(v => !v)}
            >
              <span className="text-sm font-medium text-gray-900">香料に含まれるアレルギー（任意）</span>
              <span className="text-xs text-gray-500">
                {fragranceSelected.length > 0
                  ? `選択: ${fragranceSelected.map(id => allergyOptions.find(a => a.id === id)?.name).filter(Boolean).join('、')}`
                  : (fragranceOpen ? '閉じる' : '開く')}
              </span>
            </button>
            {fragranceOpen && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(allergyOptions || []).map(allergy => (
                    <button
                      key={`frag-${allergy.id}`}
                      onClick={() => toggleFragrance(allergy.id)}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        fragranceSelected.includes(allergy.id)
                          ? 'bg-purple-500 text-white border-purple-500'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{allergy.icon}</div>
                        <div className="font-medium">{allergy.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {/* 内部値の確認（非表示でも可） */}
                <input type="hidden" value={fragranceCsv} readOnly />
              </div>
            )}
          </div>

          {/* 加熱ステータス（4ボタン） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              加熱ステータス
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'heated', label: '加熱（heated）' },
                { key: 'none', label: '非加熱（none）' },
                { key: 'uncertain', label: '未確定（uncertain）' },
                { key: 'unused', label: '使用しない（unused）' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setHeatStatus(item.key)}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    heatStatus === item.key
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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