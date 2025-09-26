import React, { useState, useEffect } from 'react';

const defaultOrder = ['卵','乳','小麦','そば','落花生','えび','かに','くるみ','アーモンド','あわび','いか','いくら','オレンジ','カシューナッツ','キウイフルーツ','牛肉','ゼラチン','ごま','さけ','さば','大豆(soybean)','鶏肉','バナナ','豚肉','まつたけ','もも','やまいも','りんご'];
const defaultMarks = { '●': 'direct', '○': 'trace', '△': 'trace', '※': 'trace', '－': 'none' };
const defaultPresenceLabels = { direct: 'direct', trace: 'trace', none: 'none' };

const aliasDict = {
  '乳': '乳', '乳成分': '乳', 'ミルク': '乳', '牛乳': '乳',
  'さけ': 'さけ', '鮭': 'さけ', 'サーモン': 'さけ',
  '小麦粉': '小麦', '小麦': '小麦',
  'そば粉': 'そば',
  '落花生': '落花生', 'ピーナッツ': '落花生',
  '大豆': '大豆(soybean)', 'ソイ': '大豆(soybean)',
};

const CompanyRuleEditor = ({ companyName, onCompanyNameChange, rules, onChangeRules, pdfItems }) => {
  const [localCompany, setLocalCompany] = useState(companyName || '');
  const [order, setOrder] = useState(rules?.allergen_order || defaultOrder);
  const [marks, setMarks] = useState(rules?.mark_mapping || defaultMarks);
  const [presenceLabels, setPresenceLabels] = useState(rules?.presence_labels || defaultPresenceLabels);

  useEffect(() => { setLocalCompany(companyName || ''); }, [companyName]);

  const updateRule = () => {
    onChangeRules && onChangeRules({ allergen_order: order, mark_mapping: marks, presence_labels: presenceLabels });
  };

  const handleOrderChange = (idx, val) => {
    const next = [...order];
    next[idx] = val;
    setOrder(next);
  };

  const handleMarkChange = (key, val) => {
    const next = { ...marks, [key]: val };
    setMarks(next);
  };

  const autoDetect = () => {
    if (!pdfItems?.pages?.length) return;
    const all = pdfItems.pages.flatMap(p => p.items || []);
    const maxY = Math.max(...all.map(i=>i.y));
    const headerItems = all.filter(i => i.y > maxY * 0.9);
    const byX = headerItems.sort((a,b)=>a.x-b.x).map(i=>i.str.trim()).filter(Boolean);
    const norm = byX.map(t => aliasDict[t] || t);
    const nextOrder = [];
    for (const t of norm) {
      if (defaultOrder.includes(t) && !nextOrder.includes(t)) nextOrder.push(t);
    }
    for (const t of defaultOrder) if (!nextOrder.includes(t)) nextOrder.push(t);
    setOrder(nextOrder);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border">
      <h3 className="font-semibold mb-2">企業ルール</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-700">企業名</label>
          <input
            type="text"
            value={localCompany}
            onChange={(e)=>{ setLocalCompany(e.target.value); onCompanyNameChange && onCompanyNameChange(e.target.value); }}
            className="w-full px-3 py-2 border rounded"
            placeholder="企業名"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">記号マッピング（例: ●→direct, ○/△/※→trace, －→none）</label>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.keys(marks).map(k => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-8 text-center border rounded">{k}</span>
                <select value={marks[k]} onChange={(e)=>handleMarkChange(k, e.target.value)} className="flex-1 px-2 py-1 border rounded">
                  <option value="direct">direct</option>
                  <option value="trace">trace</option>
                  <option value="none">none</option>
                  <option value="">(未使用)</option>
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">※ 〇/△ を使わない場合は「(未使用)」を選択してください。</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-700">アレルゲン順（必要に応じて編集）</label>
            <button onClick={autoDetect} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">PDFから推定</button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {order.map((name, i) => (
              <input key={i} type="text" value={name} onChange={(e)=>handleOrderChange(i, e.target.value)} className="px-2 py-1 border rounded" />
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-700">出力ラベル（CSV/表示向け）</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-14">direct</span>
              <input className="flex-1 px-2 py-1 border rounded" value={presenceLabels.direct}
                onChange={(e)=>setPresenceLabels({ ...presenceLabels, direct: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-14">trace</span>
              <input className="flex-1 px-2 py-1 border rounded" value={presenceLabels.trace}
                onChange={(e)=>setPresenceLabels({ ...presenceLabels, trace: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-14">none</span>
              <input className="flex-1 px-2 py-1 border rounded" value={presenceLabels.none}
                onChange={(e)=>setPresenceLabels({ ...presenceLabels, none: e.target.value })} placeholder="例) 使用しない" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">例: none を「使用しない」に変更できます（びっくりドンキー向け）。</p>
        </div>
        <button onClick={updateRule} className="w-full py-2 bg-orange-500 text-white rounded hover:bg-orange-600">ルールを適用</button>
      </div>
    </div>
  );
};

export default CompanyRuleEditor;
