// Theme Manager for Certificate Management System

(function () {
  // Apply saved theme as early as possible to prevent white flash
  const savedTheme = sessionStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
})();

// Initialize theme toggling hook when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Automatically bind theme toggles if present on the page
  const lightBtn = document.getElementById('theme-light-btn');
  const darkBtn = document.getElementById('theme-dark-btn');

  if (lightBtn && darkBtn) {
    lightBtn.addEventListener('click', () => setTheme('light'));
    darkBtn.addEventListener('click', () => setTheme('dark'));
    updateThemeButtons();
  }

  // Bind logout button alert if present
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('You have logged out successfully.');
      // Simulating redirect to login or home
      window.location.reload();
    });
  }

  // Bind responsive sidebar toggle if mobile menu icon is present
  const menuIcon = document.getElementById('menu-icon');
  const sidebar = document.querySelector('.sidebar');
  if (menuIcon && sidebar) {
    menuIcon.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !menuIcon.contains(e.target) && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    });
  }
});

/**
 * Sets the active theme and updates UI
 * @param {'light'|'dark'} theme 
 */
function setTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    sessionStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    sessionStorage.setItem('theme', 'light');
  }
  updateThemeButtons();
}

/**
 * Updates active visual state on settings page theme buttons
 */
function updateThemeButtons() {
  const lightBtn = document.getElementById('theme-light-btn');
  const darkBtn = document.getElementById('theme-dark-btn');
  if (!lightBtn || !darkBtn) return;

  const activeTheme = sessionStorage.getItem('theme') || 'light';

  if (activeTheme === 'dark') {
    darkBtn.classList.add('btn-primary');
    darkBtn.classList.remove('btn-secondary');
    lightBtn.classList.add('btn-secondary');
    lightBtn.classList.remove('btn-primary');
  } else {
    lightBtn.classList.add('btn-primary');
    lightBtn.classList.remove('btn-secondary');
    darkBtn.classList.add('btn-secondary');
    darkBtn.classList.remove('btn-primary');
  }
}

/**
 * Helper function to create premium toast notifications
 * @param {string} message 
 * @param {'success'|'error'} type 
 */
function showToast(message, type = 'success') {
  // Check if container exists, else create it
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  
  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <div class="toast-message">${message}</div>
    <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
  `;

  // Close button binding
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}
