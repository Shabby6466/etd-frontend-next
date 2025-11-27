import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import DataInputScreen from './screens/DataInputScreen';
import UploadScreen from './screens/UploadScreen';
import HomeScreen from './screens/HomeScreen';
import './App.css';

// Make sure React and ReactDOM are properly imported
declare global {
  interface Window {
    electronAPI?: any;
  }
}

export type Screen = 'login' | 'home' | 'data-input' | 'upload';

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
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  const handleNavigateToHome = () => {
    setCurrentScreen('home');
  };

  const handleNavigateToDataInput = () => {
    setCurrentScreen('data-input');
  };

  const handleNavigateToUpload = () => {
    setCurrentScreen('upload');
  };

  return (
    <div className="App">
      {currentScreen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      {currentScreen === 'home' && (
        <HomeScreen
          user={user}
          onLogout={handleLogout}
          onNavigateToDataInput={handleNavigateToDataInput}
          onNavigateToUpload={handleNavigateToUpload}
        />
      )}
      {currentScreen === 'data-input' && (
        <DataInputScreen 
          user={user} 
          onLogout={handleLogout}
          onBack={handleNavigateToHome}
          onNavigateToUpload={handleNavigateToUpload}
        />
      )}
      {currentScreen === 'upload' && (
        <UploadScreen onBack={handleNavigateToHome} user={user} />
      )}
    </div>
  );
}

export default App;
