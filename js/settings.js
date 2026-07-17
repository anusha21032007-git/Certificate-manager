// Settings Logic for Certificate Management System

document.addEventListener('DOMContentLoaded', () => {
  // Bind toast messages to theme button clicks for premium feedback
  const lightBtn = document.getElementById('theme-light-btn');
  const darkBtn = document.getElementById('theme-dark-btn');

  if (lightBtn && darkBtn) {
    lightBtn.addEventListener('click', () => {
      // Check if toast is already shown
      if (sessionStorage.getItem('theme') === 'light') {
        showToast('Already in Light Mode', 'success');
      } else {
        showToast('Switched to Light Mode', 'success');
      }
    });

    darkBtn.addEventListener('click', () => {
      if (sessionStorage.getItem('theme') === 'dark') {
        showToast('Already in Dark Mode', 'success');
      } else {
        showToast('Switched to Dark Mode', 'success');
      }
    });
  }
  
  console.log("Settings panel loaded. Ready for interactive configurations.");
});
