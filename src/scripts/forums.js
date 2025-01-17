import {
  ref,
  push,
  onValue,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  remove,
  serverTimestamp,
  update,
  limitToLast,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const auth = window.auth;
const database = window.database;

let forumTopics = [];
let currentUser = null;
let currentCategory = 'all';
let currentPage = 1;
const topicsPerPage = 9;

// DOM Elements
const forumTopicsElement = document.getElementById('forum-topics');
const backToDashboardBtn = document.getElementById('back-to-dashboard');
const createTopicBtn = document.getElementById('create-topic-btn');
const modal = document.getElementById('create-topic-modal');
const closeModalBtn = document.querySelector('.close');
const categoryBtns = document.querySelectorAll('.category-btn');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const newTopicForm = document.getElementById('new-topic-form');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileBtn = document.getElementById('profile-btn');
const notificationsBtn = document.getElementById('notifications-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categorySelect = document.getElementById('new-topic-category');
const moreCategoriesBtn = document.getElementById('more-categories-btn');
const moreCategoriesContent = document.getElementById(
  'more-categories-content'
);
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Main Functions
function loadFromFirebase() {
  console.log('Loading from Firebase...');
  const topicsRef = ref(database, 'forum_topics');
  onValue(topicsRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Data received:', data);
    if (data) {
      forumTopics = Object.values(data);
      loadForumTopics();
      updateCategories(forumTopics);
    } else {
      displayForumTopics([]);
    }
  });
}

function displayForumTopics(topics) {
  if (!forumTopicsElement) {
    console.error('Forum topics element not found');
    return;
  }

  forumTopicsElement.innerHTML = '';
  if (topics.length === 0) {
    forumTopicsElement.innerHTML = '<p>No Results Found</p>';
    return;
  }

  topics.forEach((topic) => {
    const commentsText =
      topic.posts === 1 ? '1 Comment' : `${topic.posts} Comments`;
    const topicElement = document.createElement('div');
    topicElement.className = 'forum-topic';
    topicElement.innerHTML = `
      <h2>${escapeHTML(topic.title)}</h2>
      <p><i class="fas fa-user"></i> Posted by: <a href="#" class="user-profile-link" data-user-id="${
        topic.createdBy
      }">${escapeHTML(topic.createdByUser) || 'Anonymous'}</a></p>
      <p><i class="fas fa-folder"></i> ${escapeHTML(topic.category)}</p>
      <p><i class="fas fa-comments"></i> ${commentsText}</p>
      <p><i class="fas fa-clock"></i> Last Comment: ${new Date(
        topic.lastPost
      ).toLocaleString()}</p>
      <a href="#" class="view-post-link" data-topic-id="${
        topic.id
      }">View Post</a>
    `;
    forumTopicsElement.appendChild(topicElement);
  });

  addTopicEventListeners();
}

function loadForumTopics() {
  let filteredTopics = forumTopics;
  if (currentCategory !== 'all') {
    filteredTopics = forumTopics.filter(
      (topic) => topic.category.toLowerCase() === currentCategory
    );
  }
  const startIndex = (currentPage - 1) * topicsPerPage;
  const endIndex = startIndex + topicsPerPage;
  const paginatedTopics = filteredTopics.slice(startIndex, endIndex);
  displayForumTopics(paginatedTopics);
  updatePagination(Math.ceil(filteredTopics.length / topicsPerPage));
}

function updateCategories(topics) {
  const mainCategories = [
    'All',
    'Wellness',
    'Productivity',
    'Mindfulness',
    'ADHD Strategies',
  ];
  const categoriesSet = new Set(mainCategories);
  topics.forEach((topic) => {
    if (!categoriesSet.has(topic.category)) {
      categoriesSet.add(topic.category);
    }
  });

  moreCategoriesContent.innerHTML = '';

  categoriesSet.forEach((category) => {
    if (!mainCategories.includes(category)) {
      const button = document.createElement('button');
      button.className = 'category-btn';
      button.textContent = category;
      button.dataset.category = category.toLowerCase();
      button.addEventListener('click', () => {
        document
          .querySelectorAll('.category-btn')
          .forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        currentCategory = category.toLowerCase();
        currentPage = 1;
        loadForumTopics();
        moreCategoriesContent.style.display = 'none';
      });
      moreCategoriesContent.appendChild(button);
    }
  });
}

function updatePagination(totalPages) {
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

function addNewTopic(title, category, content) {
  if (!currentUser) {
    alert('You must be logged in to create a topic.');
    return;
  }

  if (content.length > 2000) {
    alert('Content exceeds 2000 characters. Please shorten your post.');
    return;
  }

  const topicsRef = ref(database, 'forum_topics');
  const newTopicRef = push(topicsRef);
  const newTopic = {
    id: newTopicRef.key,
    title: title,
    category: category,
    content: content,
    posts: 0,
    lastPost: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: currentUser.uid,
    createdByUser: currentUser.displayName || currentUser.email,
  };

  set(newTopicRef, newTopic)
    .then(() => {
      console.log('Topic added to Firebase');
      modal.style.display = 'none';
      newTopicForm.reset();
      loadFromFirebase();
    })
    .catch((error) => {
      console.error('Error adding topic:', error);
      alert(
        'An error occurred while creating the topic. Please try again later.'
      );
    });
}

function viewTopic(topicId) {
  const topicRef = ref(database, `forum_topics/${topicId}`);
  get(topicRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const topicData = snapshot.val();
        displayFullTopic(topicData);
      } else {
        console.log('No such topic!');
      }
    })
    .catch((error) => {
      console.error('Error fetching topic:', error);
    });
}

function displayFullTopic(topic) {
  const modal = document.createElement('div');
  modal.className = 'topic-modal';

  const isLoggedIn = !!currentUser;
  const replyFormHTML = isLoggedIn
    ? `
      <div class="reply-form">
        <textarea id="reply-content" rows="4" placeholder="Write your reply here..."></textarea>
        <button id="submit-reply" class="btn-primary">Submit Reply</button>
      </div>
    `
    : '';

  modal.innerHTML = `
    <div class="topic-modal-content">
      <span class="close-topic-modal">&times;</span>
      <h2>${escapeHTML(topic.title)}</h2>
      <p><strong>Posted by:</strong> <a href="#" class="user-link user-profile-link" data-user-id="${
        topic.createdBy
      }">${escapeHTML(topic.createdByUser) || 'Anonymous'}</a></p>
      <p><strong>Category:</strong> ${escapeHTML(topic.category)}</p>
      <p><strong>Created:</strong> ${new Date(
        topic.createdAt
      ).toLocaleString()}</p>
      <p><strong>Last Comment:</strong> ${new Date(
        topic.lastPost
      ).toLocaleString()}</p>
      <p id="post-count"><strong>Comments:</strong> ${topic.posts}</p>
      <p><strong>Content:</strong></p>
      <div class="topic-content">${escapeHTML(topic.content)}</div>
      <div class="topic-actions">
        <div class="like-section">
          <span id="like-btn" class="like-heart ${
            currentUser ? '' : 'disabled'
          }">
            <i class="fa-solid fa-heart"></i>
          </span>
          <span id="like-count">0</span>
        </div>
      </div>
      ${replyFormHTML}
      <div id="replies-container"></div>
    </div>
  `;

  document.body.appendChild(modal);
  applyDarkModeToElement(modal);

  addTopicModalEventListeners(modal, topic);
  loadReplies(topic.id, topic.createdBy);
  updateLikeButton(topic.id);
  updateLikeCount(topic.id);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  backToDashboardBtn.addEventListener('click', () => {
    window.location.href = 'logged.html';
  });

  categoryBtns.forEach((button) => {
    button.addEventListener('click', () => {
      categoryBtns.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      currentCategory = button.dataset.category;
      currentPage = 1;
      loadForumTopics();
    });
  });

  createTopicBtn.addEventListener('click', () => {
    if (currentUser) {
      modal.style.display = 'block';
    } else {
      alert('You must be logged in to create a post.');
    }
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  newTopicForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleElement = document.getElementById('new-topic-title');
    const categoryElement = document.getElementById('new-topic-category');
    const contentElement = document.getElementById('new-topic-content');

    if (!titleElement || !categoryElement || !contentElement) {
      console.error('One or more form elements are missing');
      alert('An error occurred. Please try again later.');
      return;
    }

    const title = titleElement.value.trim();
    const category = categoryElement.value.trim();
    const content = contentElement.value.trim();

    if (!title || !category || !content) {
      alert('Please fill in all fields.');
      return;
    }

    if (content.length > 2000) {
      alert('Content exceeds 2000 characters. Please shorten your post.');
      return;
    }

    addNewTopic(title, category, content);
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadForumTopics();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    currentPage++;
    loadForumTopics();
  });

  loginBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });

  logoutBtn.addEventListener('click', () => {
    auth
      .signOut()
      .then(() => {
        console.log('User signed out');
        updateAuthUI(null);
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  });

  profileBtn.addEventListener('click', () => {
    if (currentUser) {
      displayUserProfile(currentUser);
    } else {
      alert('Please log in to view your profile.');
    }
  });

  notificationsBtn.addEventListener('click', () => {
    if (currentUser) {
      displayNotifications(currentUser);
    } else {
      alert('Please log in to view your notifications.');
    }
  });

  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      const filteredTopics = forumTopics.filter(
        (topic) =>
          topic.title.toLowerCase().includes(searchTerm) ||
          topic.content.toLowerCase().includes(searchTerm)
      );
      currentPage = 1;
      displayForumTopics(filteredTopics);
    } else {
      loadForumTopics();
    }
  });

  categorySelect.addEventListener('change', handleCategorySelection);

  moreCategoriesBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    moreCategoriesContent.style.display =
      moreCategoriesContent.style.display === 'block' ? 'none' : 'block';
  });

  // Dark mode toggle
  const isDarkMode = localStorage.getItem('darkMode') === 'true';

  // Set initial dark mode state
  if (isDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Toggle dark mode
  darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkModeNow = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkModeNow);
    darkModeToggle.innerHTML = isDarkModeNow
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  });

  // Initialize the forum
  loadFromFirebase();

  // Auth state change listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is signed in');
      currentUser = user;
      updateAuthUI(user);
      updateNotificationBadge(user);
    } else {
      console.log('No user is signed in');
      currentUser = null;
      updateAuthUI(null);
    }
  });
});

// Helper Functions
function updateAuthUI(user) {
  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    profileBtn.style.display = 'inline-block';
    notificationsBtn.style.display = 'inline-block';
    createTopicBtn.disabled = false;
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    profileBtn.style.display = 'none';
    notificationsBtn.style.display = 'none';
    createTopicBtn.disabled = true;
  }
}

function escapeHTML(str) {
  if (str === undefined || str === null) {
    return '';
  }
  return str.toString().replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      }[tag] || tag)
  );
}

function addTopicEventListeners() {
  const viewPostLinks = document.querySelectorAll('.view-post-link');
  viewPostLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const topicId = link.getAttribute('data-topic-id');
      viewTopic(topicId);
    });
  });

  const userProfileLinks = document.querySelectorAll('.user-profile-link');
  userProfileLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = link.getAttribute('data-user-id');
      viewUserProfile(userId);
    });
  });
}

function addTopicModalEventListeners(modal, topic) {
  const closeBtn = modal.querySelector('.close-topic-modal');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  const submitReplyBtn = document.getElementById('submit-reply');
  if (submitReplyBtn) {
    submitReplyBtn.addEventListener('click', () => {
      if (currentUser) {
        const replyContent = document
          .getElementById('reply-content')
          .value.trim();
        if (replyContent) {
          addReply(topic.id, replyContent);
          document.getElementById('reply-content').value = ''; // Clear the textarea
        } else {
          alert('Please enter a reply before submitting.');
        }
      } else {
        alert('You must be logged in to reply.');
      }
    });
  }

  document.getElementById('like-btn').addEventListener('click', () => {
    if (currentUser) {
      toggleLike(topic.id);
    } else {
      alert('You must be logged in to like posts.');
    }
  });

  const userProfileLink = modal.querySelector('.user-profile-link');
  userProfileLink.addEventListener('click', (e) => {
    e.preventDefault();
    viewUserProfile(topic.createdBy);
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

function handleCategorySelection() {
  const categorySelect = document.getElementById('new-topic-category');
  const customCategoryInput = document.getElementById('custom-category-input');

  if (categorySelect.value === 'Custom') {
    customCategoryInput.style.display = 'block';
    customCategoryInput.required = true;
  } else {
    customCategoryInput.style.display = 'none';
    customCategoryInput.required = false;
  }
}

function addReply(topicId, replyContent) {
  if (!currentUser) {
    alert('You must be logged in to reply.');
    return;
  }

  const repliesRef = ref(database, `replies/${topicId}`);
  const newReplyRef = push(repliesRef);
  const newReply = {
    id: newReplyRef.key,
    content: replyContent,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.uid,
    createdByUser: currentUser.displayName || currentUser.email,
  };

  set(newReplyRef, newReply)
    .then(() => {
      console.log('Reply added');
      updateTopicPostCount(topicId);
      loadReplies(topicId);

      get(ref(database, `forum_topics/${topicId}`)).then((snapshot) => {
        const topic = snapshot.val();
        if (topic && topic.createdBy !== currentUser.uid) {
          createNotification(
            topic.createdBy,
            'reply',
            topicId,
            `${
              currentUser.displayName || currentUser.email
            } replied to your post "${topic.title}"`
          );
        }
      });
    })
    .catch((error) => {
      console.error('Error adding reply:', error);
      alert('An error occurred while adding the reply. Please try again.');
    });
}

function loadReplies(topicId, topicCreatorId) {
  const repliesRef = ref(database, `replies/${topicId}`);
  onValue(repliesRef, (snapshot) => {
    const replies = snapshot.val();
    const repliesContainer = document.getElementById('replies-container');
    repliesContainer.innerHTML = '<h3>Comments:</h3>';
    if (replies) {
      Object.entries(replies).forEach(([replyId, reply]) => {
        const isCurrentUserReply =
          currentUser && currentUser.uid === reply.createdBy;
        const isCreatorReply = reply.createdBy === topicCreatorId;
        const replyElement = document.createElement('div');
        replyElement.className = 'reply';
        replyElement.innerHTML = `
          <div class="reply-content">
            <p>${escapeHTML(reply.content)}</p>
            <small>
              Commented by 
              <a href="#" class="user-link user-profile-link" data-user-id="${
                reply.createdBy
              }">
                ${escapeHTML(reply.createdByUser)}
              </a>
              ${
                isCreatorReply
                  ? '<span class="creator-badge">Creator</span>'
                  : ''
              }
              on ${new Date(reply.createdAt).toLocaleString()}
            </small>
          </div>
          <div class="reply-actions">
            <button class="reply-to-reply-btn">Reply</button>
            ${
              isCurrentUserReply
                ? `
              <button class="delete-reply-btn">
                <i class="fas fa-trash"></i>
              </button>
            `
                : ''
            }
          </div>
          <div class="nested-replies" id="nested-replies-${replyId}"></div>
        `;

        const replyToReplyBtn = replyElement.querySelector(
          '.reply-to-reply-btn'
        );
        replyToReplyBtn.addEventListener('click', () =>
          addNestedReply(topicId, replyId, 1)
        );

        repliesContainer.appendChild(replyElement);
        loadNestedReplies(topicId, replyId, 1);

        if (isCurrentUserReply) {
          const deleteButton = replyElement.querySelector('.delete-reply-btn');
          deleteButton.addEventListener('click', () =>
            deleteReply(topicId, replyId)
          );
        }
      });

      const userProfileLinks =
        repliesContainer.querySelectorAll('.user-profile-link');
      userProfileLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const userId = link.getAttribute('data-user-id');
          viewUserProfile(userId);
        });
      });
    } else {
      repliesContainer.innerHTML += '<p>No replies yet.</p>';
    }
  });
}

function displayUserProfile(user) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Your Profile</h2>
      <div id="profile-info">
        <p><strong>Name:</strong> <span id="display-name">${
          escapeHTML(user.displayName) || 'Not set'
        }</span></p>
        <p><strong>Email:</strong> ${escapeHTML(user.email)}</p>
      </div>
      <button id="edit-profile-btn" class="btn-primary">Edit Profile</button>
      <div id="edit-profile-form" style="display: none;">
        <input type="text" id="edit-display-name" placeholder="Enter new display name">
        <button id="save-profile-btn" class="btn-primary">Save Changes</button>
      </div>
      <div id="user-stats">
        <h3>Your Activity</h3>
        <p>Topics created: <span id="topics-count">Loading...</span></p>
        <p>Replies posted: <span id="replies-count">Loading...</span></p>
      </div>
      <div id="user-topics"><h3>Your Topics</h3><p>Loading...</p></div>
      <div id="user-replies"><h3>Your Recent Replies</h3><p>Loading...</p></div>
    </div>
  `;

  document.body.appendChild(modal);
  applyDarkModeToElement(modal);

  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Edit profile functionality
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const editProfileForm = document.getElementById('edit-profile-form');
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const editDisplayNameInput = document.getElementById('edit-display-name');
  const displayNameSpan = document.getElementById('display-name');

  editProfileBtn.addEventListener('click', () => {
    editProfileForm.style.display = 'block';
    editDisplayNameInput.value = user.displayName || '';
  });

  saveProfileBtn.addEventListener('click', () => {
    const newDisplayName = editDisplayNameInput.value.trim();
    if (newDisplayName) {
      updateProfile(user, { displayName: newDisplayName })
        .then(() => {
          displayNameSpan.textContent = newDisplayName;
          editProfileForm.style.display = 'none';
          alert('Profile updated successfully!');
        })
        .catch((error) => {
          console.error('Error updating profile:', error);
          alert(
            'An error occurred while updating your profile. Please try again.'
          );
        });
    }
  });

  // Load user stats and content
  loadUserStats(user.uid);
  loadUserContent(user.uid);
}

function loadUserStats(userId) {
  const topicsCountSpan = document.getElementById('topics-count');
  const repliesCountSpan = document.getElementById('replies-count');

  // Count topics
  const userTopicsRef = query(
    ref(database, 'forum_topics'),
    orderByChild('createdBy'),
    equalTo(userId)
  );
  get(userTopicsRef).then((snapshot) => {
    const topicsCount = snapshot.size;
    topicsCountSpan.textContent = topicsCount;
  });

  // Count replies
  const repliesRef = ref(database, 'replies');
  get(repliesRef).then((snapshot) => {
    let repliesCount = 0;
    snapshot.forEach((topicSnapshot) => {
      topicSnapshot.forEach((replySnapshot) => {
        if (replySnapshot.val().createdBy === userId) {
          repliesCount++;
        }
      });
    });
    repliesCountSpan.textContent = repliesCount;
  });
}

function loadUserContent(userId) {
  loadUserTopics(userId);
  loadUserReplies(userId);
}

function loadUserTopics(userId) {
  const userTopicsRef = query(
    ref(database, 'forum_topics'),
    orderByChild('createdBy'),
    equalTo(userId)
  );

  get(userTopicsRef)
    .then((snapshot) => {
      const userTopics = snapshot.val();
      const userTopicsElement = document.getElementById('user-topics');
      if (userTopics) {
        userTopicsElement.innerHTML = "<h3>User's Topics</h3>";
        const topicsArray = Object.values(userTopics);
        topicsArray.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        topicsArray.slice(0, 5).forEach((topic) => {
          userTopicsElement.innerHTML += `
          <p><a href="#" class="viewTopic" onclick="viewTopic('${
            topic.id
          }'); return false;">${escapeHTML(topic.title)}
          <span class="topic-arrow">&#8599;</span></a>
          </p>
        `;
        });
      } else {
        userTopicsElement.innerHTML =
          "<h3>User's Topics</h3><p>This user hasn't created any topics yet.</p>";
      }
    })
    .catch((error) => {
      console.error('Error loading user topics:', error);
      const userTopicsElement = document.getElementById('user-topics');
      userTopicsElement.innerHTML =
        "<h3>User's Topics</h3><p>Error loading topics. Please try again later.</p>";
    });
}

function loadUserReplies(userId) {
  const userRepliesElement = document.getElementById('user-replies');
  userRepliesElement.innerHTML = "<h3>User's Recent Replies</h3>";
  const repliesRef = ref(database, 'replies');
  get(repliesRef)
    .then((snapshot) => {
      const allReplies = snapshot.val();
      let userReplies = [];
      if (allReplies) {
        Object.entries(allReplies).forEach(([topicId, replies]) => {
          Object.entries(replies).forEach(([replyId, reply]) => {
            if (reply.createdBy === userId) {
              userReplies.push({ topicId, reply });
            }
          });
        });
      }
      if (userReplies.length > 0) {
        userReplies.sort(
          (a, b) => new Date(b.reply.createdAt) - new Date(a.reply.createdAt)
        );
        userReplies.slice(0, 5).forEach(({ topicId, reply }) => {
          get(ref(database, `forum_topics/${topicId}`))
            .then((topicSnapshot) => {
              const topic = topicSnapshot.val();
              if (topic) {
                userRepliesElement.innerHTML += `
              <div>
                <p>
                  <strong>Topic:</strong> 
                  <a href="#" class="viewTopic" onclick="viewTopic('${topicId}'); return false;">${escapeHTML(
                  topic.title
                )}
                <span class="topic-arrow">&#8599;</span></a></a>
                </p>
                <p><strong>Reply:</strong> ${escapeHTML(
                  reply.content.substring(0, 100)
                )}${reply.content.length > 100 ? '...' : ''}</p>
              </div>
            `;
              }
            })
            .catch((error) => {
              console.error('Error loading topic for reply:', error);
            });
        });
      } else {
        userRepliesElement.innerHTML +=
          "<p>This user hasn't replied to any topics yet.</p>";
      }
    })
    .catch((error) => {
      console.error('Error loading user replies:', error);
      userRepliesElement.innerHTML +=
        '<p>Error loading replies. Please try again later.</p>';
    });
}

function updateProfile(user, updates) {
  return updateAuthProfile(user, updates)
    .then(() => {
      return update(ref(database, `users/${user.uid}`), updates);
    })
    .catch((error) => {
      console.error('Error updating profile:', error);
      throw error;
    });
}

function loadNestedReplies(topicId, parentReplyId, level = 1) {
  const nestedRepliesRef = ref(
    database,
    `replies/${topicId}/${parentReplyId}/nestedReplies`
  );
  onValue(nestedRepliesRef, (snapshot) => {
    const nestedReplies = snapshot.val();
    const nestedRepliesContainer = document.getElementById(
      `nested-replies-${parentReplyId}`
    );
    if (nestedRepliesContainer) {
      nestedRepliesContainer.innerHTML = '';
      if (nestedReplies) {
        const nestedRepliesList = document.createElement('ul');
        nestedRepliesList.className = 'nested-replies-list';
        Object.entries(nestedReplies).forEach(
          ([nestedReplyId, nestedReply]) => {
            const nestedReplyElement = document.createElement('li');
            nestedReplyElement.className = `nested-reply level-${level}`;
            nestedReplyElement.innerHTML = `
            <div class="nested-reply-content">
              <p>${escapeHTML(nestedReply.content)}</p>
              <div class="nested-reply-meta">
                <span class="nested-reply-author">
                  <i class="fas fa-user"></i> 
                  <a href="#" class="user-link user-profile-link" data-user-id="${
                    nestedReply.createdBy
                  }">
                    ${escapeHTML(nestedReply.createdByUser)}
                  </a></span>
                  <span class="nested-reply-date">
                    <i class="fas fa-clock"></i> 
                    ${new Date(nestedReply.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div class="nested-reply-actions">
                <button class="reply-to-nested-reply-btn">Reply</button>
              </div>
              <div class="nested-replies" id="nested-replies-${nestedReplyId}"></div>
            `;
            nestedRepliesList.appendChild(nestedReplyElement);

            const replyToNestedReplyBtn = nestedReplyElement.querySelector(
              '.reply-to-nested-reply-btn'
            );
            replyToNestedReplyBtn.addEventListener('click', () =>
              addNestedReply(topicId, nestedReplyId, level + 1)
            );

            loadNestedReplies(topicId, nestedReplyId, level + 1);
          }
        );
        nestedRepliesContainer.appendChild(nestedRepliesList);

        const userProfileLinks =
          nestedRepliesContainer.querySelectorAll('.user-profile-link');
        userProfileLinks.forEach((link) => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const userId = link.getAttribute('data-user-id');
            viewUserProfile(userId);
          });
        });
      }
    }
  });
}

function addNestedReply(topicId, parentReplyId, level = 1) {
  if (!currentUser) {
    alert('You must be logged in to reply.');
    return;
  }

  const parentReplyElement = document.getElementById(
    `nested-replies-${parentReplyId}`
  );
  if (!parentReplyElement) {
    console.error(
      `Parent reply element not found for ID: nested-replies-${parentReplyId}`
    );
    return;
  }

  const existingReplyInput = parentReplyElement.querySelector(
    '.nested-reply-input'
  );
  if (existingReplyInput) {
    parentReplyElement.removeChild(existingReplyInput);
  }

  const replyInput = document.createElement('div');
  replyInput.className = 'nested-reply-input';
  replyInput.innerHTML = `
      <textarea id="nested-reply-content-${parentReplyId}" rows="3" placeholder="Type your reply here..."></textarea>
      <div class="nested-reply-actions">
        <button id="submit-nested-reply-${parentReplyId}" class="btn-primary">Submit</button>
        <button id="cancel-nested-reply-${parentReplyId}" class="btn-secondary">Cancel</button>
      </div>
    `;

  parentReplyElement.appendChild(replyInput);

  const submitReply = () => {
    const replyContent = document
      .getElementById(`nested-reply-content-${parentReplyId}`)
      .value.trim();

    if (replyContent) {
      const nestedRepliesRef = ref(
        database,
        `replies/${topicId}/${parentReplyId}/nestedReplies`
      );
      const newNestedReplyRef = push(nestedRepliesRef);
      const newNestedReply = {
        id: newNestedReplyRef.key,
        content: replyContent,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByUser: currentUser.displayName || currentUser.email,
        level: level,
      };

      set(newNestedReplyRef, newNestedReply)
        .then(() => {
          console.log('Nested reply added successfully');
          loadNestedReplies(topicId, parentReplyId, level);
        })
        .catch((error) => {
          console.error('Error adding nested reply:', error);
          alert('An error occurred while adding the reply. Please try again.');
        });

      if (parentReplyElement.contains(replyInput)) {
        parentReplyElement.removeChild(replyInput);
      }
    } else {
      alert('Please enter a reply before submitting.');
    }
  };

  const cancelReply = () => {
    if (parentReplyElement.contains(replyInput)) {
      parentReplyElement.removeChild(replyInput);
    }
  };

  document
    .getElementById(`submit-nested-reply-${parentReplyId}`)
    .addEventListener('click', submitReply);
  document
    .getElementById(`cancel-nested-reply-${parentReplyId}`)
    .addEventListener('click', cancelReply);
}

function updateTopicPostCount(topicId) {
  const repliesRef = ref(database, `replies/${topicId}`);
  get(repliesRef).then((snapshot) => {
    const replies = snapshot.val();
    let replyCount = 0;

    if (replies) {
      Object.values(replies).forEach((reply) => {
        replyCount++;
        if (reply.nestedReplies) {
          replyCount += Object.keys(reply.nestedReplies).length;
        }
      });
    }

    const topicRef = ref(database, `forum_topics/${topicId}`);
    get(topicRef).then((topicSnapshot) => {
      if (topicSnapshot.exists()) {
        const topic = topicSnapshot.val();
        set(topicRef, {
          ...topic,
          posts: replyCount,
          lastPost: new Date().toISOString(),
        });
      }
    });
  });
}

function toggleLike(topicId) {
  if (!currentUser) {
    alert('You must be logged in to like posts.');
    return;
  }

  const likeRef = ref(database, `likes/${topicId}/${currentUser.uid}`);
  get(likeRef).then((snapshot) => {
    if (snapshot.exists()) {
      set(likeRef, null);
    } else {
      set(likeRef, true);

      get(ref(database, `forum_topics/${topicId}`)).then((snapshot) => {
        const topic = snapshot.val();
        if (topic && topic.createdBy !== currentUser.uid) {
          createNotification(
            topic.createdBy,
            'like',
            topicId,
            `${currentUser.displayName || currentUser.email} liked your post "${
              topic.title
            }"`
          );
        }
      });
    }
    updateLikeButton(topicId);
    updateLikeCount(topicId);
  });
}

function updateLikeButton(topicId) {
  const likeBtn = document.getElementById('like-btn');
  const likeRef = ref(database, `likes/${topicId}/${currentUser.uid}`);
  get(likeRef).then((snapshot) => {
    if (snapshot.exists()) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
  });
}

function updateLikeCount(topicId) {
  const likeCountElement = document.getElementById('like-count');
  const likesRef = ref(database, `likes/${topicId}`);
  onValue(likesRef, (snapshot) => {
    const likes = snapshot.val();
    const likeCount = likes ? Object.keys(likes).length : 0;
    likeCountElement.textContent = likeCount;
  });
}

function deleteReply(topicId, replyId) {
  if (!currentUser) {
    alert('You must be logged in to delete a reply.');
    return;
  }

  if (confirm('Are you sure you want to delete this reply?')) {
    const replyRef = ref(database, `replies/${topicId}/${replyId}`);
    get(replyRef).then((snapshot) => {
      if (snapshot.exists()) {
        const reply = snapshot.val();
        if (reply.createdBy === currentUser.uid) {
          remove(replyRef)
            .then(() => {
              console.log('Reply deleted successfully');
              updateTopicPostCount(topicId);
            })
            .catch((error) => {
              console.error('Error deleting reply:', error);
              alert(
                'An error occurred while deleting the reply. Please try again.'
              );
            });
        } else {
          alert('You can only delete your own replies.');
        }
      } else {
        alert('This reply no longer exists.');
      }
    });
  }
}

function viewUserProfile(userId) {
  const userRef = ref(database, `users/${userId}`);
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        displayOtherUserProfile(userData);
      } else {
        console.log('No user data found');
        alert('User profile not found.');
      }
    })
    .catch((error) => {
      console.error('Error fetching user profile:', error);
      alert(
        'An error occurred while fetching the user profile. Please try again later.'
      );
    });
}

function displayOtherUserProfile(user) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>User Profile</h2>
        <p><strong>Name:</strong> ${
          escapeHTML(user.displayName) || 'Not set'
        }</p>
        <p><strong>Email:</strong> ${escapeHTML(user.email)}</p>
        <div id="user-topics"><h3>User's Topics</h3><p>Loading...</p></div>
        <div id="user-replies"><h3>User's Replies</h3><p>Loading...</p></div>
      </div>
    `;

  document.body.appendChild(modal);
  applyDarkModeToElement(modal);

  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });

  loadUserContent(user.uid);
}

function createNotification(userId, type, topicId, content) {
  const notificationsRef = ref(database, `notifications/${userId}`);
  const newNotificationRef = push(notificationsRef);
  const notification = {
    type: type,
    topicId: topicId,
    createdAt: serverTimestamp(),
    read: false,
    content: content,
  };
  set(newNotificationRef, notification)
    .then(() => {
      console.log('Notification created successfully', notification);
    })
    .catch((error) => {
      console.error('Error creating notification:', error);
    });
}

function displayNotifications(user) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Notifications</h2>
        <div class="notification-actions">
          <button id="read-all-btn" class="btn-secondary">Mark All as Read</button>
          <button id="clear-all-btn" class="btn-secondary">Clear All</button>
        </div>
        <div id="notifications-list"></div>
      </div>
    `;

  document.body.appendChild(modal);
  applyDarkModeToElement(modal);

  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  const readAllBtn = document.getElementById('read-all-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');

  readAllBtn.addEventListener('click', () =>
    markAllNotificationsAsRead(user.uid)
  );
  clearAllBtn.addEventListener('click', () => clearAllNotifications(user.uid));

  loadNotifications(user.uid);
}

function loadNotifications(userId) {
  const notificationsRef = ref(database, `notifications/${userId}`);
  onValue(notificationsRef, (snapshot) => {
    const notifications = snapshot.val();
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '';

    if (notifications) {
      Object.entries(notifications)
        .reverse()
        .forEach(([notificationId, notification]) => {
          const notificationElement = document.createElement('div');
          notificationElement.className = `notification ${
            notification.read ? 'read' : 'unread'
          }`;
          notificationElement.innerHTML = `
            <p>${escapeHTML(notification.content)}</p>
            <small>${new Date(notification.createdAt).toLocaleString()}</small>
          `;
          notificationElement.addEventListener('click', () => {
            markNotificationAsRead(userId, notificationId);
            viewTopic(notification.topicId);
          });
          notificationsList.appendChild(notificationElement);
        });
    } else {
      notificationsList.innerHTML = '<p>No notifications</p>';
    }
  });
}

function markAllNotificationsAsRead(userId) {
  const notificationsRef = ref(database, `notifications/${userId}`);
  get(notificationsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const updates = {};
      snapshot.forEach((childSnapshot) => {
        updates[`${childSnapshot.key}/read`] = true;
      });
      update(notificationsRef, updates);
    }
  });
}

function clearAllNotifications(userId) {
  const notificationsRef = ref(database, `notifications/${userId}`);
  remove(notificationsRef);
}

function markNotificationAsRead(userId, notificationId) {
  const notificationRef = ref(
    database,
    `notifications/${userId}/${notificationId}`
  );
  update(notificationRef, { read: true });
}

function updateNotificationBadge(user) {
  const badge = document.querySelector('.notification-badge');
  const notificationsRef = ref(database, `notifications/${user.uid}`);
  onValue(notificationsRef, (snapshot) => {
    const notifications = snapshot.val();
    let unreadCount = 0;
    if (notifications) {
      Object.values(notifications).forEach((notification) => {
        if (!notification.read) unreadCount++;
      });
    }
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  });
}

function applyDarkModeToElement(element) {
  if (body.classList.contains('dark-mode')) {
    element.classList.add('dark-mode');
  }
}

// Make necessary functions available globally
window.viewTopic = viewTopic;
window.viewUserProfile = viewUserProfile;
window.deleteReply = deleteReply;
