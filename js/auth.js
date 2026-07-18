// Redesigned Authentication Logic for Certificate Manager using Supabase

document.addEventListener('DOMContentLoaded', () => {
  // If user is already logged in, redirect to dashboard
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html') || window.location.pathname.endsWith('/Certificate/') || window.location.pathname.endsWith('/Certificate'))) {
    window.location.href = 'index.html';
    return;
  }

  // --- Bind Forms ---
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }
});

// --- Login Handler ---
async function handleLoginSubmit(e) {
  e.preventDefault();

  const emailField = document.getElementById('login-email');
  const passwordField = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('remember-me');

  const emailVal = emailField.value.trim();
  const passwordVal = passwordField.value;

  let isValid = true;

  // Validation
  if (emailVal === '') {
    setError('login-email', 'Email is required.');
    isValid = false;
  } else {
    setError('login-email', '');
  }

  if (passwordVal === '') {
    setError('login-password', 'Password is required.');
    isValid = false;
  } else {
    setError('login-password', '');
  }

  if (!isValid) return;

  // Set Loading State
  setLoading('login', true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailVal,
      password: passwordVal
    });

    if (error) {
      showToast(error.message || 'Login failed. Please try again.', 'error');
      setLoading('login', false);
      return;
    }

    const session = data.session;

    // Secure Storage Integration (Remember Me checkbox logic)
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('token', session.access_token);
      sessionStorage.removeItem('token'); // clear tab session to prevent conflict
    } else {
      sessionStorage.setItem('token', session.access_token);
      localStorage.removeItem('token'); // clear persistent session to prevent override
    }

    showToast('Logged in successfully! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);

  } catch (error) {
    console.error('Login request failed:', error);
    showToast('An unexpected network error occurred.', 'error');
    setLoading('login', false);
  }
}

// --- Register Handler ---
async function handleRegisterSubmit(e) {
  e.preventDefault();

  const usernameField = document.getElementById('reg-username');
  const fullnameField = document.getElementById('reg-fullname');
  const emailField = document.getElementById('reg-email');
  const passwordField = document.getElementById('reg-password');
  const confirmField = document.getElementById('reg-confirm-password');

  const usernameVal = usernameField.value.trim();
  const fullnameVal = fullnameField.value.trim();
  const emailVal = emailField.value.trim();
  const passwordVal = passwordField.value;
  const confirmVal = confirmField.value;

  let isValid = true;

  // Validation - Username
  if (usernameVal === '') {
    setError('reg-username', 'Username is required.');
    isValid = false;
  } else if (usernameVal.length < 3) {
    setError('reg-username', 'Username must be at least 3 characters.');
    isValid = false;
  } else if (/\s/.test(usernameVal)) {
    setError('reg-username', 'Username cannot contain spaces.');
    isValid = false;
  } else {
    setError('reg-username', '');
  }

  // Validation - Full Name
  if (fullnameVal === '') {
    setError('reg-fullname', 'Full name is required.');
    isValid = false;
  } else {
    setError('reg-fullname', '');
  }

  // Validation - Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailVal === '') {
    setError('reg-email', 'Email is required.');
    isValid = false;
  } else if (!emailRegex.test(emailVal)) {
    setError('reg-email', 'Please enter a valid email address.');
    isValid = false;
  } else {
    setError('reg-email', '');
  }

  // Validation - Password
  if (passwordVal === '') {
    setError('reg-password', 'Password is required.');
    isValid = false;
  } else {
    let pwdErrors = [];
    if (passwordVal.length < 8) {
      pwdErrors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(passwordVal)) {
      pwdErrors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(passwordVal)) {
      pwdErrors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(passwordVal)) {
      pwdErrors.push('one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordVal)) {
      pwdErrors.push('one special character');
    }
    
    if (pwdErrors.length > 0) {
      setError('reg-password', `Password requires: ${pwdErrors.join(', ')}.`);
      isValid = false;
    } else {
      setError('reg-password', '');
    }
  }

  // Validation - Confirm Password
  if (confirmVal === '') {
    setError('reg-confirm-password', 'Confirm password is required.');
    isValid = false;
  } else if (confirmVal !== passwordVal) {
    setError('reg-confirm-password', 'Passwords do not match.');
    isValid = false;
  } else {
    setError('reg-confirm-password', '');
  }

  if (!isValid) return;

  // Set Loading State
  setLoading('register', true);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: emailVal,
      password: passwordVal,
      options: {
        data: {
          username: usernameVal,
          full_name: fullnameVal
        }
      }
    });

    if (error) {
      showToast(error.message || 'Registration failed. Please try again.', 'error');
      setLoading('register', false);
      return;
    }

    showToast('Registration successful! Redirecting to login...', 'success');

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);

  } catch (error) {
    console.error('Registration request failed:', error);
    showToast('An unexpected network error occurred.', 'error');
    setLoading('register', false);
  }
}

// --- Toggle Password Visibility ---
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

// --- Forgot Password Link Supabase Trigger ---
async function handleForgotPassword(e) {
  e.preventDefault();
  const emailField = document.getElementById('login-email');
  const emailVal = emailField.value.trim();

  if (emailVal === '') {
    showToast('Please enter your email in the email field first.', 'error');
    setError('login-email', 'Email is required to request password reset.');
    return;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(emailVal, {
      redirectTo: window.location.origin + '/login.html'
    });

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Password reset link sent to your email!', 'success');
    }
  } catch (error) {
    console.error('Password reset failed:', error);
    showToast('Network error requesting password reset.', 'error');
  }
}

// --- UI Helpers ---
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
    textEl.style.display = 'none';
    spinnerEl.style.display = 'inline-block';
  } else {
    submitBtn.disabled = false;
    textEl.style.display = 'inline-block';
    spinnerEl.style.display = 'none';
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

  // Auto-remove after 4.5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}
