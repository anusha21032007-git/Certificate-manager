// Theme Manager for Certificate Management System
window.getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

(function () {
  // Always dark mode
  document.body.classList.add('dark');
  sessionStorage.setItem('theme', 'dark');

  // Protect page: search both localStorage and sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const path = window.location.pathname;
  if (!token && !path.includes('login.html') && !path.includes('register.html')) {
    window.location.href = 'login.html';
  }
})();

// Initialize hooks when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load profile picture from localStorage if exists
  const savedAvatar = localStorage.getItem('profile_avatar');
  if (savedAvatar) {
    document.querySelectorAll('img').forEach(img => {
      if (img.src.includes('images/profile.png') || img.id === 'profile-avatar-img') {
        img.src = savedAvatar;
      }
    });
  }

  // Bind logout button if present
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    // Inject logout modal HTML dynamically if it doesn't exist
    if (!document.getElementById('logout-confirmation-modal')) {
      const modalDiv = document.createElement('div');
      modalDiv.className = 'modal-overlay';
      modalDiv.id = 'logout-confirmation-modal';
      modalDiv.innerHTML = `
        <div class="card modal-card logout-confirm-card"
          style="max-width: 450px; text-align: center; padding: 32px 24px; width: 100%;">
          <button class="modal-close-btn" onclick="closeModal('logout-confirmation-modal')">&times;</button>
          <div class="logout-icon-container"
            style="width: 64px; height: 64px; background-color: rgba(99, 102, 241, 0.1); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px;">
            <i class="fa-solid fa-right-from-bracket"></i>
          </div>
          <h3 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Confirm Logout</h3>
          <p style="color: var(--text-muted); font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            Are you sure you want to log out of your session?
          </p>
          <div class="form-actions" style="justify-content: center; gap: 12px; display: flex;">
            <button type="button" class="btn btn-secondary" onclick="closeModal('logout-confirmation-modal')"
              style="flex: 1;">Cancel</button>
            <button type="button" id="confirm-logout-btn" class="btn btn-primary" style="flex: 1;">Logout</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalDiv);

      // Add close click handler for backdrop
      modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) {
          closeModal('logout-confirmation-modal');
        }
      });
    }

    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof openModal === 'function') {
        openModal('logout-confirmation-modal');
      } else {
        const modal = document.getElementById('logout-confirmation-modal');
        if (modal) modal.classList.add('active');
      }
    });

    // Bind confirm button inside modal
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error("SignOut error:", err);
        }
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        if (typeof closeModal === 'function') {
          closeModal('logout-confirmation-modal');
        } else {
          const modal = document.getElementById('logout-confirmation-modal');
          if (modal) modal.classList.remove('active');
        }
        window.location.href = 'login.html';
      });
    }
  }

  // Bind responsive sidebar toggle if mobile menu icon is present
  const menuIcon = document.getElementById('menu-icon');
  const sidebar = document.querySelector('.sidebar');
  if (menuIcon && sidebar) {
    menuIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
    
    // Auto-close sidebar after clicking any navigation item inside sidebar
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.sidebar-menu-item')) {
        sidebar.classList.remove('active');
      }
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
