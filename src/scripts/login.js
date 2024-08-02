import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getDatabase,
  set,
  ref,
  update,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

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

const loginButton = document.getElementById('login');
const errorMessageElement = document.getElementById('error-message');
const errorTextElement = document.getElementById('error-text');
const errorCloseButton = document.getElementById('error-close');
const forgotPass = document.getElementById('forgot-password');

function displayErrorMessage(message) {
  errorTextElement.textContent = message;
  errorMessageElement.style.display = 'flex';
}

function clearErrorMessage() {
  errorTextElement.textContent = '';
  errorMessageElement.style.display = 'none';
}

errorCloseButton.addEventListener('click', clearErrorMessage);

loginButton.addEventListener('click', (e) => {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password-input').value;

  clearErrorMessage();

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const dt = new Date();
      const user = userCredential.user;
      update(ref(database, 'users/' + user.uid), {
        last_login: dt,
      });
      window.location.href = '../logged.html';
    })
    .catch((error) => {
      const errorCode = error.code;
      let errorMessage;

      switch (errorCode) {
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMessage = 'Incorrect username or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage =
            'Too many failed login attempts. Please try again later.';
          break;
        default:
          errorMessage = 'An error occurred. Please try again.';
      }

      displayErrorMessage(errorMessage);
      document.getElementById('password-input').value = ''; // Clear the password field on error
    });
});

const email = document.getElementById('email').value;

const forgotPassword = () => {
  const email = document.getElementById('email').value;
  if (!email) {
    displayErrorMessage('Please enter your email address.');
    return;
  }
  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert('A password reset link has been sent to your email.');
    })
    .catch((error) => {
      console.log(error.code);
      console.log(error.message);
      displayErrorMessage(
        'Failed to send password reset email. Please try again.'
      );
    });
};

document.getElementById('forgot-password').addEventListener('click', (e) => {
  e.preventDefault();
  forgotPassword();
});
// Add this to handle Enter key press on the login button
loginButton.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.target.click();
  }
});
