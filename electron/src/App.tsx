import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import DataInputScreen from './screens/DataInputScreen';
import UploadScreen from './screens/UploadScreen';
import './App.css';

// Make sure React and ReactDOM are properly imported
declare global {
  interface Window {
    electronAPI?: any;
  }
}

export type Screen = 'login' | 'data-input' | 'upload';

export interface User {
  email: string;
  role: string;
  locationId?: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentScreen('data-input');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  const handleBack = () => {
    setCurrentScreen('login');
  };

  const handleNavigateToUpload = () => {
    setCurrentScreen('upload');
  };

  const handleBackFromUpload = () => {
    setCurrentScreen('data-input');
  };

  return (
    <div className="App">
      {currentScreen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      {currentScreen === 'data-input' && (
        <DataInputScreen 
          user={user} 
          onLogout={handleLogout}
          onBack={handleBack}
          onNavigateToUpload={handleNavigateToUpload}
        />
      )}
      {currentScreen === 'upload' && (
        <UploadScreen onBack={handleBackFromUpload} user={user} />
      )}
    </div>
  );
}

export default App;
