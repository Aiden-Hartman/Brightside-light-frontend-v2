import React from 'react';
import HomePage from './pages';
import ErrorBoundary from './components/UI/ErrorBoundary';
import MobileWarning from './components/UI/MobileWarning';

function App() {
  return (
    <ErrorBoundary>
      <MobileWarning />
      <HomePage />
    </ErrorBoundary>
  );
}

export default App; 