import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit3, FiSave, FiRotateCcw } from 'react-icons/fi';

const CsvRuleEditor = ({ csvData, rules, onRulesChange, onNext }) => {
  const [localRules, setLocalRules] = useState(rules);
  const [detectedSymbols, setDetectedSymbols] = useState(new Set());
  const [detectedAllergens, setDetectedAllergens] = useState([]);

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

  // CSVから記号とアレルギー項目を検出
  useEffect(() => {
    if (!csvData || csvData.length === 0) return;

    const symbols = new Set();
    const allergens = [];

    // 最初の数行から記号を検出
    csvData.slice(0, 10).forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (typeof cell === 'string') {
          // 記号パターンを検出
          const symbolMatches = cell.match(/[●○◎△-▯◇◆□■※★☆]/g);
          if (symbolMatches) {
            symbolMatches.forEach(symbol => {
              symbols.add(symbol);
              console.log(`記号検出: 行${rowIndex + 1}, 列${cellIndex + 1}, セル内容: "${cell}", 記号: "${symbol}"`);
            });
          }
        }
      });
    });

    // 1行目（ヘッダー行）からアレルギー項目を検出
    if (csvData.length > 0) {
      const headerRow = csvData[0]; // 1行目
      headerRow.forEach((header, index) => {
        if (typeof header === 'string') {
          const allergen = standardAllergens.find(a => 
            header.includes(a.name) || a.name.includes(header) ||
            // カタカナ表記も対応
            (header.includes('ｵﾚﾝｼﾞ') && a.slug === 'orange') ||
            (header.includes('ｷｳｲﾌﾙｰﾂ') && a.slug === 'kiwi') ||
            (header.includes('ｾﾞﾗﾁﾝ') && a.slug === 'gelatin') ||
            (header.includes('ｶｼｭｰﾅｯﾂ') && a.slug === 'cashew') ||
            (header.includes('ｱｰﾓﾝﾄﾞ') && a.slug === 'almond')
          );
          if (allergen) {
            allergens.push({ ...allergen, columnIndex: index });
            console.log(`アレルギー項目検出: 列${index + 1}, ヘッダー: "${header}", 項目: ${allergen.name}`);
          }
        }
      });
    }

    console.log('検出された記号:', Array.from(symbols));
    setDetectedSymbols(symbols);
    setDetectedAllergens(allergens);
  }, [csvData]);

  const handleSymbolMappingChange = (symbol, value) => {
    setLocalRules(prev => ({
      ...prev,
      symbolMappings: {
        ...prev.symbolMappings,
        [symbol]: value
      }
    }));
  };

  const handleAllergenOrderChange = (index, newSlug) => {
    const newOrder = [...localRules.allergenOrder];
    newOrder[index] = newSlug;
    setLocalRules(prev => ({
      ...prev,
      allergenOrder: newOrder
    }));
  };

  const handleOutputLabelChange = (type, value) => {
    setLocalRules(prev => ({
      ...prev,
      outputLabels: {
        ...prev.outputLabels,
        [type]: value
      }
    }));
  };

  const addSymbolMapping = () => {
    const symbol = prompt('新しい記号を入力してください:');
    if (symbol && !localRules.symbolMappings[symbol]) {
      setLocalRules(prev => ({
        ...prev,
        symbolMappings: {
          ...prev.symbolMappings,
          [symbol]: 'none'
        }
      }));
    }
  };

  const removeSymbolMapping = (symbol) => {
    setLocalRules(prev => {
      const newMappings = { ...prev.symbolMappings };
      delete newMappings[symbol];
      return {
        ...prev,
        symbolMappings: newMappings
      };
    });
  };

  const handleSave = () => {
    onRulesChange(localRules);
    onNext();
  };

  const resetToDefaults = () => {
    setLocalRules(rules);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          変換ルール設定
        </h2>
        <p className="text-gray-600">
          企業別の記号マッピングとアレルギー項目の順序を設定してください
        </p>
      </div>

      {/* 検出された記号とアレルギー項目 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🔍 検出された記号
          </h3>
          {detectedSymbols.size > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Array.from(detectedSymbols).map(symbol => (
                <span key={symbol} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {symbol}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-blue-700 text-sm">記号が検出されませんでした</p>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            🏷️ 検出されたアレルギー項目
          </h3>
          {detectedAllergens.length > 0 ? (
            <div className="space-y-1">
              {detectedAllergens.map((allergen, index) => (
                <div key={index} className="text-sm text-green-800">
                  {allergen.name} ({allergen.slug})
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-700 text-sm">アレルギー項目が検出されませんでした</p>
          )}
        </div>
      </div>

      {/* 記号マッピング設定 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            記号マッピング設定
          </h3>
          <button
            onClick={addSymbolMapping}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>追加</span>
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(localRules.symbolMappings).map(([symbol, value]) => (
            <div key={symbol} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 text-center">
                <span className="text-2xl font-mono">{symbol}</span>
              </div>
              <div className="flex-1">
                <select
                  value={value}
                  onChange={(e) => handleSymbolMappingChange(symbol, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="direct">ふくむ</option>
                  <option value="trace">コンタミ</option>
                  <option value="none">ふくまない</option>
                  <option value="unused">未使用</option>
                </select>
              </div>
              <button
                onClick={() => removeSymbolMapping(symbol)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* アレルギー項目順序設定 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          アレルギー項目順序設定
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {localRules.allergenOrder.map((slug, index) => {
            const allergen = standardAllergens.find(a => a.slug === slug);
            return (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-8 text-sm text-gray-500">{index + 1}</span>
                <select
                  value={slug}
                  onChange={(e) => handleAllergenOrderChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  {standardAllergens.map(allergen => (
                    <option key={allergen.slug} value={allergen.slug}>
                      {allergen.name} ({allergen.slug})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* 出力ラベル設定 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          出力ラベル設定
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(localRules.outputLabels).map(([type, value]) => (
            <div key={type}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'direct' && 'ふくむ'}
                {type === 'trace' && 'コンタミ'}
                {type === 'none' && 'ふくまない'}
                {type === 'unused' && '未使用'}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleOutputLabelChange(type, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center justify-between">
        <button
          onClick={resetToDefaults}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <FiRotateCcw className="w-4 h-4" />
          <span>デフォルトに戻す</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
        >
          <FiSave className="w-4 h-4" />
          <span>ルールを保存して次へ</span>
        </button>
      </div>
    </div>
  );
};

export default CsvRuleEditor;
