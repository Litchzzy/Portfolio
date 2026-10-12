export function initNavbar() {
  const navbar = document.querySelector('#navbar');
  const hamburger = document.querySelector('#hamburger');
  const sideMenu = document.querySelector('#sideMenu');
  const navLogo = document.querySelector('#navLogo');
  const heroSection = document.querySelector('#hero');
  const sections = document.querySelectorAll('.panel');
  const navLinks = document.querySelectorAll('.nav-link, .side-link');

  let lastScrollY = window.scrollY;

  function updateActiveLink() {
    let current = sections[0].id;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5) {
        current = section.id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }

  // --- Hide navbar on scroll down PAST hero, show on scroll up ---
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const heroHeight = heroSection.offsetHeight;

    if (currentScrollY > heroHeight) {
      navbar.classList.toggle('hide', currentScrollY > lastScrollY);
    } else {
      navbar.classList.remove('hide');
    }

    lastScrollY = currentScrollY;
    updateActiveLink();
  });

  // --- Hamburger + scroll lock ---
  function openMenu() {
    sideMenu.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  function closeMenu() {
    sideMenu.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    sideMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  sideMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close when clicking outside the side menu
  document.addEventListener('click', (e) => {
    if (
      sideMenu.classList.contains('open') &&
      !sideMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // --- Clickable logo scrolls to top ---
  navLogo.addEventListener('click', (e) => {
    e.preventDefault();
    heroSection.scrollIntoView({ behavior: 'smooth' });
  });

  updateActiveLink();
}