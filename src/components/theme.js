export function initTheme() {
  const toggle = document.querySelector('#themeToggle');
  const icon = toggle.querySelector('.theme-icon');

  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  icon.textContent = saved === 'dark' ? '🌙' : '☀️';

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    icon.textContent = next === 'dark' ? '🌙' : '☀️';
  });
}