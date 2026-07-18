// Dashboard Logic for Certificate Management System

let certificates = [];

// Active State Variables
let activeFilter = 'all'; // 'all' or 'favorites'
let searchKeyword = '';
let selectedCategory = 'all';
let editSelectedFile = null;
let editSelectedFileDataUrl = null;

// Helper to decode JWT and get user ID
function getUserIdFromToken() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user.id;
  } catch (e) {
    return null;
  }
}

// Fetch certificates from backend
async function fetchCertificates() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('http://localhost:5000/api/certificates', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Load favorites from local storage to keep schema intact
      const userId = getUserIdFromToken();
      const favKey = userId ? `favorites_user_${userId}` : 'favorites_user_guest';
      const favs = JSON.parse(localStorage.getItem(favKey)) || [];

      // Map database schema fields to frontend fields
      certificates = data.map(cert => ({
        id: cert.id,
        title: cert.title,
        org: cert.organization,
        category: cert.category,
        date: cert.issue_date ? cert.issue_date.split('T')[0] : '',
        favorite: favs.includes(cert.id),
        credentialId: cert.credentialId || ('CERT-' + cert.id),
        url: cert.verification_url,
        description: cert.description,
        imageName: cert.file_path,
        image: cert.file_path ? `http://localhost:5000/uploads/${cert.file_path}` : null
      }));

      renderDashboard();
    } else {
      console.error('Failed to fetch certificates from server');
    }
  } catch (error) {
    console.error('Error fetching certificates:', error);
  }
}

window.fetchCertificates = fetchCertificates;

document.addEventListener('DOMContentLoaded', () => {
  // Check URL query parameters for section or filter options
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('filter') === 'favorites') {
    activeFilter = 'favorites';
    setActiveMenuItem('menu-item-favs');
    switchSection('certificates-view-section');
  } else {
    // Default: certificates view
    setActiveMenuItem('menu-item-certs');
    switchSection('certificates-view-section');
  }
  
  fetchCertificates();
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

  // Filter list based on search, active sidebar state, and category
  const filteredCerts = certificates.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                          cert.org.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || cert.category.toLowerCase() === selectedCategory.toLowerCase();
    
    if (activeFilter === 'favorites') {
      return matchesSearch && matchesCategory && cert.favorite;
    }
    return matchesSearch && matchesCategory;
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

}

// SPA tab switching logic
function setActiveMenuItem(menuItemId) {
  document.querySelectorAll('.sidebar-menu-item').forEach(li => {
    li.classList.remove('active');
  });
  const activeLi = document.getElementById(menuItemId);
  if (activeLi) {
    activeLi.classList.add('active');
  }
}

function switchSection(sectionId) {
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(sec => {
    sec.classList.remove('active');
    sec.style.display = 'none';
  });

  const activeSec = document.getElementById(sectionId);
  if (activeSec) {
    activeSec.style.display = 'block';
    // Force a reflow to restart transition
    activeSec.offsetHeight;
    activeSec.classList.add('active');
  }
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

  // Sidebar links tab switching
  const certsBtn = document.getElementById('certificates-menu-btn');
  const favoritesBtn = document.getElementById('favorites-menu-btn');

  if (certsBtn) {
    certsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      activeFilter = 'all';
      setActiveMenuItem('menu-item-certs');
      switchSection('certificates-view-section');
      renderDashboard();
    });
  }

  if (favoritesBtn) {
    favoritesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      activeFilter = 'favorites';
      setActiveMenuItem('menu-item-favs');
      switchSection('certificates-view-section');
      renderDashboard();
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
  ['add-certificate-modal', 'profile-modal', 'view-certificate-modal', 'edit-certificate-modal', 'delete-confirmation-modal', 'share-certificate-modal', 'fullscreen-cert-modal', 'logout-confirmation-modal'].forEach(modalId => {
    const container = document.getElementById(modalId);
    if (container) {
      container.addEventListener('click', (e) => {
        if (e.target === container) {
          closeModal(modalId);
        }
      });
    }
  });

  // ESC key listener to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal-overlay.active');
      activeModals.forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  setupEditModalForm();

  // Close active dropdowns on window clicks
  window.addEventListener('click', () => {
    closeAllDropdowns();
  });

  // Filter Dropdown Handlers
  const filterBtn = document.getElementById('filter-header-btn');
  const filterMenu = document.getElementById('filter-dropdown-menu');

  if (filterBtn && filterMenu) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = filterMenu.style.display === 'flex';
      filterMenu.style.display = isVisible ? 'none' : 'flex';
    });

    // Handle filter item selection
    const filterItems = filterMenu.querySelectorAll('.filter-dropdown-item');
    filterItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove active class from all items, add to clicked item
        filterItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Update selectedCategory state & render
        selectedCategory = item.dataset.category;
        renderDashboard();

        // Close menu
        filterMenu.style.display = 'none';
      });
    });
  }
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
  const filterMenu = document.getElementById('filter-dropdown-menu');
  if (filterMenu) {
    filterMenu.style.display = 'none';
  }
}

// Add/Remove favorites state
function toggleFavorite(id, event) {
  event.stopPropagation();
  const cert = certificates.find(c => c.id === id);
  if (cert) {
    cert.favorite = !cert.favorite;
    
    // Save to localStorage by user ID to work around schema limits
    const userId = getUserIdFromToken();
    if (userId) {
      const favKey = `favorites_user_${userId}`;
      let favs = JSON.parse(localStorage.getItem(favKey)) || [];
      if (cert.favorite) {
        if (!favs.includes(id)) favs.push(id);
      } else {
        favs = favs.filter(favId => favId !== id);
      }
      localStorage.setItem(favKey, JSON.stringify(favs));
    }

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
  const catTextEl = document.getElementById('view-cert-category-text');
  const orgEl = document.getElementById('view-cert-org');
  const dateEl = document.getElementById('view-cert-date');
  const credEl = document.getElementById('view-cert-credential-id');
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
  if (catTextEl) {
    catTextEl.textContent = cert.category;
  }
  if (orgEl) orgEl.textContent = cert.org;
  if (dateEl) dateEl.textContent = cert.date;
  if (credEl) credEl.textContent = cert.credentialId || 'N/A';
  
  // Verification status element was removed
  
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
    // Remove any existing preview media element first
    const existingMedia = mockBadge.querySelector('.cert-preview-media');
    if (existingMedia) {
      existingMedia.remove();
    }

    if (cert.image) {
      mockBadge.querySelector('.cert-mockup-border').style.opacity = '0';
      const isPdf = cert.imageName && cert.imageName.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        const iframe = document.createElement('iframe');
        iframe.className = 'cert-preview-media';
        iframe.src = `${cert.image}#toolbar=0&navpanes=0&scrollbar=0`;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = 'var(--radius-sm)';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.zIndex = '1';
        mockBadge.appendChild(iframe);
      } else {
        const img = document.createElement('img');
        img.className = 'cert-preview-media';
        img.src = cert.image;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = 'var(--radius-sm)';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.zIndex = '1';
        mockBadge.appendChild(img);
      }
      const maximizeBtn = document.getElementById('view-cert-maximize');
      if (maximizeBtn) {
        maximizeBtn.style.zIndex = '2';
      }
    } else {
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
    const isPdf = cert.imageName && cert.imageName.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      container.innerHTML = `<iframe src="${cert.image}" style="width: 80vw; height: 80vh; border: none; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); border: 2px solid rgba(255,255,255,0.15);"></iframe>`;
    } else {
      container.innerHTML = `<img src="${cert.image}" alt="Certificate: ${escapeHTML(cert.title)}" style="max-width: 100%; max-height: 85vh; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); border: 2px solid rgba(255,255,255,0.15);">`;
    }
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
    const isPdf = cert.imageName.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      previewIcon.className = 'fa-regular fa-file-pdf file-icon';
      previewIcon.style.color = '#ef4444';
    } else {
      previewIcon.className = 'fa-regular fa-file-image file-icon';
      previewIcon.style.color = '#2563eb';
    }
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
    confirmBtn.onclick = async () => {
      closeModal('delete-confirmation-modal');
      const token = getAuthToken();
      try {
        const response = await fetch(`http://localhost:5000/api/certificates/${cert.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          showToast(data.message || 'Failed to delete certificate', 'error');
          return;
        }

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
      } catch (error) {
        console.error('Error deleting certificate:', error);
        showToast('Network error deleting certificate', 'error');
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const idVal = parseInt(document.getElementById('edit-cert-id').value);
    const titleVal = document.getElementById('edit-cert-title').value.trim();
    const orgVal = document.getElementById('edit-cert-org').value.trim();
    const dateVal = document.getElementById('edit-cert-date').value;
    const urlVal = document.getElementById('edit-cert-url').value.trim();
    const credIdVal = document.getElementById('edit-cert-credentialId').value.trim();
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
      const formData = new FormData();
      formData.append('title', titleVal);
      formData.append('organization', orgVal);
      formData.append('category', catSelect.value);
      formData.append('issue_date', dateVal || new Date().toISOString().split('T')[0]);
      formData.append('verification_url', urlVal || '#');
      formData.append('credentialId', credIdVal);
      formData.append('description', descVal || 'No description provided.');
      
      if (editSelectedFile) {
        formData.append('file', editSelectedFile);
      }

      const token = getAuthToken();
      try {
        const response = await fetch(`http://localhost:5000/api/certificates/${idVal}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          showToast(data.message || 'Failed to update certificate', 'error');
          return;
        }

        showToast('Certificate Updated Successfully', 'success');
        closeModal('edit-certificate-modal');
        fetchCertificates();
      } catch (error) {
        console.error('Error updating certificate:', error);
        showToast('Network error updating certificate', 'error');
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
