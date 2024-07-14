// form loading animation

const form = [...document.querySelector('.form').children];

form.forEach((item, i) => {
  setTimeout(() => {
    item.style.opacity = 1;
  }, i * 100);
});

window.onload = () => {
  if (sessionStorage.name) {
    location.href = '/';
  }
};

// form validation

const name = document.querySelector('.name') || null;
const email = document.querySelector('.email');
const password = document.querySelector('.password');
const submitBtn = document.querySelector('.submit-btn');

if (name == null) {
  // means login page is open
  submitBtn.addEventListener('click', () => {
    fetch('/login-user', {
      method: 'post',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        validateData(data);
      });
  });
} else {
  // means register page is open

  submitBtn.addEventListener('click', () => {
    fetch('/register-user', {
      method: 'post',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        validateData(data);
      });
  });
}

const validateData = (data) => {
  if (!data.name) {
    alertBox(data);
  } else {
    sessionStorage.name = data.name;
    sessionStorage.email = data.email;
    location.href = '/';
  }
};

const alertBox = (data) => {
  const alertContainer = document.querySelector('.alert-box');
  const alertMsg = document.querySelector('.alert');
  alertMsg.innerHTML = data;

  alertContainer.style.top = `5%`;
  setTimeout(() => {
    alertContainer.style.top = null;
  }, 5000);
};

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('registerForm');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordError = document.getElementById('passwordError');

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form from submitting

    if (password.value !== confirmPassword.value) {
      passwordError.style.display = 'block';
    } else {
      passwordError.style.display = 'none';
      // If passwords match, you can submit the form
      console.log('Form submitted successfully');
      // Uncomment the next line to actually submit the form
      // form.submit();
    }
  });

  // Optional: Hide the error message when user starts typing in confirm password field
  confirmPassword.addEventListener('input', function () {
    passwordError.style.display = 'none';
  });
});
