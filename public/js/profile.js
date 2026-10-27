/**
 * profile.js — handles the profile modal open/close + data fetch
 * Works with the redesigned modal markup in global.css
 */
(function () {
  const profileBtn  = document.getElementById('profileBtn');
  const modal       = document.getElementById('profileModal');
  const backdrop    = document.getElementById('modalBackdrop');
  const closeBtn    = document.getElementById('closeModal');

  if (!profileBtn || !modal || !backdrop) return;

  let dataLoaded = false;

  function openModal() {
    modal.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (!dataLoaded) fetchProfile();
  }

  function closeModal() {
    modal.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  async function fetchProfile() {
    try {
      const res  = await fetch('/api/profile');
      const data = await res.json();

      const usernameEl = document.getElementById('modalUsername');
      const userIdEl   = document.getElementById('modalUserId');
      const emailEl    = document.getElementById('modalEmail');

      if (usernameEl) usernameEl.textContent = data.username || '—';
      if (userIdEl)   userIdEl.textContent   = data.userId   || '—';
      if (emailEl)    emailEl.textContent    = data.email    || '—';

      dataLoaded = true;
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  profileBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
})();
