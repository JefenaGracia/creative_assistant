// src/utils/auth.js
import { gapi } from 'gapi-script';

// Initialize Google Auth for OAuth
export const initializeGoogleAuth = () => {
  const clientId = "708800444037-5lcmbdl2gdecia44o4iq3nmhr8bhpmm9.apps.googleusercontent.com";

  function start() {
    gapi.auth2.init({
      client_id: clientId,
      scope: 'email profile',
    }).then(() => {
      console.log('Google Auth Initialized');
    }).catch((error) => {
      console.error('Google Auth initialization failed:', error);
    });
  }

  gapi.load('client:auth2', start);
};

// Handle Google Login and retrieve user information
export const handleGoogleLogin = () => {
  const authInstance = gapi.auth2.getAuthInstance();
  if (!authInstance) {
    console.error('Google Auth instance not found');
    return;
  }

  return authInstance.signIn()
    .then((googleUser) => {
      const profile = googleUser.getBasicProfile();
      return {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
      };
    })
    .catch((error) => {
      console.error('Google login failed:', error);
      throw error;
    });
};
