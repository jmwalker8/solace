document.addEventListener('DOMContentLoaded', () => {
  // FAQ toggle functionality
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('h3');
    const answer = item.querySelector('.faq-answer');
    const expandIcon = item.querySelector('.expand-icon');

    if (question && answer && expandIcon) {
      question.addEventListener('click', () => {
        answer.classList.toggle('active');
        expandIcon.textContent = answer.classList.contains('active')
          ? '-'
          : '+';
      });
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const smoothScrollLinks = document.querySelectorAll('.smooth-scroll');

  smoothScrollLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
        });
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', (event) => {
  const hamburger = document.querySelector('.hamburger-menu');
  const navContent = document.querySelector('.nav-content');

  hamburger.addEventListener('click', () => {
    navContent.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (event) => {
    if (
      !hamburger.contains(event.target) &&
      !navContent.contains(event.target)
    ) {
      navContent.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });

  // Close menu when a nav link is clicked
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navContent.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });
});

document.addEventListener('DOMContentLoaded', (event) => {
  const toggleSwitch = document.querySelector('#checkbox');
  const currentTheme = localStorage.getItem('theme');

  if (currentTheme) {
    document.documentElement.classList.add(currentTheme);
    if (currentTheme === 'theme-dark') {
      toggleSwitch.checked = true;
    }
  }

  function switchTheme(e) {
    if (e.target.checked) {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('theme-dark');
      localStorage.setItem('theme', 'theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.classList.add('theme-light');
      localStorage.setItem('theme', 'theme-light');
    }
  }

  toggleSwitch.addEventListener('change', switchTheme, false);
});

document.addEventListener('DOMContentLoaded', function () {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-links a');

  function onScroll() {
    let current = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= sectionTop - sectionHeight / 3) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href').slice(1) === current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll);
});
