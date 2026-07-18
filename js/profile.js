// Profile Page Interaction and Validation Logic using Supabase

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
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        console.error("No active user session:", authErr);
        return;
      }

      const { data: profile, error: dbErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbErr) {
        console.error('Failed to load profile from database:', dbErr);
        return;
      }

      // Populate inputs
      document.getElementById('profile-username').value = profile.username;
      document.getElementById('profile-fullname-input').value = profile.full_name;
      document.getElementById('profile-email').value = user.email; // email is on auth.users
      document.getElementById('profile-bio').value = profile.bio || '';
      
      // Populate displays
      if (displayName) displayName.textContent = profile.full_name;
      if (displayUsername) displayUsername.textContent = `@${profile.username}`;
      
      // Populate profile pictures
      if (profile.profile_image) {
        let avatarUrl = profile.profile_image;
        if (!avatarUrl.startsWith('http')) {
          const { data } = supabase.storage.from('certificates').getPublicUrl(profile.profile_image);
          avatarUrl = data.publicUrl;
        }
        document.querySelectorAll('img').forEach(img => {
          if (img.src.includes('images/profile.png') || img.id === 'profile-avatar-img') {
            img.src = avatarUrl;
          }
        });
        localStorage.setItem('profile_avatar', avatarUrl);
      }

      saveInitialValues();
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
        if (newPass === '' || confirmPass === '') {
          alert('Please fill in both New Password and Confirm Password fields.');
          return;
        }
        if (newPass !== confirmPass) {
          alert('Passwords do not match.');
          return;
        }
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Password change verification
        if (isPasswordAttempted) {
          const { error: pwdErr } = await supabase.auth.updateUser({ password: newPass });
          if (pwdErr) {
            alert(pwdErr.message || 'Failed to update password');
            showToast(pwdErr.message || 'Password update failed', 'error');
            return;
          }
        }

        // 2. Email change verification
        if (emailVal !== initialValues.email) {
          const { error: emailErr } = await supabase.auth.updateUser({ email: emailVal });
          if (emailErr) {
            alert(emailErr.message || 'Failed to update email');
            showToast(emailErr.message || 'Email update failed', 'error');
            return;
          }
        }

        // 3. Profiles table details update
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            username: usernameVal,
            full_name: fullnameVal,
            bio: bioVal
          })
          .eq('id', user.id);

        if (profileErr) {
          alert(profileErr.message || 'Failed to update profile');
          showToast(profileErr.message || 'Profile update failed', 'error');
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

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const fileExt = file.name.split('.').pop();
          const fileName = `profiles/${user.id}/${Date.now()}.${fileExt}`;

          // Upload file to Supabase storage
          const { error: uploadErr } = await supabase.storage
            .from('certificates')
            .upload(fileName, file, {
              upsert: true
            });

          if (uploadErr) {
            showToast(uploadErr.message || 'Failed to upload profile picture', 'error');
            return;
          }

          // Update profiles table profile_image with the storage path
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ profile_image: fileName })
            .eq('id', user.id);

          if (updateErr) {
            showToast(updateErr.message || 'Failed to update profile image path', 'error');
            return;
          }

          // Get public URL
          const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(fileName);
          const avatarUrl = urlData.publicUrl;
          
          // Update all profile images on page
          document.querySelectorAll('img').forEach(img => {
            if (img.src.includes('images/profile.png') || img.id === 'profile-avatar-img') {
              img.src = avatarUrl;
            }
          });
          
          localStorage.setItem('profile_avatar', avatarUrl);
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
