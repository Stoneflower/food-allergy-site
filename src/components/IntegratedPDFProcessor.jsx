import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiFileText, FiSettings, FiCheckCircle, FiAlertCircle, FiDownload } from 'react-icons/fi';
import Tesseract from 'tesseract.js';
import CsvConversionPreview from './CsvConversionPreview';
import CsvRuleEditor from './CsvRuleEditor';
import CSVExporter from './CSVExporter';
import CsvUpload from './CsvUpload';

const IntegratedPDFProcessor = () => {
  const [step, setStep] = useState(1); // 1: CSVアップロード, 2: OCR処理, 3: ルール設定, 4: プレビュー, 5: エクスポート
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState([]);
  const [ocrResults, setOcrResults] = useState([]);
  const [rules, setRules] = useState({
    allergenOrder: [
      'egg', 'milk', 'wheat', 'buckwheat', 'peanut', 'shrimp', 'crab', 'walnut', 'soy',
      'beef', 'pork', 'chicken', 'salmon', 'mackerel', 'abalone', 'squid', 'salmon_roe',
      'orange', 'kiwi', 'banana', 'apple', 'peach', 'yam', 'matsutake', 'cashew',
      'almond', 'macadamia', 'brazil_nut', 'unused'
    ],
    symbolMappings: {
      '○': 'safe',
      '×': 'unsafe',
      '△': 'caution',
      '●': 'unsafe',
      '▲': 'caution'
    }
  });
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // CSVから画像URLを抽出
  const extractImagesFromCSV = async (csvData) => {
    const images = [];
    
    csvData.forEach((row, index) => {
      // CSVの各列から画像URLを探す
      Object.values(row).forEach(value => {
        if (typeof value === 'string' && (
          value.includes('http') && 
          (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.gif'))
        )) {
          images.push({
            url: value,
            rowIndex: index,
            originalData: row
          });
        }
      });
    });
    
    return images;
  };

  // OCR処理
  const processImagesWithOCR = async (images) => {
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
      setProgress((i / images.length) * 100);
      
      try {
        const result = await Tesseract.recognize(images[i].url, 'jpn+eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(((i + m.progress) / images.length) * 100);
            }
          }
        });
        
        results.push({
          rowIndex: images[i].rowIndex,
          originalData: images[i].originalData,
          text: result.data.text,
          confidence: result.data.confidence,
          imageUrl: images[i].url
        });
      } catch (error) {
        console.error(`画像${i + 1}のOCR処理エラー:`, error);
        results.push({
          rowIndex: images[i].rowIndex,
          originalData: images[i].originalData,
          text: '',
          confidence: 0,
          error: error.message,
          imageUrl: images[i].url
        });
      }
    }
    
    return results;
  };

  // OCR結果をCSV形式に変換
  const convertOcrToCSV = (ocrResults) => {
    const csvData = [];
    
    ocrResults.forEach(result => {
      if (result.text) {
        // 元のCSVデータをベースに、OCR結果を追加
        const newRow = {
          ...result.originalData,
          ocr_text: result.text,
          ocr_confidence: result.confidence,
          image_url: result.imageUrl
        };
        
        csvData.push(newRow);
      }
    });
    
    return csvData;
  };

  // CSV処理のメイン関数
  const handleCsvProcessing = async (csvData) => {
    if (!csvData || csvData.length === 0) return;
    
    setCsvFile(csvData);
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      // 1. CSVから画像URLを抽出
      setProgress(10);
      const images = await extractImagesFromCSV(csvData);
      
      if (images.length === 0) {
        setError('CSVに画像URLが見つかりませんでした');
        return;
      }
      
      // 2. OCR処理
      setProgress(20);
      const ocrResults = await processImagesWithOCR(images);
      setOcrResults(ocrResults);
      
      // 3. CSV形式に変換
      setProgress(90);
      const processedCsvData = convertOcrToCSV(ocrResults);
      setCsvData(processedCsvData);
      
      setProgress(100);
      setStep(3); // ルール設定ステップに進む
      
    } catch (error) {
      console.error('CSV処理エラー:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // CSVインポートハンドラー
  const handleCsvImport = (csvData) => {
    setCsvData(csvData);
    setStep(2); // OCR処理ステップに進む
  };

  // ファイル選択ハンドラー
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (inputType === 'pdf' && file && file.type === 'application/pdf') {
      handlePDFUpload(file);
    } else if (inputType === 'csv' && file && file.name.toLowerCase().endsWith('.csv')) {
      // CSVファイルの処理はCsvUploadコンポーネントで行う
      setError('CSVファイルはドラッグ&ドロップエリアを使用してください');
    } else {
      setError(`${inputType.toUpperCase()}ファイルを選択してください`);
    }
  };

  // ステップ別のレンダリング
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <FiUpload className="mx-auto text-6xl text-blue-500 mb-6" />
            <h2 className="text-2xl font-bold mb-4">ファイルをアップロード</h2>
            <p className="text-gray-600 mb-6">
              アレルギー情報を含むPDFメニューまたはCSVファイルをアップロードしてください
            </p>
            
            {/* ファイルタイプ選択 */}
            <div className="mb-6">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setInputType('pdf')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    inputType === 'pdf'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FiFileText className="inline mr-2" />
                  PDFファイル
                </button>
                <button
                  onClick={() => setInputType('csv')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    inputType === 'csv'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FiUpload className="inline mr-2" />
                  CSVファイル
                </button>
              </div>
            </div>
            
            {inputType === 'pdf' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  PDFファイルを選択
                </button>
                
                {pdfFile && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">
                      選択されたファイル: {pdfFile.name}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <CsvUpload onUpload={handleCsvImport} />
            )}
          </div>
        );
        
      case 2:
        return (
          <CsvRuleEditor
            csvData={csvData}
            rules={rules}
            onRulesChange={setRules}
            onNext={() => setStep(3)}
          />
        );
        
      case 3:
        return (
          <CsvConversionPreview
            csvData={csvData}
            rules={rules}
            onConversion={(convertedData) => {
              setCsvData(convertedData);
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        );
        
      case 4:
        return (
          <CSVExporter
            data={csvData}
            onBack={() => setStep(3)}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            統合PDF処理システム
          </h1>
          <p className="text-center text-gray-600">
            PDF → OCR → CSV → プレビュー → アップロード
          </p>
        </div>
        
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>ステップ {step} / 4</span>
            {isProcessing && <span>{Math.round(progress)}%</span>}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
        
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <FiAlertCircle className="inline mr-2" />
            {error}
          </div>
        )}
        
        {/* 処理中表示 */}
        {isProcessing && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2" />
              PDFを処理中... {Math.round(progress)}%
            </div>
          </div>
        )}
        
        {/* メインコンテンツ */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </div>
    </div>
  );
};

export default IntegratedPDFProcessor;
