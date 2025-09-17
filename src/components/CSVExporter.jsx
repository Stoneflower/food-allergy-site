import React from 'react';

const CSVExporter = ({ companyName, rules, rows }) => {
  const download = () => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')].concat(
      rows.map(r => headers.map(h => {
        const v = r[h] ?? '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${companyName || 'export'}_allergy.csv`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border">
      <h3 className="font-semibold mb-2">CSVエクスポート</h3>
      <button onClick={download} disabled={!rows || rows.length===0} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">CSVをダウンロード</button>
    </div>
  );
};

export default CSVExporter;
