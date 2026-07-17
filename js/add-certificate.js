// Add Certificate Form Validation and Upload Zone Handler

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-certificate-form');
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('cert-file');
  const filePreview = document.getElementById('file-info-preview');
  const previewFilename = document.getElementById('preview-filename');
  const previewIcon = document.getElementById('preview-icon');
  const removeFileBtn = document.getElementById('remove-file-btn');

  let selectedFile = null;
  let selectedFileDataUrl = null;

  // --- Backdrop Click Dismissal ---
  const container = document.getElementById('add-certificate-modal');
  if (container) {
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        closeModal('add-certificate-modal');
      }
    });
  }

  // --- Drag & Drop / File Upload Actions ---
  
  // Click on upload zone triggers file input
  uploadZone.addEventListener('click', (e) => {
    if (e.target.closest('#remove-file-btn') || e.target.closest('#file-info-preview')) {
      return; // Do nothing if clicking remove button
    }
    fileInput.click();
  });

  // Drag over effects
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  });

  // Native file input selection
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelection(fileInput.files[0]);
    }
  });

  // Handle selected file details and previews
  function handleFileSelection(file) {
    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('file', 'File is too large. Max size allowed is 5MB.');
      clearFile();
      return;
    }

    selectedFile = file;
    previewFilename.textContent = file.name;
    
    // Choose icon depending on type
    if (file.type === 'application/pdf') {
      previewIcon.className = 'fa-regular fa-file-pdf file-icon';
      previewIcon.style.color = '#ef4444'; // Red icon for PDF
    } else {
      previewIcon.className = 'fa-regular fa-file-image file-icon';
      previewIcon.style.color = '#2563eb'; // Blue icon for Image
    }

    // Show preview frame and remove error text
    filePreview.style.display = 'flex';
    setError('file', ''); // Clear error

    // Read image as Data URL if it's not a PDF
    if (file.type !== 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        selectedFileDataUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      selectedFileDataUrl = null;
    }
  }

  // Remove file action
  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });

  function clearFile() {
    selectedFile = null;
    selectedFileDataUrl = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
  }

  // --- Real-time input listeners to clear errors ---
  const inputs = ['title', 'org', 'category'];
  inputs.forEach(name => {
    const input = document.getElementById(`cert-${name}`);
    if (input) {
      input.addEventListener('input', () => {
        if (input.value.trim() !== '') {
          setError(name, '');
        }
      });
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => {
          if (input.value !== '') {
            setError(name, '');
          }
        });
      }
    }
  });

  // --- Form Submit Validation ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Check elements
    const certTitle = document.getElementById('cert-title');
    const certOrg = document.getElementById('cert-org');
    const certCategory = document.getElementById('cert-category');

    let isValid = true;

    // Validate Title
    if (certTitle.value.trim() === '') {
      setError('title', 'Certificate title is required.');
      isValid = false;
    } else {
      setError('title', '');
    }

    // Validate Org
    if (certOrg.value.trim() === '') {
      setError('org', 'Issuing organization is required.');
      isValid = false;
    } else {
      setError('org', '');
    }

    // Validate Category
    if (certCategory.value === '') {
      setError('category', 'Please select a category.');
      isValid = false;
    } else {
      setError('category', '');
    }

    // Validate Uploaded File
    if (!selectedFile) {
      setError('file', 'Certificate file upload is required.');
      isValid = false;
    } else {
      setError('file', '');
    }

    // On Successful Validation
    if (isValid) {
      // Create new certificate item
      const newCert = {
        id: Date.now(),
        title: certTitle.value.trim(),
        org: certOrg.value.trim(),
        category: certCategory.value,
        date: document.getElementById('cert-date').value || new Date().toISOString().split('T')[0],
        verified: false,
        favorite: false,
        credentialId: "CERT-" + Math.floor(10000 + Math.random() * 90000),
        url: document.getElementById('cert-url').value.trim() || "#",
        description: document.getElementById('cert-description').value.trim() || "No description provided.",
        imageName: selectedFile ? selectedFile.name : null,
        image: selectedFileDataUrl
      };

      // Push to the global array in dashboard.js
      if (typeof certificates !== 'undefined') {
        certificates.unshift(newCert); // Add to beginning of array
      }

      // Show Success Toast
      showToast('Certificate Saved Successfully', 'success');
      
      // Clear form inputs
      form.reset();
      clearFile();

      // Close modal
      if (typeof closeModal === 'function') {
        closeModal('add-certificate-modal');
      }

      // Re-render dashboard
      if (typeof renderDashboard === 'function') {
        renderDashboard();
      }
    }
  });

  /**
   * Helper to write error message text and apply class style
   * @param {string} fieldName 
   * @param {string} message 
   */
  function setError(fieldName, message) {
    const errorSpan = document.getElementById(`error-${fieldName}`);
    const inputField = document.getElementById(`cert-${fieldName}`);
    
    if (errorSpan) {
      errorSpan.textContent = message;
    }

    if (inputField) {
      if (message !== '') {
        inputField.classList.add('invalid');
      } else {
        inputField.classList.remove('invalid');
      }
    }

    // For file field, we highlight the upload zone container
    if (fieldName === 'file' && uploadZone) {
      if (message !== '') {
        uploadZone.style.borderColor = 'var(--danger)';
      } else {
        uploadZone.style.borderColor = '';
      }
    }
  }
});
