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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const auth = window.auth;
const database = window.database;

let forumTopics = [];
let currentUser = null;
const forumTopicsElement = document.getElementById('forum-topics');

function loadFromFirebase() {
  const topicsRef = ref(database, 'forum_topics');
  onValue(topicsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      forumTopics = Object.values(data);
      displayForumTopics(forumTopics);
    } else {
      forumTopicsElement.innerHTML = '<p>No Results Found</p>';
    }
  });
}

function displayForumTopics(topics) {
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
      <h2>${topic.title}</h2>
      <p><i class="fas fa-user"></i> Posted by: ${
        topic.createdByUser || 'Anonymous'
      }</p>
      <p><i class="fas fa-folder"></i> ${topic.category}</p>
      <p><i class="fas fa-comments"></i> ${commentsText}</p>
      <p><i class="fas fa-clock"></i> Last Comment: ${new Date(
        topic.lastPost
      ).toLocaleString()}</p>
      <a href="#" onclick="window.viewTopic('${topic.id}')">View Post</a>
    `;
    forumTopicsElement.appendChild(topicElement);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadFromFirebase();

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
  categorySelect.addEventListener('change', handleCategorySelection);

  let currentPage = 1;
  let topicsPerPage = 9;
  let currentCategory = 'all';

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is signed in');
      updateAuthUI(user);
      updateNotificationBadge(user);
    } else {
      console.log('No user is signed in');
      updateAuthUI(null);
    }
  });

  backToDashboardBtn.addEventListener('click', () => {
    window.location.href = 'logged.html';
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

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  newTopicForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('new-topic-title').value;
    const category = document.getElementById('new-topic-category').value;
    const content = document.getElementById('new-topic-content').value;

    if (title && category && content) {
      addNewTopic(title, category, content);
    }
  });

  categoryBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      currentPage = 1;
      loadForumTopics();
    });
  });

  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredTopics = forumTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(searchTerm) ||
        topic.content.toLowerCase().includes(searchTerm)
    );
    displayForumTopics(filteredTopics);
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

  function addNewTopic(title, category, content) {
    if (!currentUser) {
      alert('You must be logged in to create a topic.');
      return;
    }

    const customCategoryInput = document.getElementById('custom-category');
    if (category === 'Custom') {
      category = customCategoryInput.value.trim();
      if (!category) {
        alert('Please enter a custom category name.');
        return;
      }
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

  function loadForumTopics() {
    let filteredTopics = forumTopics;
    if (currentCategory !== 'all') {
      filteredTopics = forumTopics.filter(
        (topic) => topic.category === currentCategory
      );
    }
    const startIndex = (currentPage - 1) * topicsPerPage;
    const endIndex = startIndex + topicsPerPage;
    const paginatedTopics = filteredTopics.slice(startIndex, endIndex);
    displayForumTopics(paginatedTopics);
    updatePagination(Math.ceil(filteredTopics.length / topicsPerPage));
  }

  function updatePagination(totalPages) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  }

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

  function updateAuthUI(user) {
    currentUser = user;
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

  loadForumTopics();
});

window.viewTopic = function (topicId) {
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
};

function displayFullTopic(topic) {
  const modal = document.createElement('div');
  modal.className = 'topic-modal';

  const isLoggedIn = !!currentUser;
  const replyBtnDisabled = isLoggedIn ? '' : 'disabled';
  const likeBtnDisabled = isLoggedIn ? '' : 'disabled';

  modal.innerHTML = `
  <div class="topic-modal-content">
    <span class="close-topic-modal">&times;</span>
    <h2>${topic.title}</h2>
    <p><strong>Posted by:</strong> ${topic.createdByUser || 'Anonymous'}</p>
    <p><strong>Category:</strong> ${topic.category}</p>
    <p><strong>Created:</strong> ${new Date(
      topic.createdAt
    ).toLocaleString()}</p>
    <p><strong>Last Comment:</strong> ${new Date(
      topic.lastPost
    ).toLocaleString()}</p>
    <p id="post-count"><strong>Comments:</strong> ${topic.posts}</p>
    <p><strong>Content:</strong></p>
    <div class="topic-content" style="margin-bottom: 20px;">${
      topic.content
    }</div>
    <div class="topic-actions" style="margin-bottom: 20px;">
      <div class="like-section">
        <span id="like-btn" class="like-heart ${
          currentUser ? '' : 'disabled'
        }">&#10084;</span>
        <span id="like-count">0</span>
      </div>
      <button id="reply-btn" class="btn-primary" ${
        currentUser ? '' : 'disabled'
      }>Reply</button>
    </div>
    <div id="replies-container"></div>
  </div>
`;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.close-topic-modal');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  document.getElementById('reply-btn').addEventListener('click', () => {
    if (currentUser) {
      addReply(topic.id);
    } else {
      alert('You must be logged in to reply.');
    }
  });

  document.getElementById('like-btn').addEventListener('click', () => {
    if (currentUser) {
      toggleLike(topic.id);
    } else {
      alert('You must be logged in to like posts.');
    }
  });

  const postCountElement = document.createElement('p');
  postCountElement.id = 'post-count';
  postCountElement.innerHTML = `<strong>Comments:</strong> ${topic.posts}`;
  modal
    .querySelector('.topic-modal-content')
    .insertBefore(
      postCountElement,
      document.getElementById('replies-container')
    );

  const postCountRef = ref(database, `forum_topics/${topic.id}/posts`);
  onValue(postCountRef, (snapshot) => {
    const postCount = snapshot.val();
    postCountElement.innerHTML = `<strong>Comments:</strong> ${postCount}`;
  });

  loadReplies(topic.id, topic.createdBy);
  updateLikeButton(topic.id);
  updateLikeCount(topic.id);

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

function addReply(topicId) {
  if (!currentUser) {
    alert('You must be logged in to reply.');
    return;
  }

  const replyContent = prompt('Enter your reply:');
  if (replyContent) {
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

        // Create notification for topic creator
        get(ref(database, `forum_topics/${topicId}`)).then((snapshot) => {
          const topic = snapshot.val();
          if (topic && topic.createdBy !== currentUser.uid) {
            console.log('Triggering reply notification');
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
}

function loadReplies(topicId, topicCreatorId) {
  const repliesRef = ref(database, `replies/${topicId}`);
  onValue(repliesRef, (snapshot) => {
    const replies = snapshot.val();
    const repliesContainer = document.getElementById('replies-container');
    repliesContainer.innerHTML = '<h3>Replies:</h3>';
    if (replies) {
      Object.entries(replies).forEach(([replyId, reply]) => {
        const isCurrentUserReply =
          currentUser && currentUser.uid === reply.createdBy;
        const isCreatorReply = reply.createdBy === topicCreatorId;
        const replyElement = document.createElement('div');
        replyElement.className = 'reply';
        replyElement.innerHTML = `
          <div class="reply-content">
            <p>${reply.content}</p>
            <small>
            Commented by 
            <a href="#" class="user-profile-link" data-user-id="${
              reply.createdBy
            }">
              ${reply.createdByUser}
            </a>
            ${
              isCreatorReply ? '<span class="creator-badge">Creator</span>' : ''
            }
            on ${new Date(reply.createdAt).toLocaleString()}
          </small>
        </div>
      `;

        if (isCurrentUserReply) {
          const deleteButton = document.createElement('button');
          deleteButton.className = 'delete-reply-btn';
          deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
          deleteButton.addEventListener('click', () =>
            deleteReply(topicId, replyId)
          );
          replyElement.appendChild(deleteButton);
        }

        repliesContainer.appendChild(replyElement);
      });

      // Add event listeners for user profile links
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

function updateTopicPostCount(topicId) {
  const repliesRef = ref(database, `replies/${topicId}`);
  get(repliesRef).then((snapshot) => {
    const replies = snapshot.val();
    const replyCount = replies ? Object.keys(replies).length : 0;

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

      // Create notification for topic creator
      get(ref(database, `forum_topics/${topicId}`)).then((snapshot) => {
        const topic = snapshot.val();
        if (topic && topic.createdBy !== currentUser.uid) {
          console.log('Triggering like notification');
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

function displayUserProfile(user) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
  <div class="modal-content">
    <span class="close">&times;</span>
    <h2>User Profile</h2>
    <p><strong>Name:</strong> ${user.displayName || 'Not set'}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <div id="user-topics"><h3>Your Posts</h3><p>Loading...</p></div>
    <div id="user-likes"><h3>Your Likes</h3><p>Loading...</p></div>
    <div id="user-replies"><h3>Your Replies</h3><p>Loading...</p></div>
  </div>
`;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Load user's topics
  const userTopicsRef = query(
    ref(database, 'forum_topics'),
    orderByChild('createdBy'),
    equalTo(user.uid)
  );
  get(userTopicsRef).then((snapshot) => {
    const userTopics = snapshot.val();
    const userTopicsElement = document.getElementById('user-topics');
    if (userTopics) {
      userTopicsElement.innerHTML = '<h3>Your Posts</h3>';
      Object.values(userTopics).forEach((topic) => {
        userTopicsElement.innerHTML += `<p>${topic.title}</p>`;
      });
    } else {
      userTopicsElement.innerHTML = "<p>You haven't created any posts yet.</p>";
    }
  });

  // Load user's likes
  const userLikesElement = document.getElementById('user-likes');
  userLikesElement.innerHTML = '<h3>Your Likes</h3>';
  const likesRef = ref(database, 'likes');
  get(likesRef).then((snapshot) => {
    const allLikes = snapshot.val();
    let userLikes = [];
    if (allLikes) {
      Object.entries(allLikes).forEach(([topicId, likes]) => {
        if (likes[user.uid]) {
          userLikes.push(topicId);
        }
      });
    }
    if (userLikes.length > 0) {
      userLikes.forEach((topicId) => {
        get(ref(database, `forum_topics/${topicId}`)).then((topicSnapshot) => {
          const topic = topicSnapshot.val();
          if (topic) {
            userLikesElement.innerHTML += `
            <p>
              <a href="#" onclick="viewTopic('${topicId}'); return false;">${topic.title}</a>
            </p>
          `;
          }
        });
      });
    } else {
      userLikesElement.innerHTML += "<p>You haven't liked any posts yet.</p>";
    }
  });

  // Load user's replies
  const userRepliesElement = document.getElementById('user-replies');
  userRepliesElement.innerHTML = '<h3>Your Replies</h3>';
  const repliesRef = ref(database, 'replies');
  get(repliesRef).then((snapshot) => {
    const allReplies = snapshot.val();
    let userReplies = [];
    if (allReplies) {
      Object.entries(allReplies).forEach(([topicId, replies]) => {
        Object.entries(replies).forEach(([replyId, reply]) => {
          if (reply.createdBy === user.uid) {
            userReplies.push({ topicId, replyId, reply });
          }
        });
      });
    }
    if (userReplies.length > 0) {
      userReplies.forEach(({ topicId, replyId, reply }) => {
        get(ref(database, `forum_topics/${topicId}`)).then((topicSnapshot) => {
          const topic = topicSnapshot.val();
          if (topic) {
            userRepliesElement.innerHTML += `
            <div class="user-reply">
              <div class="user-reply-content">${reply.content}</div>
              <div class="user-reply-actions">
                <span class="user-reply-topic">
                  Post: <a href="#" onclick="viewTopic('${topicId}'); return false;">${topic.title}</a>
                </span>
                <button class="delete-user-reply-btn" onclick="deleteReply('${topicId}', '${replyId}')">
                  Delete Reply
                </button>
              </div>
            </div>
          `;
          }
        });
      });
    } else {
      userRepliesElement.innerHTML +=
        "<p>You haven't replied to any topics yet.</p>";
    }
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
      alert('An error occurred while fetching the user profile.');
    });
}

function displayOtherUserProfile(user) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
  <div class="modal-content">
    <span class="close">&times;</span>
    <h2>User Profile</h2>
    <p><strong>Name:</strong> ${user.displayName || 'Not set'}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <div id="user-topics"><h3>User's Topics</h3><p>Loading...</p></div>
    <div id="user-replies"><h3>User's Replies</h3><p>Loading...</p></div>
  </div>
`;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Load user's topics
  const userTopicsRef = query(
    ref(database, 'forum_topics'),
    orderByChild('createdBy'),
    equalTo(user.uid)
  );
  get(userTopicsRef).then((snapshot) => {
    const userTopics = snapshot.val();
    const userTopicsElement = document.getElementById('user-topics');
    if (userTopics) {
      userTopicsElement.innerHTML = "<h3>User's Topics</h3>";
      Object.values(userTopics).forEach((topic) => {
        userTopicsElement.innerHTML += `
        <p><a href="#" onclick="viewTopic('${topic.id}'); return false;">${topic.title}</a></p>
      `;
      });
    } else {
      userTopicsElement.innerHTML =
        "<p>This user hasn't created any topics yet.</p>";
    }
  });

  // Load user's replies
  const userRepliesElement = document.getElementById('user-replies');
  userRepliesElement.innerHTML = "<h3>User's Replies</h3>";
  const repliesRef = ref(database, 'replies');
  get(repliesRef).then((snapshot) => {
    const allReplies = snapshot.val();
    let userReplies = [];
    if (allReplies) {
      Object.entries(allReplies).forEach(([topicId, replies]) => {
        Object.entries(replies).forEach(([replyId, reply]) => {
          if (reply.createdBy === user.uid) {
            userReplies.push({ topicId, reply });
          }
        });
      });
    }
    if (userReplies.length > 0) {
      userReplies.forEach(({ topicId, reply }) => {
        get(ref(database, `forum_topics/${topicId}`)).then((topicSnapshot) => {
          const topic = topicSnapshot.val();
          if (topic) {
            userRepliesElement.innerHTML += `
            <div>
              <p>
                <strong>Topic:</strong> 
                <a href="#" onclick="viewTopic('${topicId}'); return false;">${topic.title}</a>
              </p>
              <p><strong>Reply:</strong> ${reply.content}</p>
            </div>
          `;
          }
        });
      });
    } else {
      userRepliesElement.innerHTML +=
        "<p>This user hasn't replied to any topics yet.</p>";
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

function createNotification(userId, type, topicId, content) {
  console.log('Creating notification:', { userId, type, topicId, content });
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
  console.log(`Displaying notifications for user ${user.uid}`);
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Notifications</h2>
      <div id="notifications-list"></div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  const notificationsRef = ref(database, `notifications/${user.uid}`);
  onValue(notificationsRef, (snapshot) => {
    console.log('Notifications data:', snapshot.val());
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
          <p>${notification.content}</p>
          <small>${new Date(notification.createdAt).toLocaleString()}</small>
        `;
          notificationElement.addEventListener('click', () => {
            markNotificationAsRead(user.uid, notificationId);
            viewTopic(notification.topicId);
          });
          notificationsList.appendChild(notificationElement);
        });
    } else {
      notificationsList.innerHTML = '<p>No notifications</p>';
    }
  });
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

// Make sure to expose the viewUserProfile function to the global scope
window.viewUserProfile = viewUserProfile;
window.viewTopic = viewTopic;
window.deleteReply = deleteReply;
