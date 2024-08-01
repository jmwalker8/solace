// Import statements
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

// Firebase configuration
const firebaseConfig = {
  skibidi,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();
const storage = getStorage(app);

// Global variables
let currentUser;
let selectedMood = null;
let moodData = [];
let tasks = [];
let habits = [];
let loadingTimeout;
let totalPoints = 0;
let notifications = [];
let timerInterval;
let pomodoroTime = 25 * 60; // 25 minutes
let breakTime = 5 * 60; // 5 minutes
let isWorking = true;

// Constants
const disallowedSymbols = [
  '!',
  '@',
  '#',
  '$',
  '%',
  '^',
  '&',
  '*',
  '(',
  ')',
  '+',
  '=',
  '{',
  '}',
  '[',
  ']',
  '|',
  '\\',
  ':',
  ';',
  '"',
  "'",
  '<',
  '>',
  ',',
  '?',
  '/',
  '`',
  '~',
];
const offensiveUsernames = [
  'admin',
  'moderator',
  'fuck',
  'shit',
  'asshole',
  'bitch',
  'cunt',
  'nigger',
  'faggot',
  'slut',
  'whore',
  'nazi',
  'hitler',
  'terrorist',
  'rape',
  'pedophile',
  'kike',
  'spic',
  'chink',
  'retard',
  'dickhead',
  'pussy',
  'twat',
  'wanker',
  'motherfucker',
  'cocksucker',
  'bastard',
  'douchebag',
  'bangbros',
  'brazzers',
  'pornhub',
  'xvideos',
];
const achievements = [
  {
    id: 'task5',
    name: 'Task Master',
    description: 'Complete 5 tasks',
    pointThreshold: 25,
    icon: '📋',
    achieved: false,
  },
  {
    id: 'mood7',
    name: 'Mood Tracker',
    description: 'Log mood for 7 consecutive days',
    pointThreshold: 35,
    icon: '😊',
    achieved: false,
  },
  {
    id: 'points100',
    name: 'Century Club',
    description: 'Earn 100 points',
    pointThreshold: 100,
    icon: '💯',
    achieved: false,
  },
];

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
  const editQuoteBtn = document.getElementById('edit-quote-btn');
  const randomQuoteBtn = document.getElementById('random-quote-btn');

  if (editQuoteBtn) {
    editQuoteBtn.addEventListener('click', () =>
      editQuote(document.getElementById('motivational-quote'))
    );
  }

  if (randomQuoteBtn) {
    randomQuoteBtn.addEventListener('click', () =>
      getRandomQuote(document.getElementById('motivational-quote'))
    );
  }

  addDashboardEventListeners();
  initializeDashboard();
});

// Functions
function addDashboardEventListeners() {
  const elements = {
    profilePicture: document.getElementById('profile-picture'),
    profileCard: document.getElementById('profile-card'),
    closeProfileCard: document.getElementById('close-profile-card'),
    logoutBtn: document.getElementById('logout-btn'),
    changeProfilePictureBtn: document.getElementById(
      'change-profile-picture-btn'
    ),
    profilePictureInput: document.getElementById('profile-picture-input'),
    gamificationBtn: document.getElementById('gamification-btn'),
    achievementsCard: document.getElementById('achievements-card'),
    closeAchievementsCard: document.getElementById('close-achievements-card'),
    notificationsBtn: document.getElementById('notifications-btn'),
    notificationsDropdown: document.getElementById('notifications-dropdown'),
    logMoodBtn: document.getElementById('log-mood-btn'),
    addTaskBtn: document.getElementById('add-task-btn'),
    saveReflectionBtn: document.getElementById('save-reflection-btn'),
    newTipBtn: document.getElementById('new-tip-btn'),
    addHabitBtn: document.getElementById('add-habit-btn'),
    startTimerBtn: document.getElementById('start-timer-btn'),
    navLinks: document.querySelectorAll('.profile-card-nav a'),
  };

  Object.entries(elements).forEach(([key, element]) => {
    if (!element && key !== 'navLinks') {
      console.error(`Element not found: ${key}`);
    }
  });

  const forumBtn = document.getElementById('forum-btn');
  if (forumBtn) {
    forumBtn.addEventListener('click', () => {
      window.location.href = 'forum.html';
    });
  }

  if (elements.notificationsBtn && elements.notificationsDropdown) {
    elements.notificationsBtn.addEventListener(
      'click',
      toggleNotificationsDropdown
    );
  }

  if (elements.profilePicture && elements.profileCard) {
    elements.profilePicture.addEventListener('click', toggleProfileCard);
  }

  if (elements.gamificationBtn) {
    elements.gamificationBtn.addEventListener('click', () => {
      console.log('Gamification button clicked');
      showAchievementsCard();
    });
  }

  if (elements.closeProfileCard) {
    elements.closeProfileCard.addEventListener('click', () =>
      elements.profileCard.classList.remove('show')
    );
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }

  elements.navLinks.forEach((link) => {
    link.addEventListener('click', handleNavLinkClick);
  });

  if (elements.changeProfilePictureBtn && elements.profilePictureInput) {
    elements.changeProfilePictureBtn.addEventListener(
      'click',
      handleProfilePictureChange
    );
  }

  if (elements.logMoodBtn)
    elements.logMoodBtn.addEventListener('click', logMood);
  if (elements.addTaskBtn)
    elements.addTaskBtn.addEventListener('click', addTask);
  if (elements.saveReflectionBtn)
    elements.saveReflectionBtn.addEventListener('click', saveReflection);
  if (elements.newTipBtn)
    elements.newTipBtn.addEventListener('click', setWellnessTip);
  if (elements.addHabitBtn)
    elements.addHabitBtn.addEventListener('click', addHabit);
  if (elements.startTimerBtn)
    elements.startTimerBtn.addEventListener('click', toggleTimer);

  const clearNotificationsBtn = document.getElementById(
    'clear-notifications-btn'
  );
  if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', clearAllNotifications);
    console.log('Notifications Cleared');
  }

  const newTipBtn = document.getElementById('new-tip-btn');
  if (newTipBtn) {
    newTipBtn.addEventListener('click', setWellnessTip);
    console.log('New Tip button event listener added');
  } else {
    console.error('New Tip button not found');
  }

  console.log('All event listeners added successfully');
}

async function initializeDashboard() {
  showLoading();
  try {
    const user = await new Promise((resolve, reject) => {
      onAuthStateChanged(auth, (user) => {
        if (user) resolve(user);
        else reject(new Error('User is not signed in'));
      });
    });

    currentUser = user;
    console.log('User is signed in:', user.uid);

    await Promise.all([
      setUserGreeting(user),
      updateUserInfo(user),
      loadUserProfilePicture(user),
      loadMoodData(),
      loadTasks(),
      loadHabits(),
      loadReflection(),
      initTaskManager(),
      initMoodJournal(),
      initGamification(),
      initThemeToggle(),
      setMotivationalQuote(),
      loadNotifications(),
      setWellnessTip(),
    ]);

    // Clear all notifications after loading them
    await clearAllNotifications();

    hideLoading();
    console.log('All dashboard components loaded successfully');
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    hideLoading();
    showUpdateStatus(
      'Error loading user data. Please refresh the page.',
      false
    );
    if (error.message === 'User is not signed in') {
      window.location.href = 'login.html';
    }
  }
}

function showLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    loadingTimeout = setTimeout(() => {
      hideLoading();
      console.error('Loading timeout occurred');
      showUpdateStatus(
        'Loading took too long. Please refresh the page.',
        false
      );
    }, 120000);
  } else {
    console.error('Loading overlay element not found');
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
    document.body.style.overflow = '';
    clearTimeout(loadingTimeout);
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showUpdateStatus(message, isSuccess) {
  const profileUpdateStatus = document.getElementById('profile-update-status');
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

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  else if (hour >= 12 && hour < 18) return 'Good Afternoon';
  else return 'Good Evening';
}

async function setUserGreeting(user) {
  try {
    const snapshot = await get(ref(database, 'users/' + user.uid));
    const userData = snapshot.val();
    const name =
      userData?.username ||
      user.displayName ||
      user.email?.split('@')[0] ||
      user.uid;
    const greeting = getTimeBasedGreeting();
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) {
      userGreeting.innerHTML = `${greeting}, <span class="username">${name}</span>`;
    }
    await setMotivationalQuote();
  } catch (error) {
    console.error('Error fetching user data:', error);
    const name = user.displayName || user.email?.split('@')[0] || user.uid;
    const greeting = getTimeBasedGreeting();
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) {
      userGreeting.innerHTML = `${greeting}, <span class="username">${name}</span>`;
    }
    await setMotivationalQuote();
  }
}

async function setMotivationalQuote() {
  const motivationalQuote = document.getElementById('motivational-quote');
  const editQuoteBtn = document.getElementById('edit-quote-btn');
  const randomQuoteBtn = document.getElementById('random-quote-btn');

  if (!motivationalQuote || !editQuoteBtn || !randomQuoteBtn) {
    console.error('Motivational quote elements not found');
    return;
  }

  await loadCustomQuote();

  editQuoteBtn.addEventListener('click', () => editQuote(motivationalQuote));
  randomQuoteBtn.addEventListener('click', () =>
    getRandomQuote(motivationalQuote)
  );
}

async function loadCustomQuote() {
  const motivationalQuote = document.getElementById('motivational-quote');
  try {
    const customQuoteRef = ref(
      database,
      `users/${currentUser.uid}/customQuote`
    );
    const customQuoteSnapshot = await get(customQuoteRef);

    if (customQuoteSnapshot.exists()) {
      motivationalQuote.innerHTML = `"${customQuoteSnapshot.val()}" <span class="quote-actions">
        <i id="edit-quote-btn" class="fas fa-pencil-alt" title="Edit custom quote"></i>
        <i id="random-quote-btn" class="fas fa-random" title="Get random quote"></i>
      </span>`;
    } else {
      await getRandomQuote(motivationalQuote);
    }
  } catch (error) {
    console.error('Error loading custom quote:', error);
    await getRandomQuote(motivationalQuote);
  }
}

async function getRandomQuote(quoteElement) {
  try {
    const response = await fetch(
      'https://api.quotable.io/random?tags=inspirational,motivational'
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    quoteElement.innerHTML = `"${data.content}" - ${data.author} <span class="quote-actions">
      <i id="edit-quote-btn" class="fas fa-pencil-alt" title="Edit custom quote"></i>
      <i id="random-quote-btn" class="fas fa-random" title="Get random quote"></i>
    </span>`;

    // Reattach event listeners
    document
      .getElementById('edit-quote-btn')
      .addEventListener('click', () => editQuote(quoteElement));
    document
      .getElementById('random-quote-btn')
      .addEventListener('click', () => getRandomQuote(quoteElement));
  } catch (error) {
    console.error('Error fetching quote:', error);
    quoteElement.innerHTML = `Your journey of a thousand miles begins with a single step. <span class="quote-actions">
      <i id="edit-quote-btn" class="fas fa-pencil-alt" title="Edit custom quote"></i>
      <i id="random-quote-btn" class="fas fa-random" title="Get random quote"></i>
    </span>`;

    // Reattach event listeners
    document
      .getElementById('edit-quote-btn')
      .addEventListener('click', () => editQuote(quoteElement));
    document
      .getElementById('random-quote-btn')
      .addEventListener('click', () => getRandomQuote(quoteElement));
  }
}

function editQuote(quoteElement) {
  const currentQuote = quoteElement.childNodes[0].nodeValue.trim();
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentQuote;
  input.className = 'edit-quote-input';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.className = 'btn-primary save-quote-btn';

  quoteElement.innerHTML = '';
  quoteElement.appendChild(input);
  quoteElement.appendChild(saveBtn);
  input.focus();

  saveBtn.addEventListener('click', () => saveQuote(quoteElement, input.value));
}

async function saveQuote(quoteElement, newQuote) {
  try {
    await set(ref(database, `users/${currentUser.uid}/customQuote`), newQuote);
    quoteElement.innerHTML = `${newQuote} <span class="quote-actions">
      <i id="edit-quote-btn" class="fas fa-pencil-alt" title="Edit custom quote"></i>
      <i id="random-quote-btn" class="fas fa-random" title="Get random quote"></i>
    </span>`;

    // Reattach event listeners
    document
      .getElementById('edit-quote-btn')
      .addEventListener('click', () => editQuote(quoteElement));
    document
      .getElementById('random-quote-btn')
      .addEventListener('click', () => getRandomQuote(quoteElement));

    showToast('Quote updated successfully!', 'success');
  } catch (error) {
    console.error('Error saving custom quote:', error);
    showToast('Failed to save quote. Please try again.', 'error');
  }
}

async function updateUserInfo(user) {
  const fullNameElement = document.getElementById('user-full-name');
  const emailElement = document.getElementById('user-email');
  const joinDateElement = document.getElementById('user-join-date');

  try {
    const snapshot = await get(ref(database, 'users/' + user.uid));
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
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}

async function loadUserProfilePicture(user) {
  console.log('Loading user profile picture for user:', user.uid);
  const dbRef = ref(database, 'users/' + user.uid + '/profile_picture');
  try {
    const snapshot = await get(dbRef);
    console.log('Profile picture snapshot:', snapshot.val());
    const profilePictureUrl = snapshot.exists()
      ? snapshot.val()
      : 'assets/undraw_drink_coffee_v3au.svg';
    console.log('Setting profile picture URL:', profilePictureUrl);
    await preloadProfilePicture(profilePictureUrl);
    const profilePicture = document.getElementById('profile-picture');
    const currentProfilePicture = document.getElementById(
      'current-profile-picture'
    );
    if (profilePicture) profilePicture.src = profilePictureUrl;
    if (currentProfilePicture) currentProfilePicture.src = profilePictureUrl;
    if (!profilePicture || !currentProfilePicture) {
      console.error('One or more profile picture elements not found');
    }
  } catch (error) {
    console.error('Error loading profile picture:', error);
    const defaultPicture = 'assets/undraw_drink_coffee_v3au.svg';
    const profilePicture = document.getElementById('profile-picture');
    const currentProfilePicture = document.getElementById(
      'current-profile-picture'
    );
    if (profilePicture) profilePicture.src = defaultPicture;
    if (currentProfilePicture) currentProfilePicture.src = defaultPicture;
  }
}

function preloadProfilePicture(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
}

async function loadMoodData() {
  try {
    const moodRef = ref(database, `users/${currentUser.uid}/moods`);
    const snapshot = await get(moodRef);
    moodData = snapshot.val() || [];
    updateMoodChart();
  } catch (error) {
    console.error('Error loading mood data:', error);
  }
}

function updateMoodChart() {
  const moodChart = document.getElementById('mood-chart');
  if (moodChart) {
    // TODO: Implement actual chart using a library like Chart.js
    moodChart.innerHTML = 'Mood chart placeholder';
  } else {
    console.error('mood-chart element not found');
  }
}

function logMood() {
  const mood = prompt('Rate your mood from 1-5');
  const notes = prompt('Any notes about your mood?');
  const newMood = {
    date: new Date().toISOString(),
    mood: parseInt(mood),
    notes,
  };
  moodData.push(newMood);
  updateMoodChart();
  saveMoodData();
  addPoints(5);
}

async function saveMoodData() {
  try {
    await set(ref(database, `users/${currentUser.uid}/moods`), moodData);
  } catch (error) {
    console.error('Error saving mood data:', error);
    showToast('Failed to save mood data. Please try again.', 'error');
  }
}

function initTaskManager() {
  loadTasks();
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', addTask);
  }
}

async function loadTasks() {
  try {
    const tasksRef = ref(database, `users/${currentUser.uid}/tasks`);
    const snapshot = await get(tasksRef);
    tasks = snapshot.val() || [];
    renderTasks();
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

function renderTasks() {
  const taskList = document.getElementById('task-list');
  if (!taskList) {
    console.error('task-list element not found');
    return;
  }
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="${task.completed ? 'completed' : ''}">${task.text}</span>
      <span class="task-priority ${task.priority}">${task.priority}</span>
      <button class="complete-btn" aria-label="${
        task.completed ? 'Undo task' : 'Complete task'
      }">${task.completed ? 'Undo' : 'Complete'}</button>
      <button class="delete-btn" aria-label="Delete task">Delete</button>
    `;
    li.querySelector('.complete-btn').addEventListener('click', () =>
      toggleComplete(index)
    );
    li.querySelector('.delete-btn').addEventListener('click', () =>
      deleteTask(index)
    );
    taskList.appendChild(li);
  });
}

function addTask() {
  const taskText = prompt('Enter a new task:');
  const priority = prompt('Enter priority (low, medium, high):');
  if (taskText) {
    const task = { text: taskText, priority: priority, completed: false };
    tasks.push(task);
    renderTasks();
    saveTasks();
    addPoints(2);
  }
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
  saveTasks();
  addPoints(tasks[index].completed ? 5 : -5);
}

function deleteTask(index) {
  showConfirmDialog('Are you sure you want to delete this task?', () => {
    tasks.splice(index, 1);
    renderTasks();
    saveTasks();
  });
}

async function saveTasks() {
  try {
    await set(ref(database, `users/${currentUser.uid}/tasks`), tasks);
  } catch (error) {
    console.error('Error saving tasks:', error);
    showToast('Failed to save tasks. Please try again.', 'error');
  }
}

function initMoodJournal() {
  loadMoodData();
  const logMoodBtn = document.getElementById('log-mood-btn');
  if (logMoodBtn) {
    logMoodBtn.addEventListener('click', logMood);
  }
}

async function loadHabits() {
  try {
    const habitsRef = ref(database, `users/${currentUser.uid}/habits`);
    const snapshot = await get(habitsRef);
    habits = snapshot.val() || [];
    renderHabits();
  } catch (error) {
    console.error('Error loading habits:', error);
  }
}

function renderHabits() {
  const habitsList = document.getElementById('habits-list');
  if (!habitsList) {
    console.error('habits-list element not found');
    return;
  }
  habitsList.innerHTML = '';
  habits.forEach((habit, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${habit.name}</span>
      <button class="check-in-btn" aria-label="Check in habit">Check In</button>
      <button class="delete-btn" aria-label="Delete habit">Delete</button>
    `;
    li.querySelector('.check-in-btn').addEventListener('click', () =>
      checkInHabit(index)
    );
    li.querySelector('.delete-btn').addEventListener('click', () =>
      deleteHabit(index)
    );
    habitsList.appendChild(li);
  });
}

function addHabit() {
  const habitName = prompt('Enter a new habit:');
  if (habitName) {
    habits.push({ name: habitName, streak: 0, lastCheckin: null });
    renderHabits();
    saveHabits();
    addPoints(3);
  }
}

function checkInHabit(index) {
  const habit = habits[index];
  const today = new Date().toDateString();
  if (habit.lastCheckin !== today) {
    habit.streak++;
    habit.lastCheckin = today;
    renderHabits();
    saveHabits();
    addPoints(10);
  } else {
    alert("You've already checked in this habit today!");
  }
}

async function saveHabits() {
  try {
    await set(ref(database, `users/${currentUser.uid}/habits`), habits);
  } catch (error) {
    console.error('Error saving habits:', error);
    showToast('Failed to save habits. Please try again.', 'error');
  }
}

async function loadReflection() {
  try {
    const reflectionRef = ref(database, `users/${currentUser.uid}/reflection`);
    const snapshot = await get(reflectionRef);
    const reflectionInput = document.getElementById('reflection-input');
    if (reflectionInput) {
      reflectionInput.value = snapshot.val() || '';
    } else {
      console.error('reflection-input element not found');
    }
  } catch (error) {
    console.error('Error loading reflection:', error);
  }
}

async function saveReflection() {
  const reflectionInput = document.getElementById('reflection-input');
  if (!reflectionInput) {
    console.error('reflection-input element not found');
    return;
  }
  try {
    await set(
      ref(database, `users/${currentUser.uid}/reflection`),
      reflectionInput.value
    );
    addPoints(5);
    showToast('Reflection saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving reflection:', error);
    showToast('Failed to save reflection. Please try again.', 'error');
  }
}

function setWellnessTip() {
  console.log('setWellnessTip function called');
  const tips = [
    'Take a 5-minute break to practice deep breathing.',
    'Stay hydrated! Drink a glass of water right now.',
    'Stretch your body for a quick energy boost.',
    'Practice gratitude by listing three things youre thankful for.',
    'Take a short walk to clear your mind and improve focus.',
    'Try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break.',
    'Do a quick meditation or mindfulness exercise.',
    'Organize your workspace for better productivity.',
    'Listen to calming music or nature sounds while working.',
    'Practice good posture to reduce physical stress.',
  ];
  const wellnessTipContent = document.getElementById('wellness-tip-content');
  if (wellnessTipContent) {
    wellnessTipContent.classList.add('fade');
    setTimeout(() => {
      const newTip = tips[Math.floor(Math.random() * tips.length)];
      wellnessTipContent.textContent = newTip;
      wellnessTipContent.classList.remove('fade');
      console.log('New wellness tip set:', newTip);
    }, 300);
  } else {
    console.error('wellness-tip-content element not found');
  }
}

function toggleTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    const startTimerBtn = document.getElementById('start-timer-btn');
    if (startTimerBtn) {
      startTimerBtn.textContent = 'Start Session';
    }
  } else {
    startTimer();
    const startTimerBtn = document.getElementById('start-timer-btn');
    if (startTimerBtn) {
      startTimerBtn.textContent = 'Stop Session';
    }
  }
}

function startTimer() {
  let time = isWorking ? pomodoroTime : breakTime;
  updateTimerDisplay(time);
  timerInterval = setInterval(() => {
    time--;
    updateTimerDisplay(time);
    if (time === 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isWorking = !isWorking;
      showToast(
        isWorking
          ? 'Break time is over. Start working!'
          : 'Great job! Take a break.',
        'info'
      );
      startTimer();
    }
  }, 1000);
}

function updateTimerDisplay(time) {
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
  } else {
    console.error('timer-display element not found');
  }
}

function initGamification() {
  loadPoints();
  renderAchievements();
}

function showAchievementsCard() {
  console.log('showAchievementsCard function called');
  const achievementsCard = document.getElementById('achievements-card');
  if (achievementsCard) {
    console.log('Achievements card found, toggling display');
    achievementsCard.style.display =
      achievementsCard.style.display === 'none' ? 'flex' : 'none';
    if (achievementsCard.style.display === 'flex') {
      renderAchievements();
    }
  } else {
    console.log('Achievements card not found');
  }
}

function hideAchievementsCard() {
  const achievementsCard = document.getElementById('achievements-card');
  if (achievementsCard) {
    achievementsCard.style.display = 'none';
  }
}

document.addEventListener('click', function (event) {
  const achievementsCard = document.getElementById('achievements-card');
  const gamificationBtn = document.getElementById('gamification-btn');

  if (achievementsCard && achievementsCard.style.display === 'flex') {
    if (
      !achievementsCard.contains(event.target) &&
      event.target !== gamificationBtn
    ) {
      hideAchievementsCard();
    }
  }
});

async function loadPoints() {
  try {
    const pointsRef = ref(database, `users/${currentUser.uid}/points`);
    const snapshot = await get(pointsRef);
    totalPoints = snapshot.val() || 0;
    updateNavbarPoints();
  } catch (error) {
    console.error('Error loading points:', error);
  }
}

function updateNavbarPoints() {
  const navbarPoints = document.getElementById('navbar-points');
  if (navbarPoints) {
    animateCountUp(navbarPoints, totalPoints, 1000);
  } else {
    console.error('navbar-points element not found');
  }
}

function addPoints(points) {
  totalPoints += points;
  updateNavbarPoints();
  savePoints();
  checkAchievements();
  showToast(`You earned ${points} points!`, 'success');
}

async function savePoints() {
  try {
    await set(ref(database, `users/${currentUser.uid}/points`), totalPoints);
  } catch (error) {
    console.error('Error saving points:', error);
    showToast('Failed to save points. Please try again.', 'error');
  }
}

function renderAchievements() {
  const achievementsList = document.getElementById('achievements-list');
  const totalPointsSpan = document.getElementById('total-points');
  const achievementsUnlockedSpan = document.getElementById(
    'achievements-unlocked'
  );

  if (!achievementsList || !totalPointsSpan || !achievementsUnlockedSpan) {
    console.error('One or more achievement elements not found');
    return;
  }

  achievementsList.innerHTML = '';
  let unlockedCount = 0;

  achievements.forEach((achievement) => {
    const li = document.createElement('li');
    const isAchieved = totalPoints >= achievement.pointThreshold;
    if (isAchieved) unlockedCount++;

    li.className = isAchieved ? 'achieved' : '';
    li.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
      </div>
    `;
    achievementsList.appendChild(li);
  });

  totalPointsSpan.textContent = totalPoints;
  achievementsUnlockedSpan.textContent = unlockedCount;
}

function checkAchievements() {
  let newAchievements = false;
  achievements.forEach((achievement) => {
    if (totalPoints >= achievement.pointThreshold && !achievement.achieved) {
      achievement.achieved = true;
      newAchievements = true;
    }
  });
  if (newAchievements) {
    renderAchievements();
    showToast("You've unlocked new achievements!", 'success');
  }
}

function addNotification(message) {
  notifications.unshift({ message, timestamp: new Date() });
  updateNotificationCount();
  saveNotifications();
}

function renderNotifications() {
  const notificationsList = document.getElementById('notifications-list');
  const notificationsDropdown = document.getElementById(
    'notifications-dropdown'
  );
  if (!notificationsList || !notificationsDropdown) return;

  notificationsList.innerHTML = '';
  if (notifications.length === 0) {
    notificationsList.innerHTML = '<li>No new notifications</li>';
  } else {
    notifications.forEach((notification, index) => {
      const li = document.createElement('li');
      li.textContent = notification.message;
      li.dataset.index = index;
      notificationsList.appendChild(li);
    });
  }

  notificationsDropdown.style.display = 'block';
}

function toggleNotificationsDropdown() {
  const notificationsDropdown = document.getElementById(
    'notifications-dropdown'
  );
  if (notificationsDropdown) {
    notificationsDropdown.style.display =
      notificationsDropdown.style.display === 'none' ? 'block' : 'none';
    if (notificationsDropdown.style.display === 'block') {
      renderNotifications();
    }
  }
}

function updateNotificationCount() {
  const notificationsBtn = document.getElementById('notifications-btn');
  const notificationsBadge = document.getElementById('notifications-badge');
  if (!notificationsBtn || !notificationsBadge) return;

  const count = notifications.length;
  notificationsBadge.textContent = count;
  notificationsBadge.style.display = count > 0 ? 'inline' : 'none';
}

async function saveNotifications() {
  try {
    await set(
      ref(database, `users/${currentUser.uid}/notifications`),
      notifications
    );
  } catch (error) {
    console.error('Error saving notifications:', error);
    showToast('Failed to save notifications. Please try again.', 'error');
  }
}

async function loadNotifications() {
  try {
    const notificationsRef = ref(
      database,
      `users/${currentUser.uid}/notifications`
    );
    const snapshot = await get(notificationsRef);
    notifications = snapshot.val() || [];
    updateNotificationCount();
    renderNotifications();
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

async function clearAllNotifications() {
  notifications = [];
  updateNotificationCount();
  renderNotifications();
  try {
    await set(ref(database, `users/${currentUser.uid}/notifications`), null);
    console.log('All notifications cleared successfully');
  } catch (error) {
    console.error('Error clearing notifications:', error);
    showToast('Failed to clear notifications. Please try again.', 'error');
  }
}

function initThemeToggle() {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (themeToggle) themeToggle.checked = true;
  }

  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    });
  }
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
        showToast('Profile Picture Updated Successfully', 'success');
      })
      .catch((error) => {
        hideLoading();
        console.error('Error in upload process:', error);
        showToast('Profile Picture Failed To Upload', 'error');
      });
  } else {
    showToast('You must be signed in to change your profile picture.', 'error');
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

function changePassword() {
  const user = auth.currentUser;
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmNewPassword = document.getElementById(
    'confirm-new-password'
  ).value;

  if (!user) {
    showToast('You must be signed in to change your password.', 'error');
    return;
  }

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showToast('Please fill in all password fields.', 'error');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showToast('New passwords do not match.', 'error');
    return;
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  reauthenticateWithCredential(user, credential)
    .then(() => {
      return updatePassword(user, newPassword);
    })
    .then(() => {
      showToast('Password updated successfully.', 'success');
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-new-password').value = '';
    })
    .catch((error) => {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showToast('Current password is incorrect.', 'error');
      } else {
        showToast('Failed to change password. Please try again.', 'error');
      }
    });
}

function updateUserProfile() {
  const user = auth.currentUser;
  const displayNameInput = document.getElementById('display-name-input');

  if (user && displayNameInput) {
    const newDisplayName = displayNameInput.value.trim();
    if (newDisplayName) {
      if (isValidUsername(newDisplayName)) {
        Promise.all([
          firebaseUpdateProfile(user, { displayName: newDisplayName }),
          update(ref(database, 'users/' + user.uid), {
            username: newDisplayName,
          }),
        ])
          .then(() => {
            setUserGreeting(user);
            updateUserInfo(user);
            showToast('Profile updated successfully', 'success');
          })
          .catch((error) => {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile', 'error');
          });
      } else {
        showToast(
          'Invalid username. Please avoid special characters and offensive terms.',
          'error'
        );
      }
    } else {
      showToast('Please enter a display name', 'error');
    }
  } else {
    console.error('User not signed in or display-name-input element not found');
  }
}

function isValidUsername(username) {
  if (disallowedSymbols.some((symbol) => username.includes(symbol))) {
    return false;
  }
  if (
    offensiveUsernames.some((term) => username.toLowerCase().includes(term))
  ) {
    return false;
  }
  return true;
}

function handleLogout() {
  signOut(auth)
    .then(() => {
      console.log('Sign-out successful.');
      window.location.href = 'login.html';
    })
    .catch((error) => {
      console.error('Logout error:', error);
      showToast('Failed to logout. Please try again.', 'error');
    });
}

function handleNavLinkClick(e) {
  e.preventDefault();
  const targetId = this.getAttribute('href').substring(1);
  const sections = document.querySelectorAll('.profile-card-content > div');
  sections.forEach((section) => {
    section.style.display = 'none';
    section.classList.remove('active');
  });
  const targetSection = document.getElementById(targetId);
  if (targetSection) {
    targetSection.style.display = 'block';
    targetSection.classList.add('active');
  }
  const navLinks = document.querySelectorAll('.profile-card-nav a');
  navLinks.forEach((navLink) => navLink.classList.remove('active'));
  this.classList.add('active');
}

function handleProfilePictureChange() {
  const profilePictureInput = document.getElementById('profile-picture-input');
  if (profilePictureInput) {
    const file = profilePictureInput.files[0];
    if (file) {
      uploadProfilePicture(file);
    }
  }
}

function handleProfilePictureInputChange(event) {
  const file = event.target.files[0];
  if (file) {
    uploadProfilePicture(file);
  }
}

function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const debouncedSaveReflection = debounce(saveReflection, 1000);

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function sortTasks() {
  tasks.sort((a, b) => {
    if (a.completed === b.completed) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.completed ? 1 : -1;
  });
  renderTasks();
}

function filterTasks(filterType) {
  const filteredTasks = tasks.filter((task) => {
    if (filterType === 'all') return true;
    if (filterType === 'completed') return task.completed;
    if (filterType === 'active') return !task.completed;
    return task.priority === filterType;
  });
  renderTasks(filteredTasks);
}

function showConfirmDialog(message, onConfirm) {
  const result = window.confirm(message);
  if (result) onConfirm();
}

function animateCountUp(element, target, duration) {
  let start = parseInt(element.textContent, 10);
  const range = target - start;
  const startTime = performance.now();

  function updateCount(currentTime) {
    const elapsedTime = currentTime - startTime;
    if (elapsedTime > duration) {
      element.textContent = target;
    } else {
      const progress = elapsedTime / duration;
      const currentCount = Math.round(start + range * progress);
      element.textContent = currentCount;
      requestAnimationFrame(updateCount);
    }
  }

  requestAnimationFrame(updateCount);
}

function handleError(error, message) {
  console.error(message, error);
  showToast(`${message}. Please try again.`, 'error');
}

function handleInitializationError(error) {
  console.error('Error initializing app:', error);
  showToast(
    'Failed to initialize the app. Please refresh the page or try again later.',
    'error'
  );
}

window.addEventListener('beforeunload', async (event) => {
  try {
    await savePoints();
    await saveTasks();
    await saveHabits();
    await saveReflection();
  } catch (error) {
    console.error('Error saving data before unload:', error);
  }
});

export {
  updateUserProfile,
  loadUserProfilePicture,
  updateUserData,
  fetchUserData,
};

async function updateUserData(userId, data) {
  try {
    await update(ref(database, `users/${userId}`), data);
  } catch (error) {
    handleError(error, 'Error updating user data');
  }
}

async function fetchUserData(userId) {
  try {
    const snapshot = await get(ref(database, `users/${userId}`));
    return snapshot.val();
  } catch (error) {
    handleError(error, 'Error fetching user data');
    return null;
  }
}

// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    addDashboardEventListeners();
    initializeDashboard();
  } catch (error) {
    handleInitializationError(error);
  }
  document.addEventListener('click', closeDropdowns);
});

// Function to close dropdowns when clicking outside
function closeDropdowns(event) {
  const dropdowns = document.querySelectorAll('.dropdown.show');
  dropdowns.forEach((dropdown) => {
    if (
      !dropdown.contains(event.target) &&
      !event.target.matches('.navbar-btn')
    ) {
      dropdown.classList.remove('show');
    }
  });
}

// Initialize the dashboard
initializeDashboard();
