// Get username from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

if (!username) {
    window.location.href = '/frontend/index.html';
}

// Check auth state on load
document.addEventListener('DOMContentLoaded', () => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
        currentUser = JSON.parse(storedUser);
        accessToken = storedToken;
        updateUIForLoggedInUser();
    }

    // Add event listeners for auth buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const authForm = document.getElementById('authForm');
    const authToggle = document.getElementById('authToggle');
    const discordLogin = document.getElementById('discordLogin');
    const uploadBtn = document.getElementById('uploadBtn');
    const closeUploadModal = document.getElementById('closeUploadModal');
    const closePreviewModal = document.getElementById('closePreviewModal');

    let isLoginMode = true;

    loginBtn?.addEventListener('click', () => {
        isLoginMode = true;
        updateAuthModalUI();
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('authModal').classList.add('flex');
    });

    registerBtn?.addEventListener('click', () => {
        isLoginMode = false;
        updateAuthModalUI();
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('authModal').classList.add('flex');
    });

    closeAuthModal?.addEventListener('click', () => {
        document.getElementById('authModal').classList.remove('flex');
        document.getElementById('authModal').classList.add('hidden');
    });

    authToggle?.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        updateAuthModalUI();
    });

    discordLogin?.addEventListener('click', () => {
        window.location.href = `${API_URL}/auth/discord`;
    });

    uploadBtn?.addEventListener('click', () => {
        document.getElementById('uploadModal').classList.remove('hidden');
        document.getElementById('uploadModal').classList.add('flex');
    });

    closeUploadModal?.addEventListener('click', () => {
        document.getElementById('uploadModal').classList.remove('flex');
        document.getElementById('uploadModal').classList.add('hidden');
    });

    closePreviewModal?.addEventListener('click', () => {
        document.getElementById('previewModal').classList.remove('flex');
        document.getElementById('previewModal').classList.add('hidden');
    });

    function updateAuthModalUI() {
        document.getElementById('authTitle').textContent = isLoginMode ? 'Login' : 'Register';
        document.getElementById('authButtonText').textContent = isLoginMode ? 'Login' : 'Register';
        document.getElementById('authToggleText').textContent = isLoginMode ? "Don't have an account?" : 'Already have an account?';
        document.getElementById('authToggle').textContent = isLoginMode ? 'Register' : 'Login';
        document.getElementById('nameField').classList.toggle('hidden', isLoginMode);
    }

    // Load profile data
    loadProfile();
});

// Load profile data
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/profile/${username}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }

        // Update profile info with animation
        const avatar = document.getElementById('profileAvatar');
        const name = document.getElementById('profileName');
        const joinDate = document.getElementById('profileJoinDate');
        const wallpaperCount = document.getElementById('profileWallpaperCount');
        const downloadCount = document.getElementById('profileDownloadCount');

        // Fade in animations
        [avatar, name, joinDate].forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
        });

        avatar.src = data.user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
        name.textContent = data.user.name;
        joinDate.textContent = `Joined ${new Date(data.user.createdAt).toLocaleDateString()}`;
        
        // Animate stats with counting effect
        animateCount(wallpaperCount, 0, data.stats.totalWallpapers);
        animateCount(downloadCount, 0, data.stats.totalDownloads);

        // Fade in elements sequentially
        setTimeout(() => {
            avatar.style.transition = 'all 0.5s ease';
            avatar.style.opacity = '1';
            avatar.style.transform = 'translateY(0)';
        }, 100);

        setTimeout(() => {
            name.style.transition = 'all 0.5s ease';
            name.style.opacity = '1';
            name.style.transform = 'translateY(0)';
        }, 200);

        setTimeout(() => {
            joinDate.style.transition = 'all 0.5s ease';
            joinDate.style.opacity = '1';
            joinDate.style.transform = 'translateY(0)';
        }, 300);

        // Load wallpapers with grid animation
        loadProfileWallpapers(data.wallpapers);
        
        // Update page title
        document.title = `${data.user.name}'s Profile - Wallpaper4Free`;
        
    } catch (error) {
        console.error('Profile error:', error);
        const errorMessage = error.message || 'Failed to load profile';
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = errorMessage;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Load profile wallpapers with grid animation
function loadProfileWallpapers(wallpapers) {
    const grid = document.getElementById('profileWallpapers');
    grid.innerHTML = '';
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    
    if (wallpapers.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-image text-gray-400 text-5xl mb-4"></i>
                <p class="text-gray-500">No wallpapers uploaded yet</p>
            </div>
        `;
        return;
    }

    wallpapers.forEach((wallpaper, index) => {
        const isOwnProfile = currentUser && currentUser.name === username;
        const card = document.createElement('div');
        card.className = 'relative group bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl';
        
        let deleteButton = '';
        if (isOwnProfile) {
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

        grid.appendChild(card);
        
        // Add fade-in animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Update preview modal function
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
    previewDescription.textContent = wallpaper.description || 'No description available';
    downloadCount.textContent = `${wallpaper.downloads || 0} downloads`;
    
    // Fetch and display user info
    fetch(`${API_URL}/users/${wallpaper.userId}`)
        .then(res => res.json())
        .then(data => {
            previewUserAvatar.src = data.user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
            previewUserName.textContent = data.user.name;
            previewUserName.href = `${window.location.origin}/frontend/profile.html?username=${encodeURIComponent(data.user.name)}`;
        });
    
    // Download handler with loading and success states
    downloadBtn.onclick = async () => {
        try {
            // Show loading state
            downloadBtn.disabled = true;
            downloadBtn.classList.remove('hover:bg-primary-700', 'active:transform', 'active:scale-95');
            downloadBtn.classList.add('bg-primary-700', 'cursor-wait', 'opacity-75');
            downloadBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2 text-xl"></i>
                <span>Starting Download...</span>
            `;
            
            const response = await fetch(`${API_URL}/wallpapers/${wallpaper.id}/download`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                // Create download link
                const link = document.createElement('a');
                link.href = wallpaper.blobUrl;
                link.download = `${wallpaper.name}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Update download count
                downloadCount.textContent = `${data.downloads} downloads`;
                
                // Show success state
                downloadBtn.classList.remove('bg-primary-700', 'cursor-wait', 'opacity-75');
                downloadBtn.classList.add('bg-green-500', 'hover:bg-green-600');
                downloadBtn.innerHTML = `
                    <i class="fas fa-check-circle mr-2 text-xl"></i>
                    <span>Downloaded Successfully!</span>
                `;
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    downloadBtn.disabled = false;
                    downloadBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                    downloadBtn.classList.add('bg-primary-600', 'hover:bg-primary-700', 'active:transform', 'active:scale-95');
                    downloadBtn.innerHTML = `
                        <i class="fas fa-download mr-2 text-xl"></i>
                        <span>Download Wallpaper</span>
                    `;
                }, 2000);
            }
        } catch (error) {
            // Reset button on error
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('bg-primary-700', 'cursor-wait', 'opacity-75');
            downloadBtn.classList.add('bg-primary-600', 'hover:bg-primary-700', 'active:transform', 'active:scale-95');
            downloadBtn.innerHTML = `
                <i class="fas fa-download mr-2 text-xl"></i>
                <span>Download Wallpaper</span>
            `;
            showToast('Failed to download wallpaper', 'error');
        }
    };
    
    previewModal.classList.remove('hidden');
    previewModal.classList.add('flex');
}

// Close modal handlers
document.getElementById('closePreviewModal')?.addEventListener('click', () => {
    document.getElementById('previewModal').classList.remove('flex');
    document.getElementById('previewModal').classList.add('hidden');
});

document.getElementById('closePreviewBtn')?.addEventListener('click', () => {
    document.getElementById('previewModal').classList.remove('flex');
    document.getElementById('previewModal').classList.add('hidden');
});

// Add these styles for animations
const style = document.createElement('style');
style.textContent = `
    #previewModal {
        transition: opacity 0.3s ease-in-out;
    }
    .text-shadow {
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    .text-shadow-lg {
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    .text-shadow-sm {
        text-shadow: 0 1px 1px rgba(0,0,0,0.5);
    }
`;
document.head.appendChild(style);

// Filter handlers
document.getElementById('profileCategoryFilter').addEventListener('change', (e) => {
    const category = e.target.value;
    const wallpapers = document.querySelectorAll('.wallpaper-card');
    
    wallpapers.forEach(card => {
        const cardCategory = card.querySelector('p').textContent;
        if (!category || cardCategory === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

document.getElementById('profileSortFilter').addEventListener('change', (e) => {
    const sort = e.target.value;
    const grid = document.getElementById('profileWallpapers');
    const wallpapers = Array.from(grid.children);
    
    wallpapers.sort((a, b) => {
        if (sort === 'recent') {
            return new Date(b.dataset.date) - new Date(a.dataset.date);
        } else if (sort === 'popular') {
            return b.dataset.downloads - a.dataset.downloads;
        } else {
            return a.dataset.name.localeCompare(b.dataset.name);
        }
    });
    
    wallpapers.forEach(card => grid.appendChild(card));
});

// Animate counting for stats
function animateCount(element, start, end) {
    const duration = 1000;
    const frames = 60;
    const increment = (end - start) / frames;
    let current = start;
    
    const animate = () => {
        current += increment;
        element.textContent = Math.round(current);
        
        if (current < end) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = end;
        }
    };
    
    animate();
} 