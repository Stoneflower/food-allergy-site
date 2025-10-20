import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit3, FiSave, FiRotateCcw, FiCheckCircle, FiAlertCircle, FiTrash2, FiImage } from 'react-icons/fi';
import { buildImageUrl } from '../utils/cloudflareImages';

const CsvConversionPreview = ({ csvData, rules, uploadedImages = [], onConversion, onBack }) => {
  const [convertedData, setConvertedData] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [stats, setStats] = useState({ total: 0, converted: 0, errors: 0 });
  
  // Cloudflare Images の設定（実際の運用時は環境変数から取得）
  const CF_ACCOUNT_HASH = process.env.REACT_APP_CF_ACCOUNT_HASH || 'your-account-hash';

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

  // 設定ページのアレルギー順（ローカル保存があればそれを最優先）
  const getAppliedAllergenOrder = () => {
    try {
      const saved = localStorage.getItem('appliedAllergenOrder');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) { console.debug('Error loading appliedAllergenOrder from localStorage:', e); }
    return Array.isArray(rules?.allergenOrder) ? rules.allergenOrder : standardAllergens.map(a => a.slug);
  };
  const allergenOrder = getAppliedAllergenOrder();

  // CSVデータを変換
  useEffect(() => {
    if (!csvData || !rules) {
      console.log('CSV変換開始: csvData =', csvData, 'rules =', rules);
      return;
    }

    console.log('CSV変換開始: 総行数 =', csvData.length, 'rules =', rules);
    
    // ヘッダー行を除外（1行目をスキップ）
    const dataRows = csvData.slice(1);
    console.log('データ行数:', dataRows.length);

    // 手動追加された記号をルールに追加（未設定は none 初期化）
    const allSymbolMappings = { ...rules.symbolMappings };
    if (rules.manualSymbols) {
      rules.manualSymbols.forEach(symbol => {
        if (!allSymbolMappings[symbol]) {
          allSymbolMappings[symbol] = 'none'; // デフォルト値
        }
      });
    }
    // よく使う追加記号の既定値（未設定ガード）
    ['●','ー','—','―','-','•','◊','▽','▽◊','△◊'].forEach(sym => {
      if (allSymbolMappings[sym] == null) allSymbolMappings[sym] = sym === '●' ? 'direct' : 'none';
    });

    // outputLabelsのデフォルト値を設定
    console.log('rules.outputLabels:', rules.outputLabels);
    console.log('rules.outputLabelsの型:', typeof rules.outputLabels);
    console.log('rules.outputLabelsの内容:', JSON.stringify(rules.outputLabels));
    
    // デフォルト値を先に設定し、rules.outputLabelsで上書き
    const defaultOutputLabels = {
      direct: 'ふくむ',
      none: 'ふくまない',
      trace: 'コンタミ',
      fragrance: '香料にふくむ',
      unused: '未使用'
    };
    
    // 完全にハードコード（確実に日本語ラベルを適用）
    const outputLabels = {
      direct: 'ふくむ',
      none: 'ふくまない',
      trace: 'コンタミ',
      fragrance: '香料にふくむ',
      unused: '未使用'
    };
    
    console.log('=== ハードコードされたoutputLabels ===');
    console.log('direct:', outputLabels.direct);
    console.log('none:', outputLabels.none);
    console.log('trace:', outputLabels.trace);
    console.log('fragrance:', outputLabels.fragrance);
    console.log('unused:', outputLabels.unused);
    console.log('使用するallSymbolMappings:', allSymbolMappings);
    
    const converted = dataRows.map((row, rowIndex) => {
      if (rowIndex < 5 || (rowIndex >= 70 && rowIndex <= 100)) { // 最初の5行と行70-100をデバッグ
        console.log(`行${rowIndex + 1}処理開始:`, row);
      }
      
      // CSVの行が文字列として1つのセルになっている場合、カンマで分割
      let processedRow = row;
      if (row.length === 1 && typeof row[0] === 'string') {
        if (row[0].includes(',')) {
          // カンマを含む場合は分割
          processedRow = row[0].split(',');
          if (rowIndex >= 70 && rowIndex <= 100) {
            console.log(`  行${rowIndex + 1}を分割:`, processedRow);
          }
        } else if (row[0].includes('\n')) {
          // 改行を含む場合は、改行で分割してスペースで結合
          const lines = row[0].split('\n');
          const productName = lines.join(' '); // 改行をスペースに置換
          if (rowIndex >= 70 && rowIndex <= 100) {
            console.log(`  行${rowIndex + 1}の改行を処理:`, {
              original: row[0],
              productName: productName,
              lines: lines
            });
          }
          // 商品名のみの行として処理
          const convertedRow = {
            original: row,
            converted: {}
          };
          return convertedRow;
        } else {
          // カンマも改行も含まない場合は商品名のみの行としてスキップ
          if (rowIndex >= 70 && rowIndex <= 100) {
            console.log(`  行${rowIndex + 1}は商品名のみの行としてスキップ:`, row[0]);
          }
          // 商品名のみの行は未設定として処理
          const convertedRow = {
            original: row,
            converted: {}
          };
          return convertedRow;
        }
      }
      
      // 複数行の商品名を1つにまとめる処理
      if (rowIndex > 0 && processedRow.length === 1 && typeof processedRow[0] === 'string' && !processedRow[0].includes(',')) {
        // 前の行が商品名のみで、現在の行も商品名のみの場合
        const prevRow = dataRows[rowIndex - 1];
        if (prevRow && prevRow.length === 1 && typeof prevRow[0] === 'string' && !prevRow[0].includes(',')) {
          // 前の行と現在の行を結合
          const combinedName = `${prevRow[0]} ${processedRow[0]}`;
          if (rowIndex >= 70 && rowIndex <= 100) {
            console.log(`  行${rowIndex + 1}を前の行と結合: "${combinedName}"`);
          }
          // 前の行のデータを更新（この処理は後で実装）
          // 現在の行はスキップ
          const convertedRow = {
            original: row,
            converted: {}
          };
          return convertedRow;
        }
      }
      
      // 商品名のみの行をスキップ（アレルギー記号がない場合）
      if (processedRow.length === 1 && typeof processedRow[0] === 'string' && !processedRow[0].includes(',')) {
        if (rowIndex >= 70 && rowIndex <= 100) {
          console.log(`  行${rowIndex + 1}は商品名のみの行としてスキップ:`, processedRow[0]);
        }
        // 商品名のみの行は未設定として処理
        const convertedRow = {
          original: row,
          converted: {}
        };
        return convertedRow;
      }
      
      // 行210-211のデバッグ情報を追加
      if (rowIndex >= 209 && rowIndex <= 212) {
        console.log(`行${rowIndex + 1}詳細:`, {
          originalRow: row,
          processedRow: processedRow,
          rowLength: row.length,
          processedRowLength: processedRow.length,
          firstCell: row[0],
          isString: typeof row[0] === 'string',
          hasComma: row[0] && row[0].includes(',')
        });
      }
      
      const convertedRow = {
        rowIndex: rowIndex + 1, // 元の行番号を保持
        original: processedRow,
        converted: {},
        errors: []
      };

      // 各行を処理（商品名列は除外）
      processedRow.forEach((cell, cellIndex) => {
        // 商品名列（1列目）は記号検出から除外
        if (cellIndex === 0) return;
        
        if ((rowIndex < 5 && cellIndex < 5) || (rowIndex >= 70 && rowIndex <= 100) || (rowIndex >= 209 && rowIndex <= 212)) { // 最初の5行5列、行70-100、行209-212をデバッグ
          console.log(`  セル[${rowIndex + 1},${cellIndex + 1}]: "${cell}"`);
        }
        
        // まず対象アレルゲンを特定（空欄処理にも使う）
        const allergenSlugForCell = detectAllergenFromContext(processedRow, cellIndex, standardAllergens, allergenOrder);

        // 空欄・不可視空白を「ふくまない」に正規化
        const normalizedRaw = (cell ?? '')
          .toString()
          .replace(/\u00A0/g, '')  // NBSP
          .replace(/\u200B/g, '')  // ゼロ幅空白
          .trim();

        if (!normalizedRaw) {
          if (allergenSlugForCell) {
            convertedRow.converted[allergenSlugForCell] = 'ふくまない';
            if (rowIndex < 5 && cellIndex < 5) {
              console.log(`    空欄→ふくまない: 行${rowIndex + 1}, アレルギー: "${allergenSlugForCell}"`);
            }
          }
          return; // 次のセルへ
        }

        if (typeof cell === 'string' && normalizedRaw) {
          // 商品名に含まれる記号を除外してから記号を検出して変換（手動追加された記号も含む）
          const cleanCell = normalizedRaw.replace(/【|】|／|（|）|＊|・/g, '');
          // ダッシュ類を統一
          const normalizedCell = cleanCell.replace(/[ーｰ−―─‐]/g, 'ー');

          // 先に複合記号（空白挟みも）を検出して正規化
          const compositeRegex = /(▽\s*◊|△\s*◊)/gu;
          const compositeFound = normalizedCell.match(compositeRegex) || [];
          const compositeNormalized = compositeFound.map(m => m.replace(/\s+/g, ''));

          // 単一記号も検出（追加: ー, ◊, ▽）
          const singleMatches = normalizedCell.match(/[●○•◎△▲▽◊ー\-▯◇◆□■※★☆🔹―一]/gu) || [];
          const symbolMatches = [...new Set([...compositeNormalized, ...singleMatches])];

          if (symbolMatches.length > 0) {
            if (rowIndex < 5 && cellIndex < 5) {
              console.log(`    記号検出: "${symbolMatches}"`);
            }
            // マッピング解決関数（ダッシュ類は相互に参照）
            const resolveMapping = (sym) => {
              const dashVariants = ['ー','—','―','ｰ','−','─','‐','-'];
              const candidates = [sym];
              if (sym === 'ー') {
                candidates.push(...dashVariants.filter(s => s !== 'ー'));
              } else if (dashVariants.includes(sym)) {
                candidates.push('ー');
              }
              for (const c of candidates) {
                const mv = allSymbolMappings[c];
                if (mv) return mv;
              }
              return allSymbolMappings['ー'] || 'none';
            };

            symbolMatches.forEach(symbol => {
              const mappedValue = resolveMapping(symbol);
              console.log(`記号変換: 行${rowIndex + 1}, 列${cellIndex + 1}, 記号: "${symbol}", マッピング値: "${mappedValue}"`);
              if (mappedValue) {
                // アレルギー項目を特定
                const allergenSlug = allergenSlugForCell || detectAllergenFromContext(processedRow, cellIndex, standardAllergens, allergenOrder);
                console.log(`アレルギー特定: 行${rowIndex + 1}, 列${cellIndex + 1}, アレルギー: "${allergenSlug}"`);
                if (allergenSlug) {
                  // 直接日本語ラベルを設定
                  let outputValue;
                  switch (mappedValue) {
                    case 'direct': outputValue = 'ふくむ'; break;
                    case 'none': outputValue = 'ふくまない'; break;
                    case 'trace': outputValue = 'コンタミ'; break;
                    case 'fragrance': outputValue = '香料にふくむ'; break;
                    case 'unused': outputValue = '未使用'; break;
                    default: outputValue = mappedValue;
                  }
                  convertedRow.converted[allergenSlug] = outputValue;
                  console.log(`変換完了: 行${rowIndex + 1}, アレルギー: "${allergenSlug}", 値: "${outputValue}"`);
                }
              }
            });
          } else if (normalizedRaw === '-') {
            // ハイフン記号も処理
            const allergenSlug = allergenSlugForCell || detectAllergenFromContext(processedRow, cellIndex, standardAllergens, allergenOrder);
            if (allergenSlug) {
              convertedRow.converted[allergenSlug] = 'ふくまない';
              console.log(`変換完了 (ハイフン): 行${rowIndex + 1}, アレルギー: "${allergenSlug}", 値: "ふくまない"`);
            }
          }
        }
      });

      return convertedRow;
    });

    console.log('変換完了: 総行数 =', converted.length);
    console.log('変換結果サンプル (最初の3行):', converted.slice(0, 3));
    
    setConvertedData(converted);
    updateStats(converted);
  }, [csvData, rules]);

  const detectAllergenFromContext = (row, cellIndex, allergens, orderOverride) => {
    // 1行目のヘッダー行からアレルギー項目を特定
    if (csvData.length > 0) {
      const headerRow = csvData[0]; // 1行目
      if (headerRow[cellIndex]) {
        const header = headerRow[cellIndex].toString().trim();
        
        // より柔軟なマッチング
        const allergen = allergens.find(a => {
          const name = a.name.trim();
          return header === name || 
                 header.includes(name) || 
                 name.includes(header) ||
                 header === a.slug ||
                 header.includes(a.slug) ||
                 // カタカナ表記も対応
                 (header.includes('ｵﾚﾝｼﾞ') && a.slug === 'orange') ||
                 (header.includes('ｷｳｲﾌﾙｰﾂ') && a.slug === 'kiwi') ||
                 (header.includes('ｾﾞﾗﾁﾝ') && a.slug === 'gelatin') ||
                 (header.includes('ｶｼｭｰﾅｯﾂ') && a.slug === 'cashew') ||
                 (header.includes('ｱｰﾓﾝﾄﾞ') && a.slug === 'almond') ||
                 (header.includes('マカダミアナッツ') && a.slug === 'macadamia');
        });
        
        if (allergen) {
          return allergen.slug;
        }
      }
    }
    
    // ヘッダーで見つからない場合、設定された順序に基づく列位置から推定
    if (cellIndex >= 1) { // アレルギー項目は2列目以降（商品名の後）
      const allergenIndex = cellIndex - 1;
      const baseOrder = Array.isArray(orderOverride) && orderOverride.length > 0
        ? orderOverride
        : allergenOrder;
      if (allergenIndex < baseOrder.length) {
        return baseOrder[allergenIndex];
      }
    }
    
    return null;
  };

  const updateStats = (data) => {
    const total = data.length;
    const converted = data.filter(row => Object.keys(row.converted).length > 0).length;
    const errors = data.filter(row => row.errors && row.errors.length > 0).length;
    setStats({ total, converted, errors });
  };

  const handleCellEdit = (rowIndex, allergenSlug, value) => {
    setConvertedData(prev => {
      const newData = [...prev];
      if (!newData[rowIndex].converted[allergenSlug]) {
        newData[rowIndex].converted[allergenSlug] = value;
      } else {
        newData[rowIndex].converted[allergenSlug] = value;
      }
      updateStats(newData);
      return newData;
    });
  };

  const handleCellSave = () => {
    setEditingCell(null);
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const handleDeleteRow = (rowIndex) => {
    if (window.confirm('この行を削除しますか？')) {
      setConvertedData(prev => {
        const newData = prev.filter((_, index) => index !== rowIndex);
        updateStats(newData);
        return newData;
      });
    }
  };

  const getCellValue = (rowIndex, allergenSlug) => {
    const row = convertedData[rowIndex];
    if (!row) return '';
    return row.converted[allergenSlug] || '';
  };

  const getCellColor = (value) => {
    switch (value) {
      case 'direct':
      case 'ふくむ': return 'bg-red-100 text-red-800';
      case 'trace':
      case 'コンタミ': return 'bg-yellow-100 text-yellow-800';
      case 'none':
      case 'ふくまない': return 'bg-green-100 text-green-800';
      case 'unused':
      case '未使用': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  // 商品名から画像を検索する関数
  const findImageForProduct = (productName) => {
    if (!productName || !uploadedImages.length) return null;
    
    // 商品名から不要な文字を除去して正規化
    const normalizedProductName = productName
      .replace(/【|】|／|（|）|＊|・/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
    
    // ファイル名から拡張子を除去して正規化
    const matchingImage = uploadedImages.find(imageData => {
      const fileName = imageData.file.name
        .replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .replace(/\s+/g, '')
        .toLowerCase();
      
      // 商品名とファイル名が一致するか、商品名がファイル名に含まれるかチェック
      return fileName === normalizedProductName || 
             fileName.includes(normalizedProductName) ||
             normalizedProductName.includes(fileName);
    });
    
    return matchingImage;
  };

  const handleNext = () => {
    // 変換されたデータを整理
    const finalData = convertedData.map(row => {
      const productName = row.original[0] || '';
      const associatedImage = findImageForProduct(productName);
      
      const result = {
        rowIndex: row.rowIndex,
        original: row.original,
        converted: {},
        image_id: associatedImage?.imageId || null,
        // 追加列の初期値
        fragrance_allergens: 'none',
        heat_status: 'none'
      };

      // 標準アレルギー項目の順序で整理
      allergenOrder.forEach(slug => {
        result.converted[slug] = row.converted[slug] || '';
      });

      return result;
    });

    try {
      // プレビュー最終データをローカルに保存（後段の保存処理でそのまま使用）
      localStorage.setItem('finalPreviewData', JSON.stringify(finalData));
      // この時点のアレルギー順を保存して、設定画面にも反映できるようにする
      if (Array.isArray(allergenOrder) && allergenOrder.length > 0) {
        localStorage.setItem('appliedAllergenOrder', JSON.stringify(allergenOrder));
      }
    } catch (e) {
      // noop
    }

    onConversion(finalData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          変換プレビュー
        </h2>
        <p className="text-gray-600">
          変換結果を確認・編集してください
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiCheckCircle className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-blue-600">総行数</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiCheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-green-600">変換済み</p>
              <p className="text-2xl font-bold text-green-900">{stats.converted}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-red-600">エラー</p>
              <p className="text-2xl font-bold text-red-900">{stats.errors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 変換テーブル */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-auto overflow-x-auto">
          <div className="mb-2 text-sm text-gray-600">
            データ行 {convertedData.length} 行表示中 (CSV総行数: {csvData.length}行、ヘッダー行1行を除外済み)
          </div>
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  行
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
                {allergenOrder.map(slug => {
                  const allergen = standardAllergens.find(a => a.slug === slug);
                  return (
                    <th key={slug} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {allergen?.name || slug}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {convertedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {rowIndex + 1}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        {(() => {
                          const associatedImage = findImageForProduct(row.original[0]);
                          if (associatedImage) {
                            return (
                              <img
                                src={URL.createObjectURL(associatedImage.file)}
                                alt={row.original[0]}
                                className="w-8 h-8 object-cover rounded border"
                                title={`画像: ${associatedImage.file.name}`}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="truncate">
                        {row.original[0] || '商品名なし'}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="行を削除"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                  {allergenOrder.map(slug => {
                    const value = getCellValue(rowIndex, slug);
                    const isEditing = editingCell === `${rowIndex}-${slug}`;
                    
                    return (
                      <td key={slug} className="px-3 py-2 text-sm">
                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <select
                              value={value}
                              onChange={(e) => handleCellEdit(rowIndex, slug, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              autoFocus
                            >
                              <option value="">選択</option>
                              <option value="ふくむ">ふくむ</option>
                              <option value="コンタミ">コンタミ</option>
                              <option value="ふくまない">ふくまない</option>
                              <option value="未使用">未使用</option>
                            </select>
                            <button
                              onClick={handleCellSave}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <FiSave className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleCellCancel}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCell(`${rowIndex}-${slug}`)}
                            className={`w-full px-2 py-1 rounded text-xs ${getCellColor(value)} hover:opacity-80`}
                          >
                            {value || '未設定'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← 戻る
        </button>

        <button
          onClick={handleNext}
          className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>次のステップへ進む</span>
        </button>
      </div>
    </div>
  );
};

export default CsvConversionPreview;
