import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Mount React app if root element exists
const rootElement = document.getElementById('app');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
