import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA3V8kM0CKK5SiQGu1EOaV7kCeowl1cRCI',
  authDomain: 'solace-83466.firebaseapp.com',
  projectId: 'solace-83466',
  storageBucket: 'solace-83466.appspot.com',
  messagingSenderId: '1035507922270',
  appId: '1:1035507922270:web:496b548ba710523eb18bcf',
  measurementId: 'G-H8RRCK340M',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();

const googleLogin = document.getElementById('google-login-btn');
googleLogin.addEventListener('click', function () {
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      console.log(user);
      window.location.href = '../logged.html';
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    });
});
