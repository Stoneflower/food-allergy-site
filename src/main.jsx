import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// PaddleOCRは現在未使用のため、事前初期化を停止
createRoot(document.getElementById('root')).render(
<StrictMode>
    <App />
</StrictMode>
);