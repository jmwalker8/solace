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

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

const statusMessage = document.getElementById('status-message');
const resendButton = document.getElementById('resend-email');
const userEmailElement = document.getElementById('user-email');

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const email = getParameterByName('email');
const username = getParameterByName('username');

if (email) {
  userEmailElement.textContent = email;
}

let cooldownTime = 0;
const COOLDOWN_DURATION = 60; // 60 seconds cooldown

function updateCooldownDisplay() {
  if (cooldownTime > 0) {
    resendButton.textContent = `Resend Email (${cooldownTime}s)`;
    resendButton.disabled = true;
    cooldownTime--;
    setTimeout(updateCooldownDisplay, 1000);
  } else {
    resendButton.textContent = 'Resend Email';
    resendButton.disabled = false;
  }
}

function startCooldown() {
  cooldownTime = COOLDOWN_DURATION;
  updateCooldownDisplay();
}

resendButton.addEventListener('click', () => {
  if (cooldownTime > 0) return;

  const user = auth.currentUser;
  if (user) {
    user
      .sendEmailVerification()
      .then(() => {
        statusMessage.textContent =
          'Verification email sent. Please check your inbox.';
        startCooldown();
      })
      .catch((error) => {
        console.error('Error sending verification email:', error);
        statusMessage.textContent =
          'Error sending verification email. Please try again later.';
      });
  } else {
    statusMessage.textContent =
      'No user signed in. Please try registering again.';
  }
});

auth.onAuthStateChanged((user) => {
  if (user) {
    if (user.emailVerified) {
      statusMessage.textContent = 'Email verified! Redirecting to dashboard...';
      if (username) {
        database
          .ref('usernames/' + username)
          .once('value')
          .then((snapshot) => {
            if (snapshot.exists()) {
              statusMessage.textContent =
                'Username already taken. Please choose a different one.';
            } else {
              return Promise.all([
                database.ref('users/' + user.uid).set({
                  username: username,
                  email: user.email,
                }),
                database.ref('usernames/' + username).set(user.uid),
              ]);
            }
          })
          .then(() => {
            window.location.href = 'community-exploration.html';
          })
          .catch((error) => {
            console.error('Error setting user data:', error);
            statusMessage.textContent = 'Error occurred. Please try again.';
          });
      } else {
        window.location.href = '/community-exploration.html';
      }
    }
  } else {
    statusMessage.textContent =
      'No user signed in. Please try registering again.';
  }
});
