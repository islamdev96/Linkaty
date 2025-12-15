/**
 * Simple Standalone App - No Dependencies
 * تطبيق بسيط مستقل بدون اعتماديات
 */

// Hide loading screen
function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'none';
    }
    // Ensure body is visible
    document.body.classList.add('loaded');
    document.body.style.opacity = '1';
}

// Initialize icon fallback handling
function initializeIconFallback() {
    const defaultIcon = '/images/icons/default-icon.svg';
    const images = document.querySelectorAll('.icon-image');
    
    images.forEach(img => {
        // Set onerror directly on the element
        if (!img.onerror) {
            img.onerror = function() {
                // Prevent infinite loop
                if (this.src.indexOf(defaultIcon) === -1 && !this.dataset.fallbackAttempted) {
                    this.dataset.fallbackAttempted = 'true';
                    console.log(`Icon failed to load: ${this.src}, using fallback`);
                    
                    // Try different fallback sources
                    const card = this.closest('.card');
                    const domain = card?.dataset?.url;
                    
                    if (domain && !this.dataset.secondAttempt) {
                        try {
                            const url = new URL(domain);
                            const hostname = url.hostname;
                            
                            // Try Google Favicon API with HTTPS
                            this.dataset.secondAttempt = 'true';
                            this.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
                        } catch (e) {
                            this.src = defaultIcon;
                        }
                    } else {
                        // Use default icon as final fallback
                        this.src = defaultIcon;
                    }
                }
            };
        }
        
        // Check if image is already broken
        if (img.complete && img.naturalWidth === 0) {
            // Trigger error handler
            img.onerror();
        }
        
        // Also check for mixed content issues
        if (window.location.protocol === 'https:' && img.src.startsWith('http://')) {
            console.warn(`Mixed content warning: ${img.src}`);
            // Convert to HTTPS or use fallback
            img.src = img.src.replace('http://', 'https://');
        }
    });
    
    // Add global error handler for dynamically added images
    document.addEventListener('error', function(e) {
        if (e.target.classList && e.target.classList.contains('icon-image')) {
            const img = e.target;
            if (img.src.indexOf(defaultIcon) === -1) {
                img.src = defaultIcon;
            }
        }
    }, true);
}

// Initialize theme toggle
function initializeTheme() {
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Add click listener
    themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('app-theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize search
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterCards(e.target.value);
            if (clearBtn) {
                clearBtn.style.display = e.target.value ? 'block' : 'none';
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterCards('');
            clearBtn.style.display = 'none';
        });
    }
}

function filterCards(query) {
    const cards = document.querySelectorAll('.card');
    const searchTerm = query.toLowerCase();
    let visibleCount = 0;
    
    cards.forEach(card => {
        const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.description')?.textContent.toLowerCase() || '';
        const matches = title.includes(searchTerm) || description.includes(searchTerm);
        
        card.style.display = matches ? 'block' : 'none';
        if (matches) visibleCount++;
    });
    
}


// Initialize card clicks
function initializeCardClicks() {
    document.addEventListener('click', (e) => {
        // Handle card click
        const card = e.target.closest('.card');
        if (card && !e.target.closest('.favorite-btn')) {
            e.preventDefault();
            const url = card.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
        }
    });
}

// Initialize favorites bar drag and drop
function initializeFavoritesBarDragDrop() {
    const favoritesBarContent = document.getElementById('favoritesBarContent');
    if (!favoritesBarContent) return;
    
    let draggedItem = null;
    
    favoritesBarContent.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('favorite-item-wrapper')) {
            draggedItem = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });
    
    favoritesBarContent.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('favorite-item-wrapper')) {
            e.target.classList.remove('dragging');
        }
    });
    
    favoritesBarContent.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(favoritesBarContent, e.clientX);
        if (afterElement == null) {
            favoritesBarContent.appendChild(draggedItem);
        } else {
            favoritesBarContent.insertBefore(draggedItem, afterElement);
        }
    });
    
    favoritesBarContent.addEventListener('drop', (e) => {
        e.preventDefault();
        
        // Update favorites order in localStorage
        const newOrder = [];
        favoritesBarContent.querySelectorAll('.favorite-item-wrapper').forEach(item => {
            newOrder.push(item.dataset.url);
        });
        localStorage.setItem('app-favorites', JSON.stringify(newOrder));
        
        // Update card buttons to match new order
        updateCardButtons();
    });
}

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.favorite-item-wrapper:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Update favorites bar
function updateFavoritesBar() {
    const favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
    const favoritesBar = document.getElementById('favoritesBar');
    const favoritesBarContent = document.getElementById('favoritesBarContent');
    
    if (!favoritesBar || !favoritesBarContent) return;
    
    // Clear current content
    favoritesBarContent.innerHTML = '';
    
    if (favorites.length > 0) {
        favoritesBar.classList.add('has-favorites');
        
        // Add each favorite to the bar
        favorites.forEach(url => {
            const card = document.querySelector(`.card[data-url="${url}"]`);
            if (card) {
                const title = card.dataset.title || card.querySelector('.title')?.textContent || 'Link';
                const iconSrc = card.querySelector('.icon-image')?.src || '';
                
                // Check if card has custom SVG icon
                const customIcon = card.querySelector('.custom-icon');
                const description = card.dataset.description || card.querySelector('.description')?.textContent || '';
                
                const favoriteItem = document.createElement('div');
                favoriteItem.className = 'favorite-item-wrapper';
                favoriteItem.draggable = true;
                favoriteItem.dataset.url = url;
                
                let iconHtml = '';
                if (customIcon) {
                    // Clone the custom SVG icon
                    iconHtml = `<div class="icon-wrapper-small">${customIcon.outerHTML}</div>`;
                } else {
                    // Use regular image favicon
                    let faviconUrl = iconSrc;
                    if (iconSrc && iconSrc.includes('google.com/s2/favicons')) {
                        try {
                            const domain = new URL(url).hostname;
                            faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                        } catch (e) {
                            faviconUrl = iconSrc;
                        }
                    }
                    iconHtml = `<img src="${faviconUrl}" alt="${title}" onerror="this.src='https://www.google.com/s2/favicons?domain=google.com&sz=128'">`;
                }
                
                favoriteItem.innerHTML = `
                    <button class="remove-favorite-btn" data-url="${url}" title="إزالة من المفضلة">
                        <i class="fas fa-times"></i>
                    </button>
                    <a href="${url}" target="_blank" class="favorite-item" title="${description}">
                        ${iconHtml}
                        <div class="favorite-item-title">${title}</div>
                    </a>
                `;
                
                favoritesBarContent.appendChild(favoriteItem);
            }
        });
    } else {
        favoritesBar.classList.remove('has-favorites');
    }
    
    // Add click listeners for remove buttons
    favoritesBarContent.querySelectorAll('.remove-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const urlToRemove = btn.dataset.url;
            let favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
            
            // Remove from favorites
            favorites = favorites.filter(url => url !== urlToRemove);
            localStorage.setItem('app-favorites', JSON.stringify(favorites));
            
            // Update the card's favorite button
            const card = document.querySelector(`.card[data-url="${urlToRemove}"]`);
            if (card) {
                const favBtn = card.querySelector('.favorite-btn');
                if (favBtn) {
                    favBtn.classList.remove('active');
                    const icon = favBtn.querySelector('i');
                    if (icon) icon.className = 'far fa-heart';
                }
            }
            
            // Update UI
            updateFavoritesBar();
            updateCategoryBadges();
            showToast('تمت الإزالة من المفضلة', 'info');
        });
    });
    
    // Initialize drag and drop for favorites bar
    initializeFavoritesBarDragDrop();
}

// Update card buttons to match current favorites
function updateCardButtons() {
    const favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
    
    document.querySelectorAll('.card').forEach(card => {
        const url = card.dataset.url;
        const btn = card.querySelector('.favorite-btn');
        if (btn) {
            const icon = btn.querySelector('i');
            if (favorites.includes(url)) {
                btn.classList.add('active');
                if (icon) icon.className = 'fas fa-heart';
            } else {
                btn.classList.remove('active');
                if (icon) icon.className = 'far fa-heart';
            }
        }
    });
}

// Initialize favorites
function initializeFavorites() {
    // Default favorites
    const defaultFavorites = [
        'https://translate.google.com',
        'https://web.whatsapp.com',
        'https://www.facebook.com',
        'https://www.youtube.com',
        'https://chatgpt.com/',
        'https://claude.ai/new'
    ];
    
    // Check if this is first visit
    const isFirstVisit = !localStorage.getItem('app-visited');
    
    // Get saved favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
    
    // If first visit or no favorites saved, use defaults
    if (isFirstVisit || favorites.length === 0) {
        favorites = defaultFavorites;
        localStorage.setItem('app-favorites', JSON.stringify(favorites));
        localStorage.setItem('app-visited', 'true');
    }
    
    // Update all favorite buttons based on current favorites
    document.querySelectorAll('.card').forEach(card => {
        const url = card.dataset.url;
        const btn = card.querySelector('.favorite-btn');
        if (btn) {
            const icon = btn.querySelector('i');
            if (favorites.includes(url)) {
                // This is a favorite
                if (icon) icon.className = 'fas fa-heart';
                btn.classList.add('active');
            } else {
                // Not a favorite
                if (icon) icon.className = 'far fa-heart';
                btn.classList.remove('active');
            }
        }
    });
    
    // Update favorites bar
    updateFavoritesBar();
    
    // Add click listener for toggle
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.favorite-btn');
        if (!btn) return;
        
        e.preventDefault();
        e.stopPropagation(); // Stop event from reaching card click
        const card = btn.closest('.card');
        if (!card) return;
        
        const url = card.dataset.url;
        const icon = btn.querySelector('i');
        if (!icon) return;
        
        // Get current favorites
        favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
        const index = favorites.indexOf(url);
        
        if (index > -1) {
            // Remove from favorites
            favorites.splice(index, 1);
            icon.className = 'far fa-heart'; // Empty heart
            btn.classList.remove('active');
            showToast('تمت الإزالة من المفضلة', 'info');
        } else {
            // Add to favorites
            favorites.push(url);
            icon.className = 'fas fa-heart'; // Filled heart
            btn.classList.add('active');
            showToast('تمت الإضافة للمفضلة', 'success');
        }
        
        // Save updated favorites
        localStorage.setItem('app-favorites', JSON.stringify(favorites));
        
        // Update favorites bar and badges
        updateFavoritesBar();
        updateCategoryBadges();
    });
}

// Update category badges
function updateCategoryBadges() {
    const buttons = document.querySelectorAll('.category-btn');
    const cards = document.querySelectorAll('.card');
    const favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
    
    buttons.forEach(btn => {
        const category = btn.dataset.category;
        let count = 0;
        
        if (category === 'all') {
            count = cards.length;
        } else if (category === 'favorites') {
            count = favorites.length;
        } else {
            cards.forEach(card => {
                if (card.dataset.category === category) count++;
            });
        }
        
        // Remove existing badge if any
        const existingBadge = btn.querySelector('.badge');
        if (existingBadge) existingBadge.remove();
        
        // Add new badge
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = count;
            btn.appendChild(badge);
        }
    });
}

// Initialize category filter
function initializeCategoryFilter() {
    const buttons = document.querySelectorAll('.category-btn');
    
    // Update badges initially
    updateCategoryBadges();
    
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Update active button simply
            buttons.forEach(b => {
                b.classList.remove('active');
                b.style.transform = 'none';
            });
            btn.classList.add('active');
            btn.style.transform = 'none';
            
            // Filter cards
            const category = btn.dataset.category;
            const cards = document.querySelectorAll('.card');
            let visibleCount = 0;
            
            if (category === 'favorites') {
                // Show only favorites
                const favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
                cards.forEach(card => {
                    const isFavorite = favorites.includes(card.dataset.url);
                    card.style.display = isFavorite ? 'block' : 'none';
                    if (isFavorite) visibleCount++;
                });
            } else {
                // Regular category filter
                cards.forEach(card => {
                    const matches = category === 'all' || card.dataset.category === category;
                    card.style.display = matches ? 'block' : 'none';
                    if (matches) visibleCount++;
                });
            }
            
                });
    });
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

// Show toast notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Scroll to top
function initializeScrollTop() {
    const scrollBtn = document.getElementById('scrollTop');
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', () => {
        scrollBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Drag and Drop functionality
function initializeDragAndDrop() {
    const cards = document.querySelectorAll('.card');
    const grid = document.getElementById('linksGrid');
    let draggedElement = null;
    
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        
        card.addEventListener('dragstart', (e) => {
            draggedElement = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.innerHTML);
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (card !== draggedElement) {
                card.classList.add('drag-over');
            }
        });
        
        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            
            if (card !== draggedElement && draggedElement) {
                // Swap positions
                const allCards = [...grid.children];
                const draggedIndex = allCards.indexOf(draggedElement);
                const targetIndex = allCards.indexOf(card);
                
                if (draggedIndex < targetIndex) {
                    card.parentNode.insertBefore(draggedElement, card.nextSibling);
                } else {
                    card.parentNode.insertBefore(draggedElement, card);
                }
                
                saveCardOrder();
                showToast('تم تغيير الترتيب بنجاح');
            }
        });
    });
}

function saveCardOrder() {
    const cards = document.querySelectorAll('.card');
    const order = Array.from(cards).map(card => card.dataset.url);
    localStorage.setItem('card-order', JSON.stringify(order));
}

function loadCardOrder() {
    const savedOrder = localStorage.getItem('card-order');
    if (!savedOrder) return;
    
    const order = JSON.parse(savedOrder);
    const grid = document.getElementById('linksGrid');
    const cards = Array.from(document.querySelectorAll('.card'));
    
    order.forEach(url => {
        const card = cards.find(c => c.dataset.url === url);
        if (card) {
            grid.appendChild(card);
        }
    });
}

// Add entrance animations (simplified)
function addEntranceAnimations() {
    // Simplified - no staggered animations for cleaner experience
}

// Add ripple effect to buttons (disabled for simplicity)
function addRippleEffect() {
    // Disabled - no ripple effect for cleaner interaction
}

// Initialize quick actions
function initializeQuickActions() {
    // Toggle favorites view
    const toggleBtn = document.getElementById('toggleFavoritesView');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const favBtn = document.querySelector('[data-category="favorites"]');
            if (favBtn) {
                favBtn.click();
            }
        });
    }
    
    // Clear all favorites
    const clearBtn = document.getElementById('clearAllFavorites');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('هل تريد إعادة تعيين المفضلات إلى الافتراضية؟')) {
                // Reset to default favorites
                const defaultFavorites = [
                    'https://translate.google.com',
                    'https://web.whatsapp.com',
                    'https://www.facebook.com',
                    'https://www.youtube.com',
                    'https://chatgpt.com/',
                    'https://claude.ai/new'
                ];
                
                localStorage.setItem('app-favorites', JSON.stringify(defaultFavorites));
                
                // Reset all favorite buttons
                document.querySelectorAll('.favorite-btn').forEach(btn => {
                    const card = btn.closest('.card');
                    if (card && defaultFavorites.includes(card.dataset.url)) {
                        btn.classList.add('active');
                        const icon = btn.querySelector('i');
                        if (icon) icon.className = 'fas fa-heart';
                    } else {
                        btn.classList.remove('active');
                        const icon = btn.querySelector('i');
                        if (icon) icon.className = 'far fa-heart';
                    }
                });
                
                updateFavoritesBar();
                updateCategoryBadges();
                showToast('تم إعادة تعيين المفضلات', 'success');
            }
        });
    }
}

// Main initialization
function initialize() {
    console.log('🚀 Initializing Modern Links Hub...');
    
    hideLoading();
    initializeTheme();
    initializeIconFallback(); // Handle icon loading errors
    initializeSearch();
    initializeCardClicks();
    initializeFavorites();
    initializeCategoryFilter();
    initializeKeyboardShortcuts();
    initializeScrollTop();
    loadCardOrder();
    initializeDragAndDrop();
    initializeFavoritesBarDragDrop();
    initializeQuickActions(); // Fix: Added this call to make reset favorites work
    addEntranceAnimations();
    addRippleEffect();
    
    console.log('✅ Modern Links Hub Initialized Successfully!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
