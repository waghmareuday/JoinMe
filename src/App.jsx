import React from 'react';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRouter from './AppRouter';
import { UserProvider } from './context/userContext';
import { ThemeProvider } from './context/themeContext';

const GOOGLE_CLIENT_ID = '288235910182-37h17do7t8d2v60fgturmlicp7kk6phl.apps.googleusercontent.com';

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  <ThemeProvider>
    <UserProvider>
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
  </ThemeProvider>
  </GoogleOAuthProvider>
);

export default App;