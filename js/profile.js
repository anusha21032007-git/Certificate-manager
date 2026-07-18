// Profile Page Interaction and Validation Logic
const AUTH_API = 'http://localhost:5000/api/auth';

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
  let initialValues = {};

  // --- Load Profile Data ---
  async function fetchProfile() {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${AUTH_API}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        
        // Populate inputs
        document.getElementById('profile-username').value = user.username;
        document.getElementById('profile-fullname-input').value = user.full_name;
        document.getElementById('profile-email').value = user.email;
        document.getElementById('profile-bio').value = user.bio || '';
        
        // Populate displays
        if (displayName) displayName.textContent = user.full_name;
        if (displayUsername) displayUsername.textContent = `@${user.username}`;
        
        // Populate profile pictures
        if (user.profile_image) {
          const avatarUrl = `http://localhost:5000/uploads/${user.profile_image}`;
          document.querySelectorAll('img').forEach(img => {
            if (img.src.includes('images/profile.png') || img.id === 'profile-avatar-img') {
              img.src = avatarUrl;
            }
          });
        }

        saveInitialValues();
      } else {
        console.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

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
  if (editBtn) {
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
        if (editableInputs[0]) editableInputs[0].focus();
        showToast('Profile editing enabled', 'success');
      } else {
        editBtn.classList.remove('active');
        editBtn.setAttribute('title', 'Edit Profile Details');
        showToast('Profile editing cancelled', 'success');
        resetFieldValues();
      }
    });
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
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
        if (currentPass === '') {
          alert('Please enter your current password to set a new password.');
          return;
        }
        if (newPass === '' || confirmPass === '') {
          alert('Please fill in both New Password and Confirm Password fields.');
          return;
        }
        if (newPass !== confirmPass) {
          alert('Passwords do not match.');
          return;
        }
      }

      const token = getAuthToken();
      const payload = {
        username: usernameVal,
        full_name: fullnameVal,
        email: emailVal,
        bio: bioVal
      };

      if (isPasswordAttempted) {
        payload.currentPassword = currentPass;
        payload.newPassword = newPass;
      }

      try {
        const response = await fetch(`${AUTH_API}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || 'Failed to update profile');
          showToast(data.message || 'Profile update failed', 'error');
          return;
        }

        // Success! Update display labels
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

        alert('Profile Updated Successfully');
        showToast('Profile Updated Successfully', 'success');
        
        saveInitialValues();

        if (typeof closeModal === 'function') {
          closeModal('profile-modal');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Network error updating profile');
      }
    });
  }

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

  // --- Avatar Image Upload and Preview ---
  const avatarOverlay = document.querySelector('.profile-avatar-container .avatar-overlay');
  const avatarInput = document.getElementById('profile-avatar-input');
  
  if (avatarOverlay && avatarInput) {
    avatarOverlay.addEventListener('click', () => {
      avatarInput.click();
    });
    
    avatarInput.addEventListener('change', async () => {
      if (avatarInput.files && avatarInput.files[0]) {
        const file = avatarInput.files[0];
        
        if (!file.type.startsWith('image/')) {
          showToast('Please select a valid image file.', 'error');
          return;
        }

        const formData = new FormData();
        formData.append('profile_image', file);

        const token = getAuthToken();
        try {
          const response = await fetch(`${AUTH_API}/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          const data = await response.json();

          if (!response.ok) {
            showToast(data.message || 'Failed to upload profile picture', 'error');
            return;
          }

          const avatarUrl = `http://localhost:5000/uploads/${data.user.profile_image}`;
          
          // Update all profile images on page
          document.querySelectorAll('img').forEach(img => {
            if (img.src.includes('images/profile.png') || img.id === 'profile-avatar-img') {
              img.src = avatarUrl;
            }
          });
          
          showToast('Profile picture updated successfully', 'success');
        } catch (error) {
          console.error('Error uploading avatar:', error);
          showToast('Network error uploading profile picture', 'error');
        }
      }
    });
  }

  // Fetch initial profile data on startup
  fetchProfile();
});

/**
 * Global function to toggle visibility of passwords
 * @param {string} inputId 
 */
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
