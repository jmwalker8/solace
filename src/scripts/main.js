document.addEventListener('DOMContentLoaded', () => {
  // FAQ toggle functionality
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const question = item.querySelector('h3');
    const answer = item.querySelector('p');

    question.addEventListener('click', () => {
      answer.style.display =
        answer.style.display === 'block' ? 'none' : 'block';
    });
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
