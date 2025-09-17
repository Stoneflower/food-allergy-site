import React, { useEffect, useMemo } from 'react';

const normalizeSpace = (s) => (s || '').replace(/[\u3000\s]+/g, ' ').trim();

// 列アンカーを見つける: 見出し候補(アレルゲン名)のx座標をクラスタして列順を決める
function detectColumns(pages, order) {
  if (!pages || !order || order.length === 0) return [];
  const anchors = [];
  for (const p of pages) {
    for (const it of p.items || []) {
      const t = normalizeSpace(it.str);
      if (order.includes(t)) anchors.push({ x: it.x, text: t });
    }
  }
  if (anchors.length === 0) return [];
  // x座標でソートし、近傍をマージ
  anchors.sort((a,b)=>a.x-b.x);
  const cols = [];
  const TH = 8; // 近傍しきい値(px)
  for (const a of anchors) {
    const last = cols[cols.length-1];
    if (last && Math.abs(last.x - a.x) <= TH) {
      last.samples.push(a.x);
      last.x = last.samples.reduce((s,v)=>s+v,0)/last.samples.length;
      last.labels.add(a.text);
    } else {
      cols.push({ x: a.x, samples: [a.x], labels: new Set([a.text]) });
    }
  }
  // 左→右で確定
  return cols.map(c => ({ x: c.x }));
}

// 行を作る: y座標近接でグルーピング
function groupRows(items) {
  const rows = [];
  const sorted = [...items].sort((a,b)=>b.y-a.y); // 上から下へ
  const THY = 6;
  for (const it of sorted) {
    const r = rows.find(row => Math.abs(row.y - it.y) <= THY);
    if (r) {
      r.items.push(it); r.y = (r.y * r.items.length + it.y) / (r.items.length + 1);
    } else {
      rows.push({ y: it.y, items: [it] });
    }
  }
  // 上→下に並び替え
  rows.sort((a,b)=>b.y-a.y);
  return rows;
}

// アイテムを最も近い列にスナップ
function snapRowToColumns(row, columns) {
  const cells = columns.map(()=>[]);
  for (const it of row.items) {
    let best = 0; let bestD = Infinity;
    for (let ci=0; ci<columns.length; ci++) {
      const d = Math.abs(columns[ci].x - it.x);
      if (d < bestD) { bestD = d; best = ci; }
    }
    cells[best].push(it);
  }
  return cells.map(cs => normalizeSpace(cs.map(c=>c.str).join(' ')));
}

const normalizeMark = (raw, markMap) => {
  const s = normalizeSpace(raw).replace(/[—ー–-]/g, '－');
  if (!s) return '';
  // 優先: 完全一致
  if (markMap && markMap[s] != null) return markMap[s];
  // よくある揺らぎ
  if (/^([●■◆⬤])$/.test(s)) return 'direct';
  if (/^([○◯〇◎△※])$/.test(s)) return 'trace';
  if (/^(－|―|ー|−|なし|無)$/.test(s)) return 'none';
  return s;
};

const ConversionPreview = ({ rawText, pdfItems, rules, rows, onRowsChange }) => {
  const parsed = useMemo(() => {
    if (!rules) return { headers: [], rows: [] };
    const order = rules.allergen_order || [];
    const headers = ['メニュー名', ...order];

    // 座標あり → 位置合わせパース
    if (pdfItems?.pages?.length) {
      // 列を検出
      const columns = detectColumns(pdfItems.pages, order);
      if (columns.length >= order.length) {
        const out = [];
        for (const p of pdfItems.pages) {
          const rowGroups = groupRows(p.items);
          for (const rg of rowGroups) {
            const snapped = snapRowToColumns(rg, columns);
            // 先頭トークンをメニュー名、以降を各列として扱う（不足はスキップ）
            const rec = { 'メニュー名': snapped[0] || '' };
            order.forEach((allergen, i) => {
              const cell = snapped[i+1] || '';
              rec[allergen] = normalizeMark(cell, rules.mark_mapping);
            });
            // メニュー名といずれかの列に値がある行のみ採用
            const anyVal = Object.keys(rec).some(k => k !== 'メニュー名' && rec[k]);
            if (rec['メニュー名'] && anyVal) out.push(rec);
          }
        }
        return { headers, rows: out };
      }
    }

    // フォールバック: テキスト行の簡易分割
    const lines = (rawText || '').split(/\n+/).map(l => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const name = parts[0];
      const rec = { 'メニュー名': name };
      order.forEach((a, i) => { rec[a] = normalizeMark(parts[i+1] || '', rules.mark_mapping); });
      const anyVal = Object.keys(rec).some(k => k !== 'メニュー名' && rec[k]);
      if (rec['メニュー名'] && anyVal) out.push(rec);
    }
    return { headers, rows: out };
  }, [rawText, JSON.stringify(pdfItems), JSON.stringify(rules)]);

  useEffect(() => {
    if (parsed.rows.length > 0 && onRowsChange) onRowsChange(parsed.rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.headers.join(','), parsed.rows.length]);

  const headers = parsed.headers.length ? parsed.headers : (rows[0] ? Object.keys(rows[0]) : []);
  const tableRows = rows && rows.length ? rows : parsed.rows;

  const editCell = (ri, key, val) => {
    const next = tableRows.map((r, i) => i === ri ? { ...r, [key]: val } : r);
    onRowsChange && onRowsChange(next);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border">
      <h3 className="font-semibold mb-2">プレビュー & 編集</h3>
      {headers.length === 0 ? (
        <p className="text-sm text-gray-500">PDFを読み込み、ルールを適用するとプレビューが表示されます。</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                {headers.map(h => (
                  <th key={h} className="border px-2 py-1 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {headers.map((h, j) => (
                    <td key={j} className="border px-2 py-1">
                      <input
                        value={r[h] ?? ''}
                        onChange={(e)=>editCell(i, h, e.target.value)}
                        className="w-full px-1 py-0.5 border rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConversionPreview;
