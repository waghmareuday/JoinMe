import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRouter from './AppRouter';
import { UserProvider } from './context/userContext';

const App = () => (
  <UserProvider>
    {/* 🟢 The Master Toaster: This catches and displays all toasts across your entire app */}
    <Toaster 
      position="top-center" 
      reverseOrder={false} 
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1e293b', // Slate-800 for a sleek dark look
          color: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '16px 24px',
          fontSize: '15px',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#10b981', // Emerald green
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444', // Ruby red
            secondary: '#fff',
          },
        },
      }}
    />
    <AppRouter />
  </UserProvider>
);

export default App;