import React from 'react';
import AppRouter from './AppRouter';
import { UserProvider } from './context/userContext';

const App = () => (
  <UserProvider>
    <AppRouter />
  </UserProvider>
);

export default App;