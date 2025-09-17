import React, { useState, useEffect } from 'react';
import PDFUpload from '../components/PDFUpload';
import CompanyRuleEditor from '../components/CompanyRuleEditor';
import ConversionPreview from '../components/ConversionPreview';
import CSVExporter from '../components/CSVExporter';

const PdfConverter = () => {
  const [companyName, setCompanyName] = useState('');
  const [rawText, setRawText] = useState('');
  const [rules, setRules] = useState(null); // { allergen_order:[], mark_mapping:{} }
  const [tableRows, setTableRows] = useState([]); // [{menu:"", egg:"－", ...}]

  // 隠しページ: 検索エンジンにインデックスさせない
  useEffect(() => {
    const sel = 'meta[name="robots"]';
    const prev = document.querySelector(sel);
    const prevContent = prev?.getAttribute('content') || '';
    let created = false;
    let el = prev;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      created = true;
    }
    el.setAttribute('content', 'noindex,nofollow');
    if (created) document.head.appendChild(el);
    return () => {
      if (created) {
        document.head.removeChild(el);
      } else if (el) {
        // 元に戻す
        el.setAttribute('content', prevContent);
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">PDF → CSV 変換（企業別アレルギー表）</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PDFUpload onExtract={(text) => setRawText(text)} />
          <CompanyRuleEditor
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            rules={rules}
            onChangeRules={setRules}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <ConversionPreview
            rawText={rawText}
            rules={rules}
            rows={tableRows}
            onRowsChange={setTableRows}
          />
          <CSVExporter
            companyName={companyName}
            rules={rules}
            rows={tableRows}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfConverter;
