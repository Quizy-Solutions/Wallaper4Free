// Constants
const API_URL = 'http://localhost:3001';
let currentUser = null;
let accessToken = null;
let isDropdownOpen = false;

// Check for stored auth data
function checkAuthState() {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
        currentUser = JSON.parse(storedUser);
        accessToken = storedToken;
        updateUIForLoggedInUser();
        loadWallpapers();
    }
}

// DOM Elements
const userSection = document.getElementById('userSection');
const loginSection = document.getElementById('loginSection');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.getElementById('closeAuthModal');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authButtonText = document.getElementById('authButtonText');
const authToggleText = document.getElementById('authToggleText');
const authToggle = document.getElementById('authToggle');
const nameField = document.getElementById('nameField');
const discordLogin = document.getElementById('discordLogin');
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeUploadModal = document.getElementById('closeUploadModal');
const uploadForm = document.getElementById('uploadForm');
const wallpaperGrid = document.getElementById('wallpaperGrid');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const previewModal = document.getElementById('previewModal');
const closePreviewModal = document.getElementById('closePreviewModal');
const mainContent = document.querySelector('main');
const profilePage = document.getElementById('profilePage');
const settingsModal = document.getElementById('settingsModal');
const settingsForm = document.getElementById('settingsForm');
const userDropdown = document.getElementById('userDropdown');
const discordPfpOption = document.getElementById('discordPfpOption');

// Check for Discord auth callback and stored auth
window.addEventListener('load', () => {
    // Check URL hash for Discord login
    if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get('token');
        const user = params.get('user');
        const error = params.get('error');

        if (error) {
            showToast(decodeURIComponent(error), 'error');
        } else if (token && user) {
            handleAuthSuccess({ 
                accessToken: token, 
                user: JSON.parse(decodeURIComponent(user))
            });
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    checkAuthState();
});

// Auth Modal State
let isLoginMode = true;

// Auth Modal Handlers
loginBtn?.addEventListener('click', () => {
    isLoginMode = true;
    updateAuthModalUI();
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
});

registerBtn?.addEventListener('click', () => {
    isLoginMode = false;
    updateAuthModalUI();
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
});

closeAuthModal?.addEventListener('click', () => {
    authModal.classList.remove('flex');
    authModal.classList.add('hidden');
});

authToggle?.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    updateAuthModalUI();
});

function updateAuthModalUI() {
    authTitle.textContent = isLoginMode ? 'Login' : 'Register';
    authButtonText.textContent = isLoginMode ? 'Login' : 'Register';
    authToggleText.textContent = isLoginMode ? "Don't have an account?" : 'Already have an account?';
    authToggle.textContent = isLoginMode ? 'Register' : 'Login';
    nameField.classList.toggle('hidden', isLoginMode);
}

// Auth Form Handler
authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(authForm);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        ...(isLoginMode ? {} : { name: formData.get('name') })
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/${isLoginMode ? 'login' : 'register'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (response.ok) {
            handleAuthSuccess(result);
            authModal.classList.remove('flex');
            authModal.classList.add('hidden');
            authForm.reset();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Discord Login Handler
discordLogin?.addEventListener('click', () => {
    window.location.href = `${API_URL}/auth/discord`;
});

// Auth Success Handler
function handleAuthSuccess(data) {
    currentUser = data.user;
    accessToken = data.accessToken;
    // Store auth data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    updateUIForLoggedInUser();
    showToast('Successfully logged in!', 'success');
    loadWallpapers();
}

// Logout Handler
function logout() {
    currentUser = null;
    accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    loginSection.classList.remove('hidden');
    userSection.classList.add('hidden');
    showToast('Logged out successfully', 'success');
}

// UI Updates
function updateUIForLoggedInUser() {
    if (loginSection && userSection) {
        loginSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.src = currentUser.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
            userAvatar.alt = currentUser.name;
            // Remove click event to prevent accidental logout
            userAvatar.removeEventListener('click', logout);
        }
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Wallpaper Loading
async function loadWallpapers(filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            ...filters,
            sort: sortFilter.value,
            category: categoryFilter.value,
            search: searchInput.value
        });
        
        const response = await fetch(`${API_URL}/wallpapers?${queryParams}`);
        const wallpapers = await response.json();
        
        wallpaperGrid.innerHTML = '';
        
        if (wallpapers.length === 0) {
            wallpaperGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-image text-gray-400 text-5xl mb-4"></i>
                    <p class="text-gray-500">No wallpapers found</p>
                </div>
            `;
            return;
        }

        wallpapers.forEach(wallpaper => {
            const card = createWallpaperCard(wallpaper);
            wallpaperGrid.appendChild(card);
        });
    } catch (error) {
        showToast('Failed to load wallpapers', 'error');
        console.error('Error loading wallpapers:', error);
    }
}

// Wallpaper Card Creation
function createWallpaperCard(wallpaper, showDelete = false) {
    const card = document.createElement('div');
    card.className = 'relative group bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl';
    
    let deleteButton = '';
    if (showDelete && currentUser && wallpaper.userId === currentUser.id) {
        deleteButton = `
            <button onclick="deleteWallpaper('${wallpaper.id}', event)" 
                    class="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hover:bg-red-600">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }
    
    // Create a blob URL for the image to hide the backend URL
    fetch(`${API_URL}${wallpaper.imagePath}`)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            card.innerHTML = `
                <div class="relative group cursor-pointer">
                    <img src="${blobUrl}" alt="${wallpaper.name}" 
                         class="w-full h-48 object-cover" loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div class="absolute bottom-0 left-0 right-0 p-4">
                            <h3 class="text-white font-bold text-lg mb-1">${wallpaper.name}</h3>
                            <div class="flex items-center text-white/90 text-sm">
                                <span>${wallpaper.category}</span>
                                <span class="mx-2">•</span>
                                <span>${wallpaper.downloads || 0} downloads</span>
                            </div>
                        </div>
                    </div>
                    ${deleteButton}
                </div>
            `;

            // Add click handler for preview
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    showPreviewModal({...wallpaper, blobUrl});
                }
            });
        });
    
    return card;
}

// Preview Modal
function showPreviewModal(wallpaper) {
    const previewModal = document.getElementById('previewModal');
    const previewImage = document.getElementById('previewImage');
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const previewUserAvatar = document.getElementById('previewUserAvatar');
    const previewUserName = document.getElementById('previewUserName');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadCount = document.getElementById('downloadCount');
    
    previewImage.src = wallpaper.blobUrl;
    previewTitle.textContent = wallpaper.name;
    previewDescription.textContent = wallpaper.description;
    downloadCount.textContent = `${wallpaper.downloads || 0} downloads`;
    
    // Fetch and display user info
    fetch(`${API_URL}/users/${wallpaper.userId}`)
        .then(res => res.json())
        .then(data => {
            previewUserAvatar.src = data.user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
            previewUserName.textContent = data.user.name;
            previewUserName.href = `${window.location.origin}/frontend/profile.html?username=${encodeURIComponent(data.user.name)}`;
        });
    
    // Download handler
    downloadBtn.onclick = async () => {
        try {
            const response = await fetch(`${API_URL}/wallpapers/${wallpaper.id}/download`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                downloadCount.textContent = `${data.downloads} downloads`;
                const link = document.createElement('a');
                link.href = wallpaper.blobUrl;
                link.download = wallpaper.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            showToast('Failed to download wallpaper', 'error');
        }
    };
    
    previewModal.classList.remove('hidden');
    previewModal.classList.add('flex');
}

// Utility function to copy text to clipboard
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// Upload Modal
uploadBtn.addEventListener('click', () => {
    uploadModal.classList.remove('hidden');
    uploadModal.classList.add('flex');
});

closeUploadModal.addEventListener('click', () => {
    uploadModal.classList.remove('flex');
    uploadModal.classList.add('hidden');
});

closePreviewModal.addEventListener('click', () => {
    previewModal.classList.remove('flex');
    previewModal.classList.add('hidden');
});

// File Upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser || !accessToken) {
        showToast('Please log in to upload wallpapers', 'error');
        return;
    }
    
    const formData = new FormData(uploadForm);
    
    try {
        const response = await fetch(`${API_URL}/wallpapers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            showToast('Wallpaper uploaded successfully!', 'success');
            uploadModal.classList.remove('flex');
            uploadModal.classList.add('hidden');
            uploadForm.reset();
            loadWallpapers();
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        showToast('Failed to upload wallpaper', 'error');
        console.error('Upload error:', error);
    }
});

// Search and Filters
searchInput.addEventListener('input', debounce(() => {
    const filters = {
        search: searchInput.value,
        category: categoryFilter.value,
        sort: sortFilter.value
    };
    loadWallpapers(filters);
}, 300));

categoryFilter.addEventListener('change', () => {
    const filters = {
        search: searchInput.value,
        category: categoryFilter.value,
        sort: sortFilter.value
    };
    loadWallpapers(filters);
});

sortFilter.addEventListener('change', () => {
    const filters = {
        search: searchInput.value,
        category: categoryFilter.value,
        sort: sortFilter.value
    };
    loadWallpapers(filters);
});

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Prevent default drag and drop behavior
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// File Upload Drag and Drop
const uploadZone = document.querySelector('.upload-zone');
if (uploadZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('drag-over');
        });
    });

    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        const fileInput = document.getElementById('wallpaperFile');
        if (fileInput) {
            fileInput.files = files;
        }
    });
}

// Initial Load
loadWallpapers();

// Toggle dropdown
function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    userDropdown.classList.toggle('hidden', !isDropdownOpen);
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#userAvatar') && !e.target.closest('#userDropdown')) {
        isDropdownOpen = false;
        userDropdown.classList.add('hidden');
    }
});

// Profile Page
function showProfilePage(username) {
    if (!username) return;
    
    // Redirect to profile.html with username (using the correct path)
    window.location.href = `${window.location.origin}/frontend/profile.html?username=${encodeURIComponent(username)}`;
}

// Settings
function showSettings() {
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('flex');
    
    const settingsAvatar = document.getElementById('settingsAvatar');
    settingsAvatar.src = currentUser.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
    
    // Show Discord profile picture option if user has Discord linked
    if (currentUser.discordId) {
        discordPfpOption.classList.remove('hidden');
    }
}

function closeSettings() {
    settingsModal.classList.remove('flex');
    settingsModal.classList.add('hidden');
}

function useDiscordPfp() {
    if (currentUser.discordId) {
        const discordAvatar = `https://cdn.discordapp.com/avatars/${currentUser.discordId}/${currentUser.discordAvatar}.png`;
        updateProfilePicture(discordAvatar);
    }
}

// Profile picture update
settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('profilePicInput');
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('avatar', fileInput.files[0]);
        
        try {
            const response = await fetch(`${API_URL}/users/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser.avatar = data.avatar;
                localStorage.setItem('user', JSON.stringify(currentUser));
                updateUIForLoggedInUser();
                showToast('Profile picture updated successfully!', 'success');
                closeSettings();
            }
        } catch (error) {
            showToast('Failed to update profile picture', 'error');
        }
    }
});

// Delete wallpaper
async function deleteWallpaper(wallpaperId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this wallpaper?')) return;
    
    try {
        const response = await fetch(`${API_URL}/wallpapers/${wallpaperId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            showToast('Wallpaper deleted successfully', 'success');
            // Refresh the current view
            if (profilePage.classList.contains('hidden')) {
                loadWallpapers();
            } else {
                showProfilePage(currentUser.name);
            }
        }
    } catch (error) {
        showToast('Failed to delete wallpaper', 'error');
    }
}

// Download handling
async function downloadWallpaper(wallpaper) {
    if (!currentUser || !accessToken) {
        showToast('Please log in to download wallpapers', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/wallpapers/${wallpaper.id}/download`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            const downloadCount = document.getElementById('downloadCount');
            if (downloadCount) {
                downloadCount.textContent = `${data.downloads} downloads`;
            }
            
            // Create a temporary link for download
            const link = document.createElement('a');
            link.href = wallpaper.blobUrl;
            link.download = wallpaper.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        showToast('Failed to download wallpaper', 'error');
    }
} 
