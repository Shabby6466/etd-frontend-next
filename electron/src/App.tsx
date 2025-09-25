import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import DataInputScreen from './screens/DataInputScreen';
import './App.css';

// Make sure React and ReactDOM are properly imported
declare global {
  interface Window {
    electronAPI?: any;
  }
}

export type Screen = 'login' | 'data-input';

export interface User {
  email: string;
  role: string;
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
        />
      )}
    </div>
  );
}

export default App;
