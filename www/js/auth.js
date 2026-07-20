// Redesigned Authentication Logic for Certificate Manager using Supabase

document.addEventListener('DOMContentLoaded', () => {
  // Check if current URL is a password recovery link
  const isRecovery = window.location.hash.includes('type=recovery') || 
                     window.location.search.includes('type=recovery');

  if (isRecovery) {
    showResetPasswordModal();
  } else {
    // If user is already logged in, redirect to dashboard
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html') || window.location.pathname.endsWith('/Certificate/') || window.location.pathname.endsWith('/Certificate'))) {
      window.location.href = 'index.html';
      return;
    }
  }

  // Supabase auth state change listener for PASSWORD_RECOVERY event
  if (typeof supabase !== 'undefined' && supabase.auth) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        showResetPasswordModal();
      }
    });
  }

  // --- Bind Forms ---
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const resetPasswordForm = document.getElementById('reset-password-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
  }
});

// --- Helper to resolve username to email ---
async function lookupEmailFromUsername(identifier) {
  const clean = identifier ? identifier.trim() : '';
  if (!clean) return '';
  if (clean.includes('@')) {
    return clean;
  }

  const cleanLower = clean.toLowerCase();

  // 1. Try local cache (fastest & resilient to RLS/RPC restrictions)
  try {
    const cachedEmail = localStorage.getItem('user_map_' + cleanLower);
    if (cachedEmail && cachedEmail.includes('@')) {
      return cachedEmail;
    }
  } catch (e) {
    console.warn('Local cache read error:', e);
  }

  // 2. Try RPC function get_user_email_by_username
  try {
    const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_user_email_by_username', { p_username: clean });
    if (rpcEmail && !rpcErr && typeof rpcEmail === 'string' && rpcEmail.includes('@')) {
      try { localStorage.setItem('user_map_' + cleanLower, rpcEmail); } catch (e) {}
      return rpcEmail;
    }
  } catch (err) {
    console.warn('RPC lookup failed:', err);
  }

  // 3. Try profiles table (case-insensitive search)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', clean)
      .maybeSingle();

    if (profile && profile.email && profile.email.includes('@')) {
      try { localStorage.setItem('user_map_' + cleanLower, profile.email); } catch (e) {}
      return profile.email;
    }
  } catch (err) {
    console.warn('Profiles table lookup failed:', err);
  }

  return clean;
}

// --- Login Handler ---
async function handleLoginSubmit(e) {
  e.preventDefault();

  const identifierField = document.getElementById('login-email');
  const passwordField = document.getElementById('login-password');

  const identifierVal = identifierField.value.trim();
  const passwordVal = passwordField.value;

  let isValid = true;

  // Validation
  if (identifierVal === '') {
    setError('login-email', 'Username or Email is required.');
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
    // Resolve email if user entered a username
    const loginEmail = await lookupEmailFromUsername(identifierVal);

    if (!loginEmail.includes('@')) {
      showToast(`No account found for username "${identifierVal}". Please check your username or sign in with your email address.`, 'error');
      setLoading('login', false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: passwordVal
    });

    if (error) {
      showToast(error.message || 'Login failed. Please check your credentials.', 'error');
      setLoading('login', false);
      return;
    }

    const session = data.session;

    // Cache username to email mapping for future logins
    if (session && session.user) {
      const userMeta = session.user.user_metadata;
      if (userMeta && userMeta.username) {
        try { localStorage.setItem('user_map_' + userMeta.username.toLowerCase(), session.user.email); } catch (e) {}
      }
      if (!identifierVal.includes('@')) {
        try { localStorage.setItem('user_map_' + identifierVal.toLowerCase(), session.user.email); } catch (e) {}
      }
    }

    // Secure Storage Integration (Default persistent login)
    localStorage.setItem('token', session.access_token);
    sessionStorage.removeItem('token');

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

    // Cache username to email mapping
    try {
      localStorage.setItem('user_map_' + usernameVal.toLowerCase(), emailVal);
    } catch (e) {}

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
  if (e) e.preventDefault();
  const identifierField = document.getElementById('login-email');
  const identifierVal = identifierField ? identifierField.value.trim() : '';

  if (identifierVal === '') {
    showToast('Please enter your username or email first.', 'error');
    setError('login-email', 'Username or Email is required to request password reset.');
    return;
  }

  try {
    setLoading('login', true);
    const targetEmail = await lookupEmailFromUsername(identifierVal);

    if (!targetEmail.includes('@')) {
      showToast(`No account found for username "${identifierVal}". Please check your username or enter your email.`, 'error');
      setLoading('login', false);
      return;
    }

    const redirectUrl = 'https://cert.uniaura.dpdns.org/reset-password.html';

    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: redirectUrl
    });

    setLoading('login', false);

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Password reset link sent to your email! Check your inbox.', 'success');
    }
  } catch (error) {
    console.error('Password reset failed:', error);
    setLoading('login', false);
    showToast('Network error requesting password reset.', 'error');
  }
}

// --- Reset Password Modal Functions ---
function showResetPasswordModal() {
  const modal = document.getElementById('reset-password-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeResetModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('reset-password-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  // Clear URL fragment
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

async function handleResetPasswordSubmit(e) {
  e.preventDefault();

  const newPassField = document.getElementById('reset-new-password');
  const confirmPassField = document.getElementById('reset-confirm-password');

  const newPassVal = newPassField.value;
  const confirmPassVal = confirmPassField.value;

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
      showToast('Password updated successfully! Please sign in with your new password.', 'success');
      closeResetModal();
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error('Update password failed:', error);
    setLoading('reset', false);
    showToast('Network error updating password.', 'error');
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
