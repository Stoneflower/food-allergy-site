import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit3, FiSave, FiRotateCcw } from 'react-icons/fi';

const CsvRuleEditor = ({ csvData, rules, onRulesChange, onNext }) => {
  // デフォルトのallergenOrderを指定された順序に設定
  const defaultAllergenOrder = [
    'wheat',      // 1. 小麦
    'buckwheat',  // 2. そば
    'egg',        // 3. 卵
    'milk',       // 4. 乳
    'peanut',     // 5. 落花生
    'shrimp',     // 6. えび
    'crab',       // 7. かに
    'walnut',     // 8. くるみ
    'abalone',    // 9. あわび
    'squid',      // 10. いか
    'salmon_roe', // 11. いくら
    'orange',     // 12. オレンジ
    'kiwi',       // 13. キウイフルーツ
    'beef',       // 14. 牛肉
    'salmon',     // 15. さけ
    'mackerel',   // 16. さば
    'soy',        // 17. 大豆
    'chicken',    // 18. 鶏肉
    'pork',       // 19. 豚肉
    'macadamia',  // 20. マカダミア
    'peach',      // 21. もも
    'yam',        // 22. やまいも
    'apple',      // 23. りんご
    'gelatin',    // 24. ゼラチン
    'banana',     // 25. バナナ
    'sesame',     // 26. ごま
    'cashew',     // 27. カシューナッツ
    'almond',     // 28. アーモンド
    'unused',     // 29. 使用しない
    'matsutake'   // 30. まつたけ
  ];

  const defaultRules = {
    ...rules,
    // デフォルト順序を使用（CSVから検出された場合は後で上書きされる）
    allergenOrder: defaultAllergenOrder,
    symbolMappings: {
      ...rules.symbolMappings,
      '●': 'direct',
      '🔹': 'none', // デフォルトで🔹を追加
      '★': 'none',
      '☆': 'none',
      '―': 'none'
    },
    outputLabels: {
      direct: 'ふくむ',
      none: 'ふくまない',
      trace: 'コンタミ',
      fragrance: '香料にふくむ',
      unused: '未使用'
    }
  };
  
  const [localRules, setLocalRules] = useState(defaultRules);
  useEffect(() => {
    console.log('[Editor] 親から受領した順序:', rules?.allergenOrder);
  }, [rules?.allergenOrder]);
  const [detectedSymbols, setDetectedSymbols] = useState(new Set());
  const [detectedAllergens, setDetectedAllergens] = useState([]);
  const [manualSymbols, setManualSymbols] = useState(new Set());
  const [newSymbolInput, setNewSymbolInput] = useState('');

  // 親から渡される allergenOrder の変更を即時同期
  // ただし、CSVから順序が検出された場合はCSVの順序を優先
  useEffect(() => {
    if (Array.isArray(rules?.allergenOrder) && rules.allergenOrder.length > 0) {
      // CSVからアレルギー項目が検出されていない場合のみ、親の順序を使用
      if (detectedAllergens.length === 0) {
        setLocalRules(prev => ({
          ...prev,
          allergenOrder: [...rules.allergenOrder]
        }));
      }
    }
  }, [rules?.allergenOrder, detectedAllergens.length]);

  // 標準アレルギー項目
  const standardAllergens = [
    { slug: 'wheat', name: '小麦' },
    { slug: 'buckwheat', name: 'そば' },
    { slug: 'egg', name: '卵' },
    { slug: 'milk', name: '乳' },
    { slug: 'peanut', name: '落花生' },
    { slug: 'shrimp', name: 'えび' },
    { slug: 'crab', name: 'かに' },
    { slug: 'walnut', name: 'くるみ' },
    { slug: 'abalone', name: 'あわび' },
    { slug: 'squid', name: 'いか' },
    { slug: 'salmon_roe', name: 'いくら' },
    { slug: 'orange', name: 'オレンジ' },
    { slug: 'kiwi', name: 'キウイフルーツ' },
    { slug: 'beef', name: '牛肉' },
    { slug: 'salmon', name: 'さけ' },
    { slug: 'mackerel', name: 'さば' },
    { slug: 'soy', name: '大豆' },
    { slug: 'chicken', name: '鶏肉' },
    { slug: 'pork', name: '豚肉' },
    { slug: 'macadamia', name: 'マカダミアナッツ' },
    { slug: 'peach', name: 'もも' },
    { slug: 'yam', name: 'やまいも' },
    { slug: 'apple', name: 'りんご' },
    { slug: 'gelatin', name: 'ゼラチン' },
    { slug: 'banana', name: 'バナナ' },
    { slug: 'sesame', name: 'ごま' },
    { slug: 'cashew', name: 'カシューナッツ' },
    { slug: 'almond', name: 'アーモンド' },
    { slug: 'matsutake', name: 'まつたけ' }
  ];

  // CSVから記号とアレルギー項目を検出
  useEffect(() => {
    if (!csvData || csvData.length === 0) return;

    const symbols = new Set();
    const allergens = [];

    // 最初の数行から記号を検出（商品名列は除外）
    csvData.slice(0, 20).forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        // 商品名列（1列目）は記号検出から除外
        if (cellIndex === 0) return;
        
        if (typeof cell === 'string') {
          // 商品名に含まれる記号を除外してから記号パターンを検出
          const cleanCell = cell.replace(/【|】|／|（|）|＊|・/g, '');
          const symbolMatches = cleanCell.match(/[●○•◎△▲\-▯◇◆□■※★☆🔹―]/gu);
          
          if (symbolMatches) {
            symbolMatches.forEach(symbol => {
              symbols.add(symbol);
              console.log(`記号検出: 行${rowIndex + 1}, 列${cellIndex + 1}, セル内容: "${cell}", 記号: "${symbol}"`);
            });
          } else {
            // 記号が含まれている可能性があるセルをログ出力
            if (cell.includes('△') || cell.includes('●') || cell.includes('○') || cell.includes('◎') || cell.includes('※') || cell.includes('▲')) {
              console.log(`記号候補: 行${rowIndex + 1}, 列${cellIndex + 1}, セル内容: "${cell}"`);
            }
            // △記号の特別なデバッグログ
            if (cell.includes('△')) {
              console.log(`🔍 △記号発見: 行${rowIndex + 1}, 列${cellIndex + 1}, セル内容: "${cell}"`);
            }
            // すべてのセルの内容をログ出力（デバッグ用）
            if (cell.includes('※')) {
              console.log(`※記号発見: 行${rowIndex + 1}, 列${cellIndex + 1}, セル内容: "${cell}"`);
            }
            // 商品名記号のデバッグ
            if (cell.includes('【') || cell.includes('】') || cell.includes('／') || cell.includes('（') || cell.includes('）') || cell.includes('＊') || cell.includes('・')) {
              console.log(`商品名記号発見: 行${rowIndex + 1}, 列${cellIndex + 1}, セル内容: "${cell}"`);
            }
          }
        }
      });
    });

    // 1行目（ヘッダー行）からアレルギー項目を検出
    if (csvData.length > 0) {
      const headerRow = csvData[0]; // 1行目
      headerRow.forEach((rawHeader, index) => {
        // A列（商品名列）はスキップ
        if (index === 0) return;
        if (typeof rawHeader !== 'string') return;
        const header = rawHeader.trim();
        // 空文字・空白のみはスキップ（"" を誤検出しない）
        if (!header) return;

        const allergen = standardAllergens.find(a => 
          header === a.name || header.includes(a.name) || a.name.includes(header) ||
          header === a.slug || header.includes(a.slug) ||
          // カタカナ表記も対応
          (header.includes('ｵﾚﾝｼﾞ') && a.slug === 'orange') ||
          (header.includes('ｷｳｲﾌﾙｰﾂ') && a.slug === 'kiwi') ||
          (header.includes('ｾﾞﾗﾁﾝ') && a.slug === 'gelatin') ||
          (header.includes('ｶｼｭｰﾅｯﾂ') && a.slug === 'cashew') ||
          (header.includes('ｱｰﾓﾝﾄﾞ') && a.slug === 'almond') ||
          (header.includes('マカダミアナッツ') && a.slug === 'macadamia') ||
          // より柔軟なマッチング
          (header.includes('キウイ') && a.slug === 'kiwi') ||
          (header.includes('キウィ') && a.slug === 'kiwi') ||
          (header.includes('ゼラチン') && a.slug === 'gelatin') ||
          (header.includes('カシュー') && a.slug === 'cashew') ||
          (header.includes('アーモンド') && a.slug === 'almond') ||
          (header.includes('マカダミア') && a.slug === 'macadamia') ||
          (header.includes('ごま') && a.slug === 'sesame') ||
          (header.includes('胡麻') && a.slug === 'sesame')
        );
        if (allergen) {
          allergens.push({ ...allergen, columnIndex: index });
          console.log(`アレルギー項目検出: 列${index + 1}, ヘッダー: "${header}", 項目: ${allergen.name}`);
        }
      });
    }

    console.log('検出された記号:', Array.from(symbols));
    setDetectedSymbols(symbols);
    setDetectedAllergens(allergens);
    
    // CSVヘッダー順で初期化し、CSVの順序を最優先にする
    if (allergens.length > 0) {
      const detectedOrder = allergens
        .sort((a, b) => a.columnIndex - b.columnIndex) // 列順でソート
        .map(a => a.slug);

      const uniqueDetected = Array.from(new Set(detectedOrder));
      const standardSlugs = standardAllergens.map(a => a.slug);

      // CSVで検出された順序をベースにする
      let finalOrder = [...uniqueDetected];
      const used = new Set(finalOrder);

      // 標準定義で未出現のものを最後に補完
      standardSlugs.forEach(slug => {
        if (!used.has(slug)) {
          finalOrder.push(slug);
          used.add(slug);
        }
      });

      // unusedを最後に追加（必要に応じて）
      if (!used.has('unused')) {
        finalOrder.push('unused');
      }

      console.log('検出されたアレルギー順序(CSV順):', uniqueDetected);
      console.log('最終的な順序(CSV順+補完):', finalOrder);

      // CSVから順序が検出された場合は、それを優先して設定
      setLocalRules(prev => ({
        ...prev,
        allergenOrder: finalOrder
      }));
    } else {
      // CSVからアレルギー項目が検出されなかった場合は、デフォルト順序を使用
      console.log('CSVからアレルギー項目が検出されませんでした。デフォルト順序を使用します。');
      const hasParentOrder = Array.isArray(rules?.allergenOrder) && rules.allergenOrder.length > 0;
      if (!hasParentOrder) {
        setLocalRules(prev => ({
          ...prev,
          allergenOrder: defaultAllergenOrder
        }));
      }
    }
  }, [csvData]);

  const handleSymbolMappingChange = (symbol, value) => {
    setLocalRules(prev => ({
      ...prev,
      symbolMappings: {
        ...prev.symbolMappings,
        [symbol]: value
      }
    }));
    console.log('🔍 記号マッピング変更:', symbol, '→', value);
  };

  const handleAllergenOrderChange = (index, newSlug) => {
    const newOrder = [...localRules.allergenOrder];
    newOrder[index] = newSlug;
    setLocalRules(prev => ({
      ...prev,
      allergenOrder: newOrder
    }));
    console.log('🔍 アレルギー項目順序変更:', index + 1, '番目 →', newSlug);
  };

  const handleAddManualSymbol = () => {
    const symbol = newSymbolInput.trim();
    if (symbol && !detectedSymbols.has(symbol) && !manualSymbols.has(symbol)) {
      const newManualSymbols = new Set([...manualSymbols, symbol]);
      setManualSymbols(newManualSymbols);
      
      // 手動追加された記号をsymbolMappingsにも追加（デフォルト値: 'none'）
      setLocalRules(prev => ({
        ...prev,
        symbolMappings: {
          ...prev.symbolMappings,
          [symbol]: 'none'
        }
      }));
      
      setNewSymbolInput('');
      console.log('🔍 手動記号追加:', symbol, '→ symbolMappingsに追加');
    }
  };

  const handleRemoveManualSymbol = (symbol) => {
    const newManualSymbols = new Set(manualSymbols);
    newManualSymbols.delete(symbol);
    setManualSymbols(newManualSymbols);
    
    // symbolMappingsからも削除
    setLocalRules(prev => {
      const newMappings = { ...prev.symbolMappings };
      delete newMappings[symbol];
      return {
        ...prev,
        symbolMappings: newMappings
      };
    });
    
    console.log('🔍 手動記号削除:', symbol, '→ symbolMappingsから削除');
  };

  // 表示する記号（検出された記号 + 手動追加記号）
  const allDisplaySymbols = new Set([...detectedSymbols, ...manualSymbols]);

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
    // 手動追加された記号もルールに含める
    const updatedRules = {
      ...localRules,
      manualSymbols: Array.from(manualSymbols),
      // 確実に日本語ラベルを保存
      outputLabels: {
        direct: 'ふくむ',
        none: 'ふくまない',
        trace: 'コンタミ',
        fragrance: '香料にふくむ',
        unused: '未使用'
      }
    };
    console.log('🔍 保存するルール:', updatedRules);
    console.log('🔍 記号マッピング:', updatedRules.symbolMappings);
    console.log('🔍 アレルギー項目順序:', updatedRules.allergenOrder);
    onRulesChange(updatedRules);
    onNext();
  };

  const resetToDefaults = () => {
    setLocalRules({
      ...rules,
      allergenOrder: defaultAllergenOrder
    });
    console.log('🔍 デフォルトにリセット:', defaultAllergenOrder);
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

      {/* 手動記号追加 */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">➕ 手動で記号を追加</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newSymbolInput}
            onChange={(e) => setNewSymbolInput(e.target.value)}
            placeholder="記号を入力（例：△、※）"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            maxLength={1}
          />
          <button
            onClick={handleAddManualSymbol}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-1 text-sm"
          >
            <FiPlus className="w-4 h-4" />
            追加
          </button>
        </div>
        {manualSymbols.size > 0 && (
          <div>
            <p className="text-xs text-blue-600 mb-2">手動追加された記号:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(manualSymbols).map(symbol => (
                <span
                  key={symbol}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {symbol}
                  <button
                    onClick={() => handleRemoveManualSymbol(symbol)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 検出された記号とアレルギー項目 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🔍 検出された記号
          </h3>
          {allDisplaySymbols.size > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Array.from(allDisplaySymbols).map(symbol => (
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
                  {allergen.name}
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
          {/* 空欄の扱いを明示的に表示 */}
          <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-12 text-center">
              <span className="text-sm text-blue-600 font-medium">空欄</span>
            </div>
            <div className="flex-1">
              <select
                value="none"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              >
                <option value="none">ふくまない</option>
              </select>
            </div>
            <div className="w-8 text-center">
              <span className="text-xs text-blue-600">固定</span>
            </div>
          </div>
          
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
                  <option value="fragrance">香料</option>
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
            const displayName = slug === 'unused' ? '使用しない' : (allergen ? allergen.name : slug);
            return (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-8 text-sm text-gray-500">{index + 1}</span>
                <select
                  value={slug}
                  onChange={(e) => handleAllergenOrderChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="unused">使用しない</option>
                  {standardAllergens.map(allergen => (
                    <option key={allergen.slug} value={allergen.slug}>
                      {allergen.name}
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
                {type === 'fragrance' && '香料にふくむ'}
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
