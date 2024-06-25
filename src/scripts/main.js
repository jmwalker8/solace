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
