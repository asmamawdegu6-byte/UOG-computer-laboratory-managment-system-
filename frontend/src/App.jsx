import React, { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { testConnection } from './services/connectionTest';
import NotificationToast from './components/ui/NotificationToast';
import './App.css';

function App() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Test connection when app loads
    const checkConnection = async () => {
      console.log('🔄 Testing backend connection...');
      const result = await testConnection();
      setConnectionStatus(result);
      setIsChecking(false);

      if (result.success) {
        console.log('✅ Backend connected successfully!');
      } else {
        console.warn('⚠️ Backend connection issue:', result.message);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="app">
      {/* Connection Status Banner */}
      {!isChecking && connectionStatus && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: connectionStatus.success ? '#d4edda' : '#f8d7da',
            color: connectionStatus.success ? '#155724' : '#721c24',
            textAlign: 'center',
            fontSize: '14px',
            borderBottom: '1px solid'
          }}
        >
          {connectionStatus.success
            ? `✅ Server Connected - ${connectionStatus.data?.timestamp || ''}`
            : `❌ Server Disconnected - ${connectionStatus.message}`
          }
        </div>
      )}
      <AppRoutes />
      <NotificationToast />
    </div>
  );
}

export default App;
