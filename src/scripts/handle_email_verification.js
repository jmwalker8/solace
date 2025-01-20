import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import {
  getAuth,
  applyActionCode,
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA3V8kM0CKK5SiQGu1EOaV7kCeowl1cRCI',
  authDomain: 'solace-83466.firebaseapp.com',
  projectId: 'solace-83466',
  databaseURL: 'https://solace-83466-default-rtdb.firebaseio.com',
  storageBucket: 'solace-83466.appspot.com',
  messagingSenderId: '1035507922270',
  appId: '1:1035507922270:web:496b548ba710523eb18bcf',
  measurementId: 'G-H8RRCK340M',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Get the action code from the URL.
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const actionCode = urlParams.get('oobCode');

if (mode === 'verifyEmail') {
  applyActionCode(auth, actionCode)
    .then(() => {
      // Email address has been verified.
      console.log('Email verified successfully');
      // Set a flag in localStorage to indicate email has been verified
      localStorage.setItem('emailVerified', 'true');
      // Redirect to email_verified.html
      window.location.href = 'email_verified.html';
    })
    .catch((error) => {
      // Error occurred during verification.
      console.error('Error verifying email:', error);
      alert('Error verifying email. Please try again.');
      window.location.href = 'email_verification.html';
    });
} else {
  // Handle other cases or show error
  console.error('Invalid mode parameter');
  window.location.href = '/email_verification.html';
}
