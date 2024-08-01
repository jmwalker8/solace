import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import {
  getDatabase,
  ref,
  get,
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js';

const firebaseConfig = {
  skibidi,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

const signUp = document.getElementById('signUp');
const googleSignUp = document.getElementById('google-signup-btn');
const errorMessageElement = document.getElementById('error-message');
const errorTextElement = document.getElementById('error-text');
const errorCloseButton = document.getElementById('error-close');

function displayErrorMessage(message) {
  errorTextElement.textContent = message;
  errorMessageElement.style.display = 'flex';
}

function clearErrorMessage() {
  errorTextElement.textContent = '';
  errorMessageElement.style.display = 'none';
}

errorCloseButton.addEventListener('click', clearErrorMessage);

function checkUsernameAvailability(username) {
  return get(ref(database, 'usernames/' + username)).then(
    (snapshot) => !snapshot.exists()
  );
}

signUp.addEventListener('click', (e) => {
  e.preventDefault();

  var username = document.getElementById('username').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  clearErrorMessage();

  console.log('Starting user creation process...');
  console.log('Username:', username);
  console.log('Email:', email);

  checkUsernameAvailability(username)
    .then((isAvailable) => {
      if (!isAvailable) {
        throw new Error('Username already taken');
      }
      console.log('Username is available');
      return createUserWithEmailAndPassword(auth, email, password);
    })
    .then((userCredential) => {
      console.log('User account created successfully');
      const user = userCredential.user;
      return sendEmailVerification(user).then(() => user);
    })
    .then((user) => {
      console.log('Verification email sent');
      // Store user data in localStorage temporarily
      const pendingUser = {
        uid: user.uid,
        email: email,
        username: username,
      };
      console.log('Storing pending user data:', pendingUser);
      localStorage.setItem('pendingUser', JSON.stringify(pendingUser));
      window.location.href = `email_verification.html?email=${encodeURIComponent(
        email
      )}`;
    })
    .catch((error) => {
      console.error('Error:', error);
      displayErrorMessage(error.message);
    });
});

function handleGoogleSignUp() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log('Google sign-in successful');

      if (user.emailVerified) {
        // Generate a random username for Google users
        const randomUsername =
          'user_' + Math.random().toString(36).substr(2, 9);

        // Check if the random username is available
        return checkUsernameAvailability(randomUsername).then((isAvailable) => {
          if (!isAvailable) {
            throw new Error('Username generation failed. Please try again.');
          }
          return { user, username: randomUsername };
        });
      } else {
        throw new Error(
          'Email not verified. Please verify your email with Google.'
        );
      }
    })
    .then(({ user, username }) => {
      // Store user data in localStorage temporarily
      const pendingUser = {
        uid: user.uid,
        email: user.email,
        username: username,
      };
      console.log('Storing pending Google user data:', pendingUser);
      localStorage.setItem('pendingUser', JSON.stringify(pendingUser));
      window.location.href = 'email_verification.html';
    })
    .catch((error) => {
      console.error('Google sign-up error:', error);
      displayErrorMessage(error.message);
    });
}

googleSignUp.addEventListener('click', handleGoogleSignUp);

document.addEventListener('DOMContentLoaded', function () {
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('password-toggle');
  const showPasswordIcon = document.getElementById('show-password');
  const hidePasswordIcon = document.getElementById('hide-password');
  const passwordStrength = document.getElementById('password-strength');
  const form = document.getElementById('registerForm');

  const forbiddenSymbols = /[@#$%^&*()+\-~`=\[\]{};':"\\|,.<>\/?]+/;

  usernameInput.addEventListener('input', function (e) {
    const value = e.target.value;
    const match = value.match(forbiddenSymbols);
    if (match) {
      const forbiddenSymbol = match[0];
      displayErrorMessage(
        `Symbol "${forbiddenSymbol}" is not allowed in username`
      );
      e.target.value = value.replace(forbiddenSymbols, '');
    } else {
      clearErrorMessage();
    }
  });

  form.addEventListener('submit', function (e) {
    if (forbiddenSymbols.test(usernameInput.value)) {
      e.preventDefault();
      displayErrorMessage(
        'Please remove forbidden symbols from username before submitting'
      );
    }
  });

  // Clear error styling on input
  usernameInput.addEventListener('input', function () {
    this.classList.remove('input-error');
  });

  emailInput.addEventListener('input', function () {
    this.classList.remove('input-error');
  });

  // Password visibility toggle
  passwordToggle.addEventListener('click', function () {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      showPasswordIcon.style.display = 'none';
      hidePasswordIcon.style.display = 'inline-block';
    } else {
      passwordInput.type = 'password';
      showPasswordIcon.style.display = 'inline-block';
      hidePasswordIcon.style.display = 'none';
    }
  });

  // Password strength checker
  passwordInput.addEventListener('input', function () {
    const password = this.value;
    let strength = 0;
    let status = '';

    if (password.length >= 8) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[!@#$%^&*]+/)) strength += 1;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;

    switch (strength) {
      case 0:
      case 1:
        status = 'Weak';
        passwordStrength.className = 'password-strength weak';
        break;
      case 2:
      case 3:
        status = 'Medium';
        passwordStrength.className = 'password-strength medium';
        break;
      case 4:
        status = 'Strong';
        passwordStrength.className = 'password-strength strong';
        break;
      case 5:
        status = 'Excellent';
        passwordStrength.className = 'password-strength excellent';
        break;
    }

    passwordStrength.textContent = status;
  });
});

// Ensure password visibility toggle works even if clicked before DOMContentLoaded
document
  .getElementById('password-toggle')
  .addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    const showPasswordIcon = document.getElementById('show-password');
    const hidePasswordIcon = document.getElementById('hide-password');

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      showPasswordIcon.style.display = 'none';
      hidePasswordIcon.style.display = 'inline-block';
    } else {
      passwordInput.type = 'password';
      showPasswordIcon.style.display = 'inline-block';
      hidePasswordIcon.style.display = 'none';
    }
  });
