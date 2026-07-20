// Standalone Password Reset Logic for Certificate Manager using Supabase

document.addEventListener('DOMContentLoaded', async () => {
  const resetForm = document.getElementById('reset-password-form');
  const alertBox = document.getElementById('reset-alert');

  if (resetForm) {
    resetForm.addEventListener('submit', handleResetPasswordSubmit);
  }

  // Check if URL contains error params from Supabase auth redirect
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

  if (errorDescription) {
    if (alertBox) {
      alertBox.textContent = decodeURIComponent(errorDescription);
      alertBox.className = 'alert alert-danger show';
      alertBox.style.display = 'block';
    }
    showToast(decodeURIComponent(errorDescription), 'error');
  }

  // Listen for Supabase Auth state changes (e.g. PASSWORD_RECOVERY)
  if (typeof supabase !== 'undefined' && supabase.auth) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery mode active.');
      }
    });
  }
});

// Toggle Password Visibility helper
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const wrapper = input.parentElement;
  const icon = wrapper.querySelector('.toggle-password-btn i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  }
}

// Handle Reset Password Form Submission
async function handleResetPasswordSubmit(e) {
  e.preventDefault();

  const newPassField = document.getElementById('reset-new-password');
  const confirmPassField = document.getElementById('reset-confirm-password');

  const newPassVal = newPassField ? newPassField.value : '';
  const confirmPassVal = confirmPassField ? confirmPassField.value : '';

  let isValid = true;

  // Validate Password
  if (newPassVal === '') {
    setError('reset-new-password', 'New password is required.');
    isValid = false;
  } else {
    let pwdErrors = [];
    if (newPassVal.length < 8) pwdErrors.push('at least 8 characters');
    if (!/[A-Z]/.test(newPassVal)) pwdErrors.push('one uppercase letter');
    if (!/[a-z]/.test(newPassVal)) pwdErrors.push('one lowercase letter');
    if (!/[0-9]/.test(newPassVal)) pwdErrors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassVal)) pwdErrors.push('one special character');

    if (pwdErrors.length > 0) {
      setError('reset-new-password', `Password requires: ${pwdErrors.join(', ')}.`);
      isValid = false;
    } else {
      setError('reset-new-password', '');
    }
  }

  // Validate Confirm Password
  if (confirmPassVal === '') {
    setError('reset-confirm-password', 'Please confirm your password.');
    isValid = false;
  } else if (confirmPassVal !== newPassVal) {
    setError('reset-confirm-password', 'Passwords do not match.');
    isValid = false;
  } else {
    setError('reset-confirm-password', '');
  }

  if (!isValid) return;

  setLoading('reset', true);

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassVal
    });

    setLoading('reset', false);

    if (error) {
      showToast(error.message || 'Failed to update password.', 'error');
      setError('reset-new-password', error.message);
    } else {
      showToast('Password updated successfully! Redirecting to login...', 'success');
      
      // Clear session so user signs in with new password
      await supabase.auth.signOut();

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }
  } catch (error) {
    console.error('Update password failed:', error);
    setLoading('reset', false);
    showToast('Network error updating password.', 'error');
  }
}

// UI Helpers
function setError(id, message) {
  const errorSpan = document.getElementById(`error-${id}`);
  const inputField = document.getElementById(id);
  if (errorSpan) {
    errorSpan.textContent = message;
    if (message !== '') {
      errorSpan.classList.add('show');
    } else {
      errorSpan.classList.remove('show');
    }
  }
  if (inputField) {
    if (message !== '') {
      inputField.classList.add('invalid');
    } else {
      inputField.classList.remove('invalid');
    }
  }
}

function setLoading(formType, isLoading) {
  const submitBtn = document.getElementById(`${formType}-submit-btn`);
  if (!submitBtn) return;
  const textEl = submitBtn.querySelector('.btn-text');
  const spinnerEl = submitBtn.querySelector('.spinner');

  if (isLoading) {
    submitBtn.disabled = true;
    if (textEl) textEl.style.display = 'none';
    if (spinnerEl) spinnerEl.style.display = 'inline-block';
  } else {
    submitBtn.disabled = false;
    if (textEl) textEl.style.display = 'inline-block';
    if (spinnerEl) spinnerEl.style.display = 'none';
  }
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
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

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}
