import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <div style={{
        padding: '20px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h1>Examination System</h1>
        <p>Testing background image...</p>
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;