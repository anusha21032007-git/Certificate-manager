// Profile Page Interaction and Validation Logic

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-details-form');
  const editBtn = document.getElementById('edit-profile-trigger');
  
  // Fields to toggle
  const editableInputs = [
    document.getElementById('profile-username'),
    document.getElementById('profile-fullname-input'),
    document.getElementById('profile-email'),
    document.getElementById('profile-bio')
  ];

  const displayName = document.getElementById('display-fullname');
  const displayUsername = document.getElementById('display-username');

  let isEditMode = false;

  // --- Backdrop Click Dismissal ---
  const container = document.getElementById('profile-modal');
  if (container) {
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        closeModal('profile-modal');
      }
    });
  }

  // Toggle profile inputs enabled/disabled
  editBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isEditMode = !isEditMode;

    editableInputs.forEach(input => {
      if (input) {
        input.disabled = !isEditMode;
      }
    });

    if (isEditMode) {
      editBtn.classList.add('active');
      editBtn.setAttribute('title', 'Cancel Editing');
      // Focus first element
      if (editableInputs[0]) editableInputs[0].focus();
      showToast('Profile editing enabled', 'success');
    } else {
      editBtn.classList.remove('active');
      editBtn.setAttribute('title', 'Edit Profile Details');
      showToast('Profile editing cancelled', 'success');
      // Reset values back to original display values
      resetFieldValues();
    }
  });

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;

    const usernameVal = document.getElementById('profile-username').value.trim();
    const fullnameVal = document.getElementById('profile-fullname-input').value.trim();
    const emailVal = document.getElementById('profile-email').value.trim();
    const bioVal = document.getElementById('profile-bio').value.trim();

    // Check basic info inputs if edit mode is active
    if (isEditMode) {
      if (usernameVal === '' || fullnameVal === '' || emailVal === '') {
        alert('Please fill out all required personal information fields.');
        return;
      }
    }

    // Check if password change is attempted
    const isPasswordAttempted = currentPass !== '' || newPass !== '' || confirmPass !== '';

    if (isPasswordAttempted) {
      // Validate current password filled
      if (currentPass === '') {
        alert('Please enter your current password to set a new password.');
        return;
      }
      
      // Validate new password fields filled
      if (newPass === '' || confirmPass === '') {
        alert('Please fill in both New Password and Confirm Password fields.');
        return;
      }

      // Check if passwords match
      if (newPass !== confirmPass) {
        alert('Passwords do not match.'); // Required alert check
        return;
      }
    }

    // Success! Update display labels if changed
    if (displayName) displayName.textContent = fullnameVal;
    if (displayUsername) displayUsername.textContent = `@${usernameVal}`;

    // Exit edit mode on inputs
    isEditMode = false;
    editBtn.classList.remove('active');
    editBtn.setAttribute('title', 'Edit Profile Details');
    editableInputs.forEach(input => {
      if (input) input.disabled = true;
    });

    // Clear password inputs
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';

    // Show required success alert
    alert('Profile Updated Successfully');
    showToast('Profile Updated Successfully', 'success');

    // Close modal
    if (typeof closeModal === 'function') {
      closeModal('profile-modal');
    }
  });

  // Store initial values to restore on cancel
  const initialValues = {};
  function saveInitialValues() {
    initialValues.username = document.getElementById('profile-username').value;
    initialValues.fullname = document.getElementById('profile-fullname-input').value;
    initialValues.email = document.getElementById('profile-email').value;
    initialValues.bio = document.getElementById('profile-bio').value;
  }
  
  function resetFieldValues() {
    document.getElementById('profile-username').value = initialValues.username || 'john_doe';
    document.getElementById('profile-fullname-input').value = initialValues.fullname || 'John Doe';
    document.getElementById('profile-email').value = initialValues.email || 'john.doe@example.com';
    document.getElementById('profile-bio').value = initialValues.bio || '';
  }

  saveInitialValues();
});

/**
 * Global function to toggle visibility of passwords
 * @param {string} inputId 
 */
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
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
