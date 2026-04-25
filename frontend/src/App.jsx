import React, { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import NotificationToast from './components/ui/NotificationToast';
import './App.css';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Simple delay to ensure UI renders
    const timer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f1f5f9'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <AppRoutes />
      <NotificationToast />
    </div>
  );
}

export default App;