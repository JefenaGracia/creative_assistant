import React from 'react';
import './LoginPage.css';

const LoginPage = ({ handleGoogleLogin, error, loading }) => {
  return (
    <div className="login-page">
      <header className="app-header">
        <h1>Creative Assistant</h1>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <>
            {}
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
            <div className="loading">
              <p>Loading...</p>
            </div>
          </>
        ) : (
          <button onClick={handleGoogleLogin} className="google-login-button">
            Login with Google
          </button>
        )}
      </header>
    </div>
  );
};

export default LoginPage;
