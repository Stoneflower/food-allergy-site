import React, { useEffect, useMemo } from 'react';

const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim();

const naiveParse = (rawText, rules) => {
  if (!rawText || !rules) return { headers: [], rows: [] };
  const order = rules.allergen_order || [];
  const headers = ['メニュー名', ...order];
  const lines = rawText.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const rows = [];
  // 超簡易: 行にメニュー名 + 記号が並ぶ前提（後で強化）
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const name = parts[0];
    // 記号列をorder長に切り詰め
    const marks = parts.slice(1).slice(0, order.length);
    if (marks.length === 0) continue;
    const rec = { menu: name };
    order.forEach((allergen, i) => {
      const m = marks[i] || '';
      const mapped = rules.mark_mapping?.[m] || '';
      rec[allergen] = mapped;
    });
    rows.push(rec);
  }
  return { headers, rows };
};

const ConversionPreview = ({ rawText, rules, rows, onRowsChange }) => {
  const parsed = useMemo(() => naiveParse(rawText, rules), [rawText, rules]);

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
