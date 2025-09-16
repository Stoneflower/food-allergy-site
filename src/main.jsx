import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initPaddleOCR } from './ocr/paddle.js';

// PaddleOCRを事前初期化（あってもなくても動く設計）
initPaddleOCR().finally(() => {
createRoot(document.getElementById('root')).render(
<StrictMode>
    <App />
</StrictMode>
);
});