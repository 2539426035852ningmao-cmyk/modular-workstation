import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

document.documentElement.lang = navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
const root = document.getElementById('root');
if (!root) throw new Error('Application root not found');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
