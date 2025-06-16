import React from 'react';
import HomePage from './pages';
import ErrorBoundary from './components/UI/ErrorBoundary';

function sendTestMessageToTheme() {
  try {
    const message = {
      type: "TEST_CONNECTION"
    };

    console.debug("[Test] Preparing to send test message to parent...");
    console.debug("[Test] Message object:", message);
    console.debug("[Test] window.top === window:", window.top === window);

    window.top?.postMessage(message, "*"); // NOTE: "*" only for testing
    console.debug("[Test] Message sent successfully.");
  } catch (err) {
    console.error("[Test] Failed to post message:", err);
  }
}

function DebugTestButton() {
  return (
    <button
      onClick={sendTestMessageToTheme}
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        padding: '6px 10px',
        backgroundColor: '#333',
        color: 'white',
        fontSize: '12px',
        zIndex: 9999,
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      🔄 Send Test Msg
    </button>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HomePage />
      <DebugTestButton />
    </ErrorBoundary>
  );
}

export default App; 