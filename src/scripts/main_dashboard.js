import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getDatabase,
  set,
  ref,
  update,
  get,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA3V8kM0CKK5SiQGu1EOaV7kCeowl1cRCI',
  authDomain: 'solace-83466.firebaseapp.com',
  databaseURL: 'https://solace-83466-default-rtdb.firebaseio.com',
  projectId: 'solace-83466',
  storageBucket: 'solace-83466.appspot.com',
  messagingSenderId: '1035507922270',
  appId: '1:1035507922270:web:496b548ba710523eb18bcf',
  measurementId: 'G-H8RRCK340M',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();
const storage = getStorage(app);

const profilePicture = document.getElementById('profile-picture');
const profileCard = document.getElementById('profile-card');
const closeProfileCard = document.getElementById('close-profile-card');
const logoutBtn = document.getElementById('logout-btn');
const changeProfilePictureBtn = document.getElementById(
  'change-profile-picture-btn'
);
const profilePictureInput = document.getElementById('profile-picture-input');
const profileUpdateStatus = document.getElementById('profile-update-status');
const loadingOverlay = document.getElementById('loading-overlay');
const currentProfilePicture = document.getElementById(
  'current-profile-picture'
);

const navLinks = document.querySelectorAll('.profile-card-nav a');
const sections = document.querySelectorAll('.profile-card-content > div');

let loadingTimeout;

function showLoading() {
  loadingOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  loadingTimeout = setTimeout(() => {
    if (loadingOverlay.style.display === 'flex') {
      hideLoading();
      console.error('Loading timeout occurred');
      showUpdateStatus(
        'Loading took too long. Please refresh the page.',
        false
      );
    }
  }, 10000);
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
  document.body.style.overflow = '';
  clearTimeout(loadingTimeout);
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}

function setUserGreeting(user) {
  const greetingElement = document.getElementById('user-greeting');
  if (greetingElement) {
    get(ref(database, 'users/' + user.uid))
      .then((snapshot) => {
        const userData = snapshot.val();
        const name =
          userData?.username ||
          user.displayName ||
          user.email?.split('@')[0] ||
          user.uid;
        const greeting = getTimeBasedGreeting();
        greetingElement.innerHTML = `${greeting}, <span class="username">${name}</span>`;
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        const name = user.displayName || user.email?.split('@')[0] || user.uid;
        const greeting = getTimeBasedGreeting();
        greetingElement.innerHTML = `${greeting}, <span class="username">${name}</span>`;
      });
  } else {
    console.error('user-greeting element not found');
  }
}

function updateUserInfo(user) {
  const fullNameElement = document.getElementById('user-full-name');
  const emailElement = document.getElementById('user-email');
  const joinDateElement = document.getElementById('user-join-date');

  get(ref(database, 'users/' + user.uid))
    .then((snapshot) => {
      const userData = snapshot.val();
      if (fullNameElement)
        fullNameElement.textContent =
          userData?.username || user.displayName || 'Not set';
      if (emailElement) emailElement.textContent = user.email || 'Not set';
      if (joinDateElement) {
        const joinDate = user.metadata.creationTime
          ? new Date(user.metadata.creationTime).toLocaleDateString()
          : 'Unknown';
        joinDateElement.textContent = joinDate;
      }

      if (!fullNameElement || !emailElement || !joinDateElement) {
        console.error('One or more user info elements not found');
      }
    })
    .catch((error) => {
      console.error('Error fetching user data:', error);
    });
}

function preloadProfilePicture(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
}

function loadUserProfilePicture(user) {
  console.log('Loading user profile picture for user:', user.uid);
  const dbRef = ref(database, 'users/' + user.uid + '/profile_picture');
  return get(dbRef)
    .then((snapshot) => {
      console.log('Profile picture snapshot:', snapshot.val());
      const profilePictureUrl = snapshot.exists()
        ? snapshot.val()
        : 'assets/undraw_drink_coffee_v3au.svg';
      console.log('Setting profile picture URL:', profilePictureUrl);
      return preloadProfilePicture(profilePictureUrl).then(() => {
        if (profilePicture) profilePicture.src = profilePictureUrl;
        if (currentProfilePicture)
          currentProfilePicture.src = profilePictureUrl;
        if (!profilePicture || !currentProfilePicture) {
          console.error('One or more profile picture elements not found');
        }
      });
    })
    .catch((error) => {
      console.error('Error loading profile picture:', error);
      const defaultPicture = 'assets/undraw_drink_coffee_v3au.svg';
      if (profilePicture) profilePicture.src = defaultPicture;
      if (currentProfilePicture) currentProfilePicture.src = defaultPicture;
    });
}

function initializeDashboard(user) {
  showLoading();

  Promise.all([
    setUserGreeting(user),
    updateUserInfo(user),
    loadUserProfilePicture(user),
  ])
    .then(() => {
      hideLoading();
      console.log('All user data loaded successfully');
    })
    .catch((error) => {
      console.error('Error initializing dashboard:', error);
      hideLoading();
      showUpdateStatus(
        'Error loading user data. Please refresh the page.',
        false
      );
    });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
    initializeDashboard(user);
  } else {
    console.log('User is signed out');
    window.location.href = 'login.html';
  }
});

if (profilePicture) {
  profilePicture.addEventListener('click', () => {
    if (profileCard) {
      profileCard.classList.add('show');
    } else {
      console.error('profile-card element not found');
    }
  });
} else {
  console.error('profile-picture element not found');
}

if (closeProfileCard) {
  closeProfileCard.addEventListener('click', () => {
    if (profileCard) {
      profileCard.classList.remove('show');
    } else {
      console.error('profile-card element not found');
    }
  });
} else {
  console.error('close-profile-card element not found');
}

navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    console.log('Clicked nav link:', targetId);

    sections.forEach((section) => {
      section.style.display = 'none';
      section.classList.remove('active');
    });

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.style.display = 'block';
      targetSection.classList.add('active');
      console.log('Activated section:', targetId);
    } else {
      console.error('Target section not found:', targetId);
    }

    navLinks.forEach((navLink) => navLink.classList.remove('active'));
    link.classList.add('active');
  });
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    signOut(auth)
      .then(() => {
        console.log('Sign-out successful.');
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error('Logout error:', error);
        showUpdateStatus('Failed to logout. Please try again.', false);
      });
  });
} else {
  console.error('logout-btn element not found');
}

function showUpdateStatus(message, isSuccess) {
  if (profileUpdateStatus) {
    profileUpdateStatus.textContent = message;
    profileUpdateStatus.style.color = isSuccess ? 'green' : 'red';
    profileUpdateStatus.style.display = 'block';
    setTimeout(() => {
      profileUpdateStatus.style.display = 'none';
    }, 3000);
  } else {
    console.error('profile-update-status element not found');
  }
}

if (changeProfilePictureBtn && profilePictureInput) {
  changeProfilePictureBtn.addEventListener('click', () => {
    const file = profilePictureInput.files[0];
    if (file) {
      console.log('File selected:', file.name);
      uploadProfilePicture(file);
    } else {
      console.log('No file selected');
      showUpdateStatus('Please select a file first.', false);
    }
  });
} else {
  console.error(
    'change-profile-picture-btn or profile-picture-input element not found'
  );
}

function uploadProfilePicture(file) {
  const user = auth.currentUser;
  if (user) {
    console.log('Uploading file for user:', user.uid);
    showLoading();
    const storageReference = storageRef(
      storage,
      `profile_pictures/${user.uid}`
    );
    uploadBytes(storageReference, file)
      .then((snapshot) => getDownloadURL(snapshot.ref))
      .then((downloadURL) => updateUserProfilePicture(user, downloadURL))
      .then(() => {
        hideLoading();
        showUpdateStatus('Profile Picture Updated Successfully', true);
      })
      .catch((error) => {
        hideLoading();
        console.error('Error in upload process:', error);
        showUpdateStatus('Profile Picture Failed To Upload', false);
      });
  } else {
    showUpdateStatus(
      'You must be signed in to change your profile picture.',
      false
    );
  }
}

function updateUserProfilePicture(user, imageUrl) {
  console.log('Updating profile picture URL in database');
  return update(ref(database, 'users/' + user.uid), {
    profile_picture: imageUrl,
  })
    .then(() => loadUserProfilePicture(user))
    .catch((error) => {
      console.error('Error updating profile picture URL:', error);
      throw error;
    });
}

const changePasswordBtn = document.getElementById('change-password-btn');
const passwordUpdateStatus = document.getElementById('password-update-status');

if (changePasswordBtn) {
  changePasswordBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById(
      'confirm-new-password'
    ).value;

    if (!user) {
      showUpdateStatus('You must be signed in to change your password.', false);
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showUpdateStatus('Please fill in all password fields.', false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showUpdateStatus('New passwords do not match.', false);
      return;
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    reauthenticateWithCredential(user, credential)
      .then(() => {
        return updatePassword(user, newPassword);
      })
      .then(() => {
        showUpdateStatus('Password updated successfully.', true);
        if (passwordUpdateStatus) {
          passwordUpdateStatus.textContent = 'Password Updated';
          passwordUpdateStatus.style.color = 'green';
          passwordUpdateStatus.style.display = 'block';
          setTimeout(() => {
            passwordUpdateStatus.style.display = 'none';
          }, 3000);
        }
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
      })
      .catch((error) => {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
          showUpdateStatus('Current password is incorrect.', false);
        } else {
          showUpdateStatus(
            'Failed to change password. Please try again.',
            false
          );
        }
      });
  });
} else {
  console.error('change-password-btn element not found');
}

const languageSelect = document.getElementById('language-select');
if (languageSelect) {
  languageSelect.addEventListener('change', (e) => {
    console.log('Language changed to:', e.target.value);
    // Implement language change functionality
  });
} else {
  console.error('language-select element not found');
}

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('change', (e) => {
    const isDarkMode = e.target.checked;
    console.log('Dark mode:', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });

  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
  }
} else {
  console.error('theme-toggle element not found');
}

const profileVisibility = document.getElementById('profile-visibility');
if (profileVisibility) {
  profileVisibility.addEventListener('change', (e) => {
    console.log('Profile visibility changed to:', e.target.value);
    // Implement profile visibility change functionality
  });
} else {
  console.error('profile-visibility element not found');
}

const exportDataBtn = document.getElementById('export-data-btn');
if (exportDataBtn) {
  exportDataBtn.addEventListener('click', () => {
    console.log('Export data clicked');
    // Implement data export functionality
  });
} else {
  console.error('export-data-btn element not found');
}

const manageNotificationsBtn = document.getElementById(
  'manage-notifications-btn'
);
if (manageNotificationsBtn) {
  manageNotificationsBtn.addEventListener('click', () => {
    console.log('Manage notifications clicked');
    // Implement manage notifications functionality
  });
} else {
  console.error('manage-notifications-btn element not found');
}

function populateRecentNotifications() {
  const notificationsList = document.getElementById('recent-notifications');
  if (notificationsList) {
    const notifications = [
      'New message from John Doe',
      'Your post received 10 likes',
      'Reminder: Event starting in 1 hour',
    ];

    notificationsList.innerHTML = notifications
      .map((notification) => `<li>${notification}</li>`)
      .join('');
  } else {
    console.error('recent-notifications element not found');
  }
}

const notificationsLink = document.getElementById('notifications-link');
if (notificationsLink) {
  notificationsLink.addEventListener('click', populateRecentNotifications);
} else {
  console.error('notifications-link element not found');
}

function updateUserProfile() {
  const user = auth.currentUser;
  const displayNameInput = document.getElementById('display-name-input');

  if (user && displayNameInput) {
    const newDisplayName = displayNameInput.value;
    if (newDisplayName) {
      Promise.all([
        firebaseUpdateProfile(user, { displayName: newDisplayName }),
        update(ref(database, 'users/' + user.uid), {
          username: newDisplayName,
        }),
      ])
        .then(() => {
          setUserGreeting(user);
          updateUserInfo(user);
          showUpdateStatus('Profile updated successfully', true);
        })
        .catch((error) => {
          console.error('Error updating profile:', error);
          showUpdateStatus('Failed to update profile', false);
        });
    } else {
      showUpdateStatus('Please enter a display name', false);
    }
  } else {
    console.error('User not signed in or display-name-input element not found');
  }
}

const updateProfileBtn = document.getElementById('update-profile-btn');
if (updateProfileBtn) {
  updateProfileBtn.addEventListener('click', updateUserProfile);
} else {
  console.error('update-profile-btn element not found');
}

function initProfileCard() {
  if (sections.length > 0 && navLinks.length > 0) {
    // Hide all sections except the first one
    sections.forEach((section, index) => {
      if (index === 0) {
        section.style.display = 'block';
        section.classList.add('active');
      } else {
        section.style.display = 'none';
        section.classList.remove('active');
      }
    });
    navLinks[0].classList.add('active');
  } else {
    console.error('No sections or navLinks found');
  }
}

initProfileCard();

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Any additional initialization code can go here
  console.log('DOM fully loaded and parsed');
});

// Function to handle profile picture change
function handleProfilePictureChange(event) {
  const file = event.target.files[0];
  if (file) {
    uploadProfilePicture(file);
  }
}

// Add event listener for profile picture input change
if (profilePictureInput) {
  profilePictureInput.addEventListener('change', handleProfilePictureChange);
} else {
  console.error('profile-picture-input element not found');
}

// Function to update user data in the database
function updateUserData(userId, data) {
  return update(ref(database, 'users/' + userId), data);
}

// Function to fetch user data from the database
function fetchUserData(userId) {
  return get(ref(database, 'users/' + userId));
}

// Implement lazy loading for images
document.addEventListener('DOMContentLoaded', function () {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
});

const notificationsBtn = document.getElementById('notifications-btn');
const notificationsCount = document.getElementById('notifications-count');
let notifications = []; // This will store our notifications

function createNotificationsPanel() {
  const panel = document.createElement('div');
  panel.className = 'notifications-panel';
  panel.innerHTML = `
    <div class="notifications-header">Notifications</div>
    <ul class="notifications-list"></ul>
  `;
  document.body.appendChild(panel);
  return panel;
}

const notificationsPanel = createNotificationsPanel();

function updateNotifications(newNotifications) {
  notifications = newNotifications;
  notificationsCount.textContent = notifications.length;

  const notificationsList = notificationsPanel.querySelector(
    '.notifications-list'
  );
  notificationsList.innerHTML = notifications
    .map(
      (notification) => `
    <li>${notification}</li>
  `
    )
    .join('');
}

function toggleNotificationsPanel() {
  notificationsPanel.classList.toggle('show');
}

if (notificationsBtn) {
  notificationsBtn.addEventListener('click', toggleNotificationsPanel);
} else {
  console.error('notifications-btn element not found');
}

// Close the notifications panel when clicking outside
document.addEventListener('click', (event) => {
  if (
    !notificationsBtn.contains(event.target) &&
    !notificationsPanel.contains(event.target)
  ) {
    notificationsPanel.classList.remove('show');
  }
});

// Example: Update notifications (you would typically do this when fetching from a server)
updateNotifications([
  'New message from @JohnDoe',
  'Your post received 10 likes',
  'Reminder: Event starting in 1 hour',
  'Your comment received 3 likes',
]);

// Export any functions or variables that might be used in other files
export {
  updateUserProfile,
  loadUserProfilePicture,
  updateUserData,
  fetchUserData,
  // Add any other exports as needed
};
