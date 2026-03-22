import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Root from './components/Root';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Root />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

reportWebVitals();
