import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiFile, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Papa from 'papaparse';

const CsvUpload = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('CSVファイルを選択してください');
      return;
    }

    setFile(file);
    setError(null);
    setLoading(true);

    try {
      const text = await readFileAsText(file);
      
      // デバッグ: 生のテキストの一部を確認
      console.log('=== 生のCSVテキスト（行70-90） ===');
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (index >= 70 && index <= 90) {
          console.log(`生テキスト行${index + 1}:`, {
            content: line,
            length: line.length,
            hasCommas: line.includes(','),
            rawContent: JSON.stringify(line)
          });
        }
      });
      
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        setError('CSVファイルが空です');
        return;
      }

      setCsvData(parsed);
    } catch (err) {
      setError('ファイルの読み込みに失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('ファイル読み込みエラー'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const parseCSV = (text) => {
    // Papa Parseを使用してより確実なCSVパース
    const result = Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8'
    });
    
    if (result.errors.length > 0) {
      console.warn('CSVパースエラー:', result.errors);
    }
    
    // デバッグ: 各行の詳細をログ出力
    console.log('=== CSVパース結果 ===');
    result.data.forEach((row, index) => {
      if (index >= 70 && index <= 90) { // 問題のある行を重点的に確認
        console.log(`行${index + 1}:`, {
          length: row.length,
          content: row,
          firstCell: row[0],
          hasCommas: row[0]?.includes(',')
        });
      }
    });
    
    return result.data;
  };

  const handleUpload = () => {
    if (csvData) {
      onUpload(csvData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          CSVファイルをアップロード
        </h2>
        <p className="text-gray-600">
          変換したいCSVファイルを選択してください
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: dragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            ファイルをドラッグ&ドロップ
          </p>
          <p className="text-gray-500 mb-4">
            または
          </p>
          <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            ファイルを選択
          </button>
        </motion.div>
      </div>

      {/* File Info */}
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <FiFile className="h-8 w-8 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {loading && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            )}
            {csvData && !loading && (
              <FiCheckCircle className="h-6 w-6 text-green-500" />
            )}
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* CSV Preview */}
      {csvData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            CSVプレビュー ({csvData.length}行)
          </h3>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {csvData[0]?.map((header, index) => (
                      <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header || `列${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.length > 5 && (
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-500 text-center">
                他 {csvData.length - 5} 行...
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Upload Button */}
      {csvData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={handleUpload}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            次のステップへ進む
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CsvUpload;
