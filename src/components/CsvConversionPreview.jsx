import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit3, FiSave, FiRotateCcw, FiCheckCircle, FiAlertCircle, FiTrash2 } from 'react-icons/fi';

const CsvConversionPreview = ({ csvData, rules, onConversion, onBack }) => {
  const [convertedData, setConvertedData] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [stats, setStats] = useState({ total: 0, converted: 0, errors: 0 });

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

  // CSVデータを変換
  useEffect(() => {
    if (!csvData || !rules) return;

    // ヘッダー行を除外（1行目をスキップ）
    const dataRows = csvData.slice(1);

    // 手動追加された記号をルールに追加
    const allSymbolMappings = { ...rules.symbolMappings };
    if (rules.manualSymbols) {
      rules.manualSymbols.forEach(symbol => {
        if (!allSymbolMappings[symbol]) {
          allSymbolMappings[symbol] = 'none'; // デフォルト値
        }
      });
    }
    
    const converted = dataRows.map((row, rowIndex) => {
      const convertedRow = {
        rowIndex: rowIndex + 1, // 元の行番号を保持
        original: row,
        converted: {},
        errors: []
      };

      // 各行を処理（商品名列は除外）
      row.forEach((cell, cellIndex) => {
        // 商品名列（1列目）は記号検出から除外
        if (cellIndex === 0) return;
        
        if (typeof cell === 'string' && cell.trim()) {
          // 記号を検出して変換（手動追加された記号も含む）
          const symbolMatches = cell.match(/[●○◎△▲\-▯◇◆□■※★☆]/g);
          if (symbolMatches) {
            symbolMatches.forEach(symbol => {
              const mappedValue = allSymbolMappings[symbol];
              if (mappedValue) {
                // アレルギー項目を特定
                const allergenSlug = detectAllergenFromContext(row, cellIndex, standardAllergens);
                if (allergenSlug) {
                  convertedRow.converted[allergenSlug] = rules.outputLabels[mappedValue] || mappedValue;
                }
              }
            });
          } else if (cell.trim() === '-') {
            // ハイフン記号も処理
            const allergenSlug = detectAllergenFromContext(row, cellIndex, standardAllergens);
            if (allergenSlug) {
              convertedRow.converted[allergenSlug] = rules.outputLabels.none || 'none';
            }
          }
        }
      });

      return convertedRow;
    });

    setConvertedData(converted);
    updateStats(converted);
  }, [csvData, rules]);

  const detectAllergenFromContext = (row, cellIndex, allergens) => {
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
                 (header.includes('ｱｰﾓﾝﾄﾞ') && a.slug === 'almond');
        });
        
        if (allergen) {
          return allergen.slug;
        }
      }
    }
    
    // ヘッダーで見つからない場合、列位置から推定
    // このCSVフォーマット: 商品名,卵,乳,小麦,そば,落花生,えび,かに,くるみ,大豆,牛肉,豚肉,鶏肉,さけ,さば,あわび,いか,いくら,オレンジ,キウイフルーツ,もも,りんご,やまいも,ゼラチン,バナナ,カシューナッツ,ゴマ,アーモンド,まつたけ
    if (cellIndex >= 1) { // アレルギー項目は2列目以降（商品名の後）
      const allergenIndex = cellIndex - 1;
      if (allergenIndex < rules.allergenOrder.length) {
        return rules.allergenOrder[allergenIndex];
      }
    }
    
    return null;
  };

  const updateStats = (data) => {
    const total = data.length;
    const converted = data.filter(row => Object.keys(row.converted).length > 0).length;
    const errors = data.filter(row => row.errors.length > 0).length;
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
      case 'direct': return 'bg-red-100 text-red-800';
      case 'trace': return 'bg-yellow-100 text-yellow-800';
      case 'none': return 'bg-green-100 text-green-800';
      case 'unused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const handleNext = () => {
    // 変換されたデータを整理
    const finalData = convertedData.map(row => {
      const result = {
        rowIndex: row.rowIndex,
        original: row.original,
        converted: {}
      };

      // 標準アレルギー項目の順序で整理
      rules.allergenOrder.forEach(slug => {
        result.converted[slug] = row.converted[slug] || '';
      });

      return result;
    });

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
                {rules.allergenOrder.map(slug => {
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
                  <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                    {row.original[0] || '商品名なし'}
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
                  {rules.allergenOrder.map(slug => {
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
                              <option value="direct">direct</option>
                              <option value="trace">trace</option>
                              <option value="none">none</option>
                              <option value="unused">unused</option>
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
          <span>変換完了</span>
        </button>
      </div>
    </div>
  );
};

export default CsvConversionPreview;
