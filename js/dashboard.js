// Dashboard Logic for Certificate Management System

// Initial Dummy Data (stored in memory, reset on page reload per requirements)
let certificates = [
  {
    id: 1,
    title: "AWS Certified Solutions Architect",
    org: "Amazon Web Services (AWS)",
    category: "Technical",
    date: "2026-04-15",
    verified: true,
    favorite: true,
    credentialId: "AWS-ASA-99381-Z",
    url: "https://aws.amazon.com/verification",
    description: "Validation of expertise in designing and deploying scalable, highly available, and fault-tolerant systems on AWS."
  },
  {
    id: 2,
    title: "Google UX Design Professional",
    org: "Google Career Certificates",
    category: "Creative",
    date: "2025-11-20",
    verified: true,
    favorite: false,
    credentialId: "GGL-UX-84729-X",
    url: "https://coursera.org/verify/googleux",
    description: "Hands-on education covering the UX design process, user research, wireframing, prototyping, and user testing."
  },
  {
    id: 3,
    title: "Professional Scrum Master I (PSM I)",
    org: "Scrum.org",
    category: "Business",
    date: "2026-02-08",
    verified: true,
    favorite: true,
    credentialId: "SCRUM-PSM-10294",
    url: "https://scrum.org/certificates/verify",
    description: "Demonstrated understanding of the Scrum framework and its application in modern software delivery teams."
  },
  {
    id: 4,
    title: "Advanced JavaScript & ES6 Mastery",
    org: "Udemy Academy",
    category: "Technical",
    date: "2026-05-10",
    verified: false,
    favorite: false,
    credentialId: "UDM-JS-44390-L",
    url: "https://udemy.com/certificate/js-mastery",
    description: "Deep dive into execution context, closures, prototypal inheritance, asynchronous JS, promises, and modular design."
  },
  {
    id: 5,
    title: "EFSET English Certificate (C2 Proficient)",
    org: "EF Standard English Test",
    category: "Language",
    date: "2025-08-30",
    verified: true,
    favorite: false,
    credentialId: "EF-C2-884920",
    url: "https://efset.org/cert/C2",
    description: "Certified standard English score equivalent to CEFR C2 level for reading comprehension and listening skills."
  },
  {
    id: 6,
    title: "Python for Data Science & AI",
    org: "IBM Skills Network",
    category: "Technical",
    date: "2026-01-18",
    verified: true,
    favorite: false,
    credentialId: "IBM-DS-77391-P",
    url: "https://credly.com/verify/ibm-python",
    description: "Foundational Python coding, data analysis with Pandas/NumPy, data visualization, and introduction to APIs."
  }
];

// Active State Variables
let activeFilter = 'all'; // 'all' or 'favorites'
let searchKeyword = '';
let editSelectedFile = null;
let editSelectedFileDataUrl = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check URL query parameters for filter option
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('filter') === 'favorites') {
    activeFilter = 'favorites';
    const favoritesBtn = document.getElementById('favorites-menu-btn');
    if (favoritesBtn) {
      document.querySelectorAll('.sidebar-menu-item').forEach(li => li.classList.remove('active'));
      favoritesBtn.parentElement.classList.add('active');
    }
  }
  
  renderDashboard();
  setupEventListeners();

  // Check URL query parameters for action trigger modal popup
  const action = urlParams.get('action');
  if (action === 'add-certificate') {
    openModal('add-certificate-modal');
  } else if (action === 'profile') {
    openModal('profile-modal');
  }
});

// Primary Rendering Function
function renderDashboard() {
  const grid = document.getElementById('certificates-grid');
  const countTag = document.getElementById('results-count');
  const noResults = document.getElementById('no-results-placeholder');
  
  if (!grid) return;

  // Clear previous grid contents
  grid.innerHTML = '';

  // Filter list based on search and active sidebar state
  const filteredCerts = certificates.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                          cert.org.toLowerCase().includes(searchKeyword.toLowerCase());
    
    if (activeFilter === 'favorites') {
      return matchesSearch && cert.favorite;
    }
    return matchesSearch;
  });

  // Update Section Title & Count Tag
  const gridTitle = document.getElementById('grid-title');
  if (gridTitle) {
    gridTitle.textContent = activeFilter === 'favorites' ? 'Starred Favorites' : 'All Certificates';
  }
  countTag.textContent = `${filteredCerts.length} item${filteredCerts.length !== 1 ? 's' : ''}`;

  // Toggle empty placeholder state
  if (filteredCerts.length === 0) {
    grid.style.display = 'none';
    noResults.style.display = 'flex';
    return;
  } else {
    grid.style.display = 'grid';
    noResults.style.display = 'none';
  }

  // Render cards
  filteredCerts.forEach(cert => {
    const card = document.createElement('div');
    card.className = 'card certificate-card fade-in-section';
    card.dataset.id = cert.id;

    // Pick decorative icon based on category
    let iconClass = 'fa-graduation-cap';
    if (cert.category === 'Technical') iconClass = 'fa-laptop-code';
    else if (cert.category === 'Creative') iconClass = 'fa-palette';
    else if (cert.category === 'Business') iconClass = 'fa-chart-bar';
    else if (cert.category === 'Language') iconClass = 'fa-language';

    // Formatting date
    const formattedDate = new Date(cert.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });

    card.innerHTML = `
      <!-- Certificate Visual Header -->
      <div class="card-preview-emblem">
        <span class="category-tag">${cert.category}</span>
        <button class="favorite-badge" onclick="toggleFavorite(${cert.id}, event)" title="${cert.favorite ? 'Remove from favorites' : 'Add to favorites'}">
          <i class="${cert.favorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
        </button>
        <i class="fa-solid ${iconClass} certificate-badge-icon"></i>
      </div>

      <!-- Card Details -->
      <div class="card-details">
        <div class="card-title-row">
          <h4 class="card-title">${escapeHTML(cert.title)}</h4>
        </div>
        <div class="card-org">
          <i class="fa-regular fa-building"></i>
          <span>${escapeHTML(cert.org)}</span>
        </div>
        <div class="card-meta">
          <div class="card-meta-date">
            <i class="fa-regular fa-calendar"></i>
            <span>Issued: ${formattedDate}</span>
          </div>
          <span class="verification-status ${cert.verified ? 'verified' : 'unverified'}">
            <i class="fa-solid ${cert.verified ? 'fa-circle-check' : 'fa-circle-question'}"></i>
            ${cert.verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>
    `;

    // Make clicking the card show details (but filter out clicks on favorite badge)
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.favorite-badge')) {
        triggerAction('view', cert.id);
      }
    });

    grid.appendChild(card);
  });

  updateMetrics();
}

// Update Top Metrics Counter Values
function updateMetrics() {
  const totalEl = document.getElementById('total-certificates-count');
  const verifiedEl = document.getElementById('verified-certificates-count');
  const favEl = document.getElementById('favorites-count');

  if (totalEl) totalEl.textContent = certificates.length;
  if (verifiedEl) verifiedEl.textContent = certificates.filter(c => c.verified).length;
  if (favEl) favEl.textContent = certificates.filter(c => c.favorite).length;
}

// Event Listeners Binding
function setupEventListeners() {
  // Search bar input filtration
  const searchInput = document.getElementById('search-bar');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value;
      renderDashboard();
    });
  }

  // Sidebar link toggle between all/favorites
  const allCertsBtn = document.querySelector('.sidebar-menu-item:first-child');
  const favoritesBtn = document.getElementById('favorites-menu-btn');

  if (favoritesBtn && allCertsBtn) {
    favoritesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      activeFilter = 'favorites';
      document.querySelectorAll('.sidebar-menu-item').forEach(li => li.classList.remove('active'));
      favoritesBtn.parentElement.classList.add('active');
      renderDashboard();
    });

    allCertsBtn.addEventListener('click', (e) => {
      // Check if it's currently showing favorites, reset filter
      if (activeFilter !== 'all') {
        e.preventDefault();
        activeFilter = 'all';
        document.querySelectorAll('.sidebar-menu-item').forEach(li => li.classList.remove('active'));
        allCertsBtn.classList.add('active');
        renderDashboard();
      }
    });
  }

  // Modal Popups Triggers binding
  const addSidebarBtn = document.getElementById('add-cert-sidebar-btn');
  const addHeaderBtn = document.getElementById('add-cert-header-btn');
  const addNoResultsBtn = document.getElementById('no-results-add-btn');
  const profileTriggerBtn = document.getElementById('profile-header-trigger');

  if (addSidebarBtn) {
    addSidebarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('add-certificate-modal');
    });
  }
  if (addHeaderBtn) {
    addHeaderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('add-certificate-modal');
    });
  }
  if (addNoResultsBtn) {
    addNoResultsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('add-certificate-modal');
    });
  }
  if (profileTriggerBtn) {
    profileTriggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('profile-modal');
    });
  }

  // Backdrop click dismissal for all modals
  ['view-certificate-modal', 'edit-certificate-modal', 'delete-confirmation-modal', 'share-certificate-modal', 'fullscreen-cert-modal'].forEach(modalId => {
    const container = document.getElementById(modalId);
    if (container) {
      container.addEventListener('click', (e) => {
        if (e.target === container) {
          closeModal(modalId);
        }
      });
    }
  });

  setupEditModalForm();

  // Close active dropdowns on window clicks
  window.addEventListener('click', () => {
    closeAllDropdowns();
  });
}

// Toggle Dropdown Menu Visiblity
function toggleMenu(id, event) {
  event.stopPropagation(); // Avoid triggering card click and window click listeners
  
  const targetMenu = document.getElementById(`dropdown-${id}`);
  const isAlreadyOpen = targetMenu.classList.contains('show');
  
  closeAllDropdowns();

  if (!isAlreadyOpen) {
    targetMenu.classList.add('show');
  }
}

// Helper to hide all dropdown menus
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('show');
  });
}

// Add/Remove favorites state
function toggleFavorite(id, event) {
  event.stopPropagation();
  const cert = certificates.find(c => c.id === id);
  if (cert) {
    cert.favorite = !cert.favorite;
    showToast(
      cert.favorite ? `"${cert.title}" added to favorites.` : `"${cert.title}" removed from favorites.`, 
      'success'
    );
    renderDashboard();
  }
}

// Handle action triggers from dropdowns
function triggerAction(action, id) {
  const cert = certificates.find(c => c.id === id);
  if (!cert) return;

  closeAllDropdowns();

  switch(action) {
    case 'view':
      openViewModal(cert);
      break;
    case 'edit':
      openEditModal(cert);
      break;
    case 'download':
      showToast(`Downloading credential file for "${cert.title}"...`, 'success');
      const link = document.createElement('a');
      link.href = cert.image || 'data:text/plain;charset=utf-8,' + encodeURIComponent('Certificate: ' + cert.title);
      link.download = cert.imageName || `${cert.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_credential.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;
    case 'share':
      openShareModal(cert);
      break;
    case 'delete':
      openDeleteModal(cert);
      break;
  }
}

// Simple HTML Escape Helper to prevent XSS injection
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Modal Helper Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    
    // Only remove modal-open class if no other modals are active
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    if (activeModals.length === 0) {
      document.body.classList.remove('modal-open');
    }
  }
}

// Expose modal functions to window context
window.openModal = openModal;
window.closeModal = closeModal;

// Custom Modals Core Logic

function openViewModal(cert) {
  const titleEl = document.getElementById('view-cert-title');
  const catEl = document.getElementById('view-cert-category');
  const orgEl = document.getElementById('view-cert-org');
  const dateEl = document.getElementById('view-cert-date');
  const credEl = document.getElementById('view-cert-credential-id');
  const statusEl = document.getElementById('view-cert-status');
  const descEl = document.getElementById('view-cert-description');
  const linkEl = document.getElementById('view-cert-link');
  
  // Mockup certificate fields
  const mockTitle = document.getElementById('view-mockup-title');
  const mockOrg = document.getElementById('view-mockup-org');
  const mockDate = document.getElementById('view-mockup-date');
  const mockCred = document.getElementById('view-mockup-cred');
  const mockBadge = document.getElementById('view-cert-mockup');

  if (titleEl) titleEl.textContent = cert.title;
  if (catEl) {
    catEl.textContent = cert.category;
    catEl.className = 'category-tag';
  }
  if (orgEl) orgEl.textContent = cert.org;
  if (dateEl) dateEl.textContent = cert.date;
  if (credEl) credEl.textContent = cert.credentialId || 'N/A';
  
  if (statusEl) {
    statusEl.className = `verification-status ${cert.verified ? 'verified' : 'unverified'}`;
    statusEl.innerHTML = `<i class="fa-solid ${cert.verified ? 'fa-circle-check' : 'fa-circle-question'}"></i> <span>${cert.verified ? 'Verified' : 'Pending'}</span>`;
  }
  
  if (descEl) descEl.textContent = cert.description || 'No description provided.';
  
  if (linkEl) {
    if (cert.url && cert.url !== '#') {
      linkEl.href = cert.url;
      linkEl.textContent = cert.url;
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-up-right-from-square';
      icon.style.marginLeft = '6px';
      linkEl.appendChild(icon);
      document.getElementById('view-cert-link-container').style.display = 'flex';
    } else {
      document.getElementById('view-cert-link-container').style.display = 'none';
    }
  }

  // Populate certificate mockup preview
  if (mockTitle) mockTitle.textContent = cert.title;
  if (mockOrg) mockOrg.textContent = cert.org;
  if (mockDate) {
    const formattedDate = new Date(cert.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    mockDate.textContent = `Issued: ${formattedDate}`;
  }
  if (mockCred) mockCred.textContent = `ID: ${cert.credentialId || 'N/A'}`;

  if (mockBadge) {
    if (cert.image) {
      mockBadge.style.background = `url(${cert.image}) no-repeat center center / cover`;
      mockBadge.querySelector('.cert-mockup-border').style.opacity = '0';
    } else {
      mockBadge.style.background = '';
      mockBadge.querySelector('.cert-mockup-border').style.opacity = '1';
    }
  }

  // Bind view actions buttons
  const editBtn = document.getElementById('view-action-edit');
  const shareBtn = document.getElementById('view-action-share');
  const downloadBtn = document.getElementById('view-action-download');
  const deleteBtn = document.getElementById('view-action-delete');
  const maximizeBtn = document.getElementById('view-cert-maximize');

  if (editBtn) {
    editBtn.onclick = () => {
      closeModal('view-certificate-modal');
      triggerAction('edit', cert.id);
    };
  }
  if (shareBtn) {
    shareBtn.onclick = () => {
      closeModal('view-certificate-modal');
      triggerAction('share', cert.id);
    };
  }
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      closeModal('view-certificate-modal');
      triggerAction('download', cert.id);
    };
  }
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      closeModal('view-certificate-modal');
      triggerAction('delete', cert.id);
    };
  }
  if (maximizeBtn) {
    maximizeBtn.onclick = (e) => {
      e.stopPropagation();
      openFullscreenModal(cert);
    };
  }

  openModal('view-certificate-modal');
}

function openFullscreenModal(cert) {
  const container = document.getElementById('fullscreen-cert-content');
  if (!container) return;

  if (cert.image) {
    container.innerHTML = `<img src="${cert.image}" alt="Certificate: ${escapeHTML(cert.title)}" style="max-width: 100%; max-height: 85vh; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); border: 2px solid rgba(255,255,255,0.15);">`;
  } else {
    const formattedDate = new Date(cert.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    container.innerHTML = `
      <div class="large-cert-mockup">
        <div class="cert-mockup-border">
          <div class="cert-mockup-inner">
            <div class="cert-mockup-badge"><i class="fa-solid fa-award"></i></div>
            <h2 class="cert-mockup-title" style="color: #ffffff;">${escapeHTML(cert.title)}</h2>
            <p class="cert-mockup-org" style="font-size: 16px; margin-top: 6px;">${escapeHTML(cert.org)}</p>
            <div style="font-size: 14px; color: #94a3b8; margin: 24px 0 12px; font-weight: 500;">This credential validates the accomplishments of the earner.</div>
            <div class="cert-mockup-meta">
              <span>Issued: ${formattedDate}</span>
              <span>ID: ${cert.credentialId || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  openModal('fullscreen-cert-modal');
}

function openEditModal(cert) {
  document.getElementById('edit-cert-id').value = cert.id;
  document.getElementById('edit-cert-title').value = cert.title;
  document.getElementById('edit-cert-org').value = cert.org;
  document.getElementById('edit-cert-category').value = cert.category;
  document.getElementById('edit-cert-date').value = cert.date;
  document.getElementById('edit-cert-url').value = cert.url === '#' ? '' : cert.url;
  document.getElementById('edit-cert-credentialId').value = cert.credentialId || '';
  document.getElementById('edit-cert-verified').checked = cert.verified;
  document.getElementById('edit-cert-description').value = cert.description || '';

  // Reset file inputs & errors
  const filePreview = document.getElementById('edit-file-info-preview');
  const previewFilename = document.getElementById('edit-preview-filename');
  const previewIcon = document.getElementById('edit-preview-icon');
  const fileInput = document.getElementById('edit-cert-file');
  fileInput.value = '';
  editSelectedFile = null;
  editSelectedFileDataUrl = cert.image || null;
  
  if (cert.imageName) {
    previewFilename.textContent = cert.imageName;
    previewIcon.className = 'fa-regular fa-file-image file-icon';
    previewIcon.style.color = '#2563eb';
    filePreview.style.display = 'flex';
  } else {
    filePreview.style.display = 'none';
  }

  // Clear any previous edit validation errors
  document.querySelectorAll('#edit-certificate-modal .error-msg').forEach(el => el.textContent = '');

  openModal('edit-certificate-modal');
}

function openDeleteModal(cert) {
  const nameEl = document.getElementById('delete-cert-name');
  if (nameEl) nameEl.textContent = cert.title;

  const confirmBtn = document.getElementById('confirm-delete-btn');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      closeModal('delete-confirmation-modal');
      // Fade out card before deletion
      const cardEl = document.querySelector(`.certificate-card[data-id="${cert.id}"]`);
      if (cardEl) {
        cardEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.9)';
        setTimeout(() => {
          certificates = certificates.filter(c => c.id !== cert.id);
          showToast(`"${cert.title}" has been deleted successfully.`, 'success');
          renderDashboard();
        }, 300);
      } else {
        certificates = certificates.filter(c => c.id !== cert.id);
        showToast(`"${cert.title}" has been deleted successfully.`, 'success');
        renderDashboard();
      }
    };
  }

  openModal('delete-confirmation-modal');
}

function openShareModal(cert) {
  const urlInput = document.getElementById('share-url-input');
  const copyBtn = document.getElementById('copy-share-url-btn');

  const shareUrl = cert.url && cert.url !== '#' ? cert.url : `${window.location.origin}/verify/${cert.credentialId || cert.id}`;

  if (urlInput) {
    urlInput.value = shareUrl;
  }

  // Social URLs
  const linkedinEl = document.getElementById('share-linkedin');
  const twitterEl = document.getElementById('share-twitter');
  const emailEl = document.getElementById('share-email');

  const text = encodeURIComponent(`Check out my verified credential for "${cert.title}" from ${cert.org}!`);
  const encodedUrl = encodeURIComponent(shareUrl);

  if (linkedinEl) {
    linkedinEl.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
  if (twitterEl) {
    twitterEl.href = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
  }
  if (emailEl) {
    emailEl.href = `mailto:?subject=${encodeURIComponent('Verified Certificate: ' + cert.title)}&body=${text}%0A%0AVerify here: ${encodedUrl}`;
  }

  if (copyBtn) {
    copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
    copyBtn.className = 'btn btn-primary';

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        copyBtn.className = 'btn btn-success';
        showToast('Verification link copied to clipboard!', 'success');
        setTimeout(() => {
          copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
          copyBtn.className = 'btn btn-primary';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        showToast('Failed to copy link.', 'error');
      });
    };
  }

  openModal('share-certificate-modal');
}

function setupEditModalForm() {
  const form = document.getElementById('edit-certificate-form');
  const uploadZone = document.getElementById('edit-upload-zone');
  const fileInput = document.getElementById('edit-cert-file');
  const filePreview = document.getElementById('edit-file-info-preview');
  const previewFilename = document.getElementById('edit-preview-filename');
  const previewIcon = document.getElementById('edit-preview-icon');
  const removeFileBtn = document.getElementById('edit-remove-file-btn');

  if (!form || !uploadZone) return;

  // Click on upload zone triggers file input
  uploadZone.addEventListener('click', (e) => {
    if (e.target.closest('#edit-remove-file-btn') || e.target.closest('#edit-file-info-preview')) {
      return;
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
      handleEditFileSelection(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleEditFileSelection(fileInput.files[0]);
    }
  });

  function handleEditFileSelection(file) {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setEditError('file', 'File is too large. Max size allowed is 5MB.');
      clearEditFile();
      return;
    }

    editSelectedFile = file;
    previewFilename.textContent = file.name;
    
    if (file.type === 'application/pdf') {
      previewIcon.className = 'fa-regular fa-file-pdf file-icon';
      previewIcon.style.color = '#ef4444';
      editSelectedFileDataUrl = null;
    } else {
      previewIcon.className = 'fa-regular fa-file-image file-icon';
      previewIcon.style.color = '#2563eb';
      
      const reader = new FileReader();
      reader.onload = (e) => {
        editSelectedFileDataUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    filePreview.style.display = 'flex';
    setEditError('file', '');
  }

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearEditFile();
  });

  function clearEditFile() {
    editSelectedFile = null;
    editSelectedFileDataUrl = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
  }

  function setEditError(field, msg) {
    const errorSpan = document.getElementById(`edit-error-${field}`);
    if (errorSpan) {
      errorSpan.textContent = msg;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const idVal = parseInt(document.getElementById('edit-cert-id').value);
    const titleVal = document.getElementById('edit-cert-title').value.trim();
    const orgVal = document.getElementById('edit-cert-org').value.trim();
    const dateVal = document.getElementById('edit-cert-date').value;
    const urlVal = document.getElementById('edit-cert-url').value.trim();
    const credIdVal = document.getElementById('edit-cert-credentialId').value.trim();
    const verifiedVal = document.getElementById('edit-cert-verified').checked;
    const descVal = document.getElementById('edit-cert-description').value.trim();

    let isValid = true;

    if (titleVal === '') {
      setEditError('title', 'Certificate title is required.');
      isValid = false;
    } else {
      setEditError('title', '');
    }

    if (orgVal === '') {
      setEditError('org', 'Issuing organization is required.');
      isValid = false;
    } else {
      setEditError('org', '');
    }

    const catSelect = document.getElementById('edit-cert-category');
    if (catSelect && catSelect.value === '') {
      setEditError('category', 'Please select a category.');
      isValid = false;
    } else {
      setEditError('category', '');
    }

    if (isValid) {
      const cert = certificates.find(c => c.id === idVal);
      if (cert) {
        cert.title = titleVal;
        cert.org = orgVal;
        cert.category = catSelect.value;
        cert.date = dateVal || new Date().toISOString().split('T')[0];
        cert.url = urlVal || '#';
        cert.credentialId = credIdVal;
        cert.verified = verifiedVal;
        cert.description = descVal || 'No description provided.';
        
        if (editSelectedFile) {
          cert.imageName = editSelectedFile.name;
          if (editSelectedFileDataUrl) {
            cert.image = editSelectedFileDataUrl;
          } else {
            delete cert.image;
          }
        }

        showToast('Certificate Updated Successfully', 'success');
        closeModal('edit-certificate-modal');
        renderDashboard();
      }
    }
  });

  const fields = ['title', 'org', 'category'];
  fields.forEach(name => {
    const input = document.getElementById(`edit-cert-${name}`);
    if (input) {
      input.addEventListener('input', () => {
        if (input.value.trim() !== '') {
          setEditError(name, '');
        }
      });
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => {
          if (input.value !== '') {
            setEditError(name, '');
          }
        });
      }
    }
  });
}
