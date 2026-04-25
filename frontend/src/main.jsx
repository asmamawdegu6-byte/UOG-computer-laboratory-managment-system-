import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CampusProvider } from './contexts/CampusContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

console.log('[DEBUG] main.jsx: Starting application...');

const rootElement = document.getElementById('root');
console.log('[DEBUG] main.jsx: Root element found:', !!rootElement);

if (!rootElement) {
  console.error('[DEBUG] main.jsx: CRITICAL - Root element not found!');
} else {
  console.log('[DEBUG] main.jsx: Root element innerHTML before render:', rootElement.innerHTML);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <CampusProvider>
              <App />
            </CampusProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

console.log('[DEBUG] main.jsx: Render called successfully');
