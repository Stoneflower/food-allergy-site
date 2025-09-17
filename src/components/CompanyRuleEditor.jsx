import React, { useState, useEffect } from 'react';

const defaultOrder = ['卵','乳','小麦','そば','落花生','えび','かに','くるみ','アーモンド','あわび','いか','いくら','オレンジ','カシューナッツ','キウイフルーツ','牛肉','ゼラチン','ごま','さけ','さば','大豆','鶏肉','バナナ','豚肉','まつたけ','もも','やまいも','りんご'];
const defaultMarks = { '●': 'direct', '○': 'trace', '△': 'trace', '－': 'none' };

const CompanyRuleEditor = ({ companyName, onCompanyNameChange, rules, onChangeRules }) => {
  const [localCompany, setLocalCompany] = useState(companyName || '');
  const [order, setOrder] = useState(rules?.allergen_order || defaultOrder);
  const [marks, setMarks] = useState(rules?.mark_mapping || defaultMarks);

  useEffect(() => { setLocalCompany(companyName || ''); }, [companyName]);

  const updateRule = () => {
    onChangeRules && onChangeRules({ allergen_order: order, mark_mapping: marks });
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
          <label className="text-sm text-gray-700">記号マッピング（例: ●→direct, ○/△→trace, －→none）</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.keys(marks).map(k => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-8 text-center border rounded">{k}</span>
                <select value={marks[k]} onChange={(e)=>handleMarkChange(k, e.target.value)} className="flex-1 px-2 py-1 border rounded">
                  <option value="direct">direct</option>
                  <option value="trace">trace</option>
                  <option value="none">none</option>
                </select>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-700">アレルゲン順（必要に応じて編集）</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {order.map((name, i) => (
              <input key={i} type="text" value={name} onChange={(e)=>handleOrderChange(i, e.target.value)} className="px-2 py-1 border rounded" />
            ))}
          </div>
        </div>
        <button onClick={updateRule} className="w-full py-2 bg-orange-500 text-white rounded hover:bg-orange-600">ルールを適用</button>
      </div>
    </div>
  );
};

export default CompanyRuleEditor;
