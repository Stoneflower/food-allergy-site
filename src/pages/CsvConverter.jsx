import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CsvUpload from '../components/CsvUpload';
import CsvRuleEditor from '../components/CsvRuleEditor';
import CsvConversionPreview from '../components/CsvConversionPreview';
import CsvExporter from '../components/CSVExporter';

const CsvConverter = () => {
  const [csvData, setCsvData] = useState(null);
  const [rules, setRules] = useState({
    allergenOrder: [
      'egg', 'milk', 'wheat', 'buckwheat', 'peanut', 'shrimp', 'crab', 'walnut',
      'soy', 'beef', 'pork', 'chicken', 'salmon', 'mackerel', 'abalone', 'squid',
      'salmon_roe', 'orange', 'kiwi', 'peach', 'apple', 'yam', 'gelatin', 'banana',
      'cashew', 'sesame', 'almond', 'matsutake'
    ],
    symbolMappings: {
      '●': 'direct',
      '〇': 'direct', 
      '○': 'direct',
      '◎': 'direct',
      '※': 'trace',
      '△': 'none',
      '▲': 'none',
      '-': 'none',
      '×': 'none',
      '': 'none'
    },
    outputLabels: {
      direct: 'direct',
      trace: 'trace', 
      none: 'none',
      unused: 'unused'
    }
  });
  const [convertedData, setConvertedData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Hide from search engines
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const handleCsvUpload = (data) => {
    setCsvData(data);
    setCurrentStep(2);
  };

  const handleRulesChange = (newRules) => {
    setRules(newRules);
  };

  const handleConversion = (data) => {
    setConvertedData(data);
    setCurrentStep(4);
  };

  const steps = [
    { number: 1, title: 'CSVファイル選択', description: '変換したいCSVファイルをアップロード' },
    { number: 2, title: 'ルール設定', description: '企業別の記号マッピングを設定' },
    { number: 3, title: 'プレビュー・編集', description: '変換結果を確認・編集' },
    { number: 4, title: 'CSV出力', description: '正規化されたCSVをダウンロード' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CSV → 正規化CSV 変換
          </h1>
          <p className="text-gray-600">
            企業別のアレルギー表記を統一されたフォーマットに変換します
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-orange-500 border-orange-500 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step.number}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-orange-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-orange-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          {currentStep === 1 && (
            <CsvUpload onUpload={handleCsvUpload} />
          )}
          
          {currentStep === 2 && csvData && (
            <CsvRuleEditor
              csvData={csvData}
              rules={rules}
              onRulesChange={handleRulesChange}
              onNext={() => setCurrentStep(3)}
            />
          )}
          
          {currentStep === 3 && csvData && rules && (
            <CsvConversionPreview
              csvData={csvData}
              rules={rules}
              onConversion={handleConversion}
              onBack={() => setCurrentStep(2)}
            />
          )}
          
          {currentStep === 4 && convertedData && (
            <CsvExporter
              data={convertedData}
              onBack={() => setCurrentStep(3)}
            />
          )}
        </motion.div>

        {/* Info Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 使用方法
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Step 1:</strong> 変換したいCSVファイルをアップロードします</p>
            <p>• <strong>Step 2:</strong> 企業の記号ルール（●、〇、※、△など）を設定します</p>
            <p>• <strong>Step 3:</strong> 変換結果をプレビューして必要に応じて編集します</p>
            <p>• <strong>Step 4:</strong> 正規化されたCSVファイルをダウンロードします</p>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
            <p className="text-sm text-blue-800">
              <strong>出力フォーマット:</strong> direct（含有）、trace（コンタミ）、none（不使用）、unused（未使用）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvConverter;
