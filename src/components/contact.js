import '../contact.css';

// ====== CHANGE THIS to your real email ======
const CONTACT_EMAIL = 'litchzzy@email.com';
// ============================================

export function initContact() {
  const card = document.querySelector('.contact-card');
  if (!card) return;

  // fade in when you scroll to it, fade out when you scroll away
  new IntersectionObserver(
    ([entry]) => card.classList.toggle('visible', entry.isIntersecting),
    { threshold: 0.15 }
  ).observe(card);

  // put your email into the email row (so you only edit it in one place)
  const emailLink = card.querySelector('#emailLink');
  if (emailLink) {
    emailLink.href = `mailto:${CONTACT_EMAIL}`;
    emailLink.querySelector('span').textContent = CONTACT_EMAIL;
  }

  // copy email button
  const copyBtn = card.querySelector('#copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
        copyBtn.textContent = 'Copied ✓';
      } catch {
        copyBtn.textContent = CONTACT_EMAIL; // fallback: just show it
      }
      setTimeout(() => (copyBtn.textContent = 'Copy email'), 1800);
    });
  }

  // form: opens the visitor's email app with the message filled in
  const form = card.querySelector('#contactForm');
  const status = card.querySelector('.form-status');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name');
      const email = data.get('email');
      const message = data.get('message');

      const subject = `Portfolio message from ${name}`;
      const body = `${message}\n\n- ${name} (${email})`;

      window.location.href =
        `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (status) status.textContent = 'Opening your email app...';
      form.reset();
    });
  }
}