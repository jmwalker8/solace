document.addEventListener('DOMContentLoaded', () => {
  // FAQ toggle functionality
  const faqItems = document.querySelectorAll('.faq-item');
  const filterButtons = document.querySelectorAll('.filter-btn');

  faqItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      // Prevent the click event from bubbling up if clicking on a link inside the answer
      if (event.target.tagName === 'A') return;

      item.classList.toggle('active');
      const answer = item.querySelector('.faq-answer');
      if (answer) {
        answer.style.maxHeight = item.classList.contains('active')
          ? answer.scrollHeight + 'px'
          : '0';
      }
    });
  });

  // FAQ filtering
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      filterFAQs(filter);
      setActiveButton(button);
    });
  });

  function filterFAQs(filter) {
    faqItems.forEach((item) => {
      if (
        filter === 'general' ||
        item.getAttribute('data-category') === filter
      ) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function setActiveButton(activeButton) {
    filterButtons.forEach((button) => {
      button.classList.remove('active');
    });
    activeButton.classList.add('active');
  }

  // Smooth scrolling
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

  // Close menu when a nav link is clicked
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navContent.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });

  // Active section highlighting
  const sections = document.querySelectorAll('.section');

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

  // Update navbar based on section
  const header = document.querySelector('header');
  const fullHeightSections = document.querySelectorAll('.full-height-section');

  function updateNavbar() {
    const scrollPosition = window.scrollY;

    fullHeightSections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (
        scrollPosition >= sectionTop - 60 &&
        scrollPosition < sectionTop + sectionHeight - 60
      ) {
        if (section.classList.contains('light')) {
          header.classList.remove('nav-dark');
          header.classList.add('nav-light');
        } else {
          header.classList.remove('nav-light');
          header.classList.add('nav-dark');
        }
      }
    });
  }

  window.addEventListener('scroll', updateNavbar);
  updateNavbar(); // Call once to set initial state

  // Hamburger menu functionality
  const hamburger = document.querySelector('.hamburger-menu');
  const navMenu = document.querySelector('.nav-menu');

  hamburger.addEventListener('click', function () {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  // Close menu when a nav link is clicked (including login and get started buttons)
  const allNavLinks = document.querySelectorAll(
    '.nav-links a, .login-link, .get-started-btn'
  );
  allNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });

  // Learn more button smooth scroll
  const learnMoreBtn = document.querySelector('.learn-more-btn');

  learnMoreBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
      });
    }
  });

  // Function to check if an element is in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Features section horizontal scrolling
  const featuresSection = document.getElementById('features');
  const scrollContainer = featuresSection.querySelector(
    '.feature-scroll-container'
  );
  const scrollIndicator = document.getElementById('scroll-indicator');
  const featureScroll = document.querySelector('.feature-scroll');
  const featureCards = document.querySelectorAll('.feature-card');

  if (
    featuresSection &&
    scrollContainer &&
    featureScroll &&
    featureCards.length > 0
  ) {
    // Handle vertical scrolling
    window.addEventListener(
      'wheel',
      (e) => {
        if (isElementInViewport(featuresSection)) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      },
      { passive: false }
    );
  } else {
    console.error(
      'Feature elements not found. Check your HTML structure and class names.'
    );
  }
});
