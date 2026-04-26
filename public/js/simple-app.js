/**
 * Linkaty - Simple Standalone App
 * تطبيق لينكاتي المستقل بدون اعتماديات
 */

// ========== Constants ==========
const DEFAULT_FAVORITES = [
    'https://translate.google.com',
    'https://web.whatsapp.com',
    'https://www.facebook.com',
    'https://www.youtube.com',
    'https://gemini.google.com/',
    'https://claude.ai/new'
];

// ========== Utility Functions ==========

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Get the currently active category filter
 * @returns {string} Active category name
 */
function getActiveCategory() {
    const activeBtn = document.querySelector('.category-btn.active');
    return activeBtn ? activeBtn.dataset.category : 'all';
}

// ========== Loading ==========

function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'none';
    }
    document.body.classList.add('loaded');
    document.body.style.opacity = '1';
}

// ========== Icon Fallback ==========

function initializeIconFallback() {
    const defaultIcon = '/images/icons/default-icon.svg';
    const images = document.querySelectorAll('.icon-image');

    images.forEach(img => {
        if (!img.onerror) {
            img.onerror = function () {
                if (this.src.indexOf(defaultIcon) === -1 && !this.dataset.fallbackAttempted) {
                    this.dataset.fallbackAttempted = 'true';
                    console.log(`Icon failed to load: ${this.src}, using fallback`);

                    const card = this.closest('.card');
                    const domain = card?.dataset?.url;

                    if (domain && !this.dataset.secondAttempt) {
                        try {
                            const url = new URL(domain);
                            const hostname = url.hostname;
                            this.dataset.secondAttempt = 'true';
                            this.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
                        } catch (e) {
                            this.src = defaultIcon;
                        }
                    } else {
                        this.src = defaultIcon;
                    }
                }
            };
        }

        // Check if image is already broken
        if (img.complete && img.naturalWidth === 0) {
            img.onerror();
        }

        // Fix mixed content issues
        if (window.location.protocol === 'https:' && img.src.startsWith('http://')) {
            console.warn(`Mixed content warning: ${img.src}`);
            img.src = img.src.replace('http://', 'https://');
        }
    });

    // Global error handler for dynamically added images
    document.addEventListener('error', function (e) {
        if (e.target.classList && e.target.classList.contains('icon-image')) {
            const img = e.target;
            if (img.src.indexOf(defaultIcon) === -1) {
                img.src = defaultIcon;
            }
        }
    }, true);
}

// ========== Theme ==========

function initializeTheme() {
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;

    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem('app-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);

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

// ========== Search ==========

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

/**
 * Filter cards by search query while respecting active category
 * @param {string} query - Search term
 */
function filterCards(query) {
    const cards = document.querySelectorAll('.card');
    const searchTerm = query.toLowerCase().trim();
    const activeCategory = getActiveCategory();
    const favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.description')?.textContent.toLowerCase() || '';
        const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm);

        // Also check category filter
        let matchesCategory = true;
        if (activeCategory === 'favorites') {
            matchesCategory = favorites.includes(card.dataset.url);
        } else if (activeCategory !== 'all') {
            matchesCategory = card.dataset.category === activeCategory;
        }

        const isVisible = matchesSearch && matchesCategory;
        card.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
    });
}

// ========== Card Clicks ==========

function initializeCardClicks() {
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card && !e.target.closest('.favorite-btn')) {
            e.preventDefault();
            const url = card.dataset.url;
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    });
}

// ========== Favorites Bar Drag & Drop ==========

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

// ========== Favorites Bar ==========

function updateFavoritesBar() {
    const favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
    const favoritesBar = document.getElementById('favoritesBar');
    const favoritesBarContent = document.getElementById('favoritesBarContent');

    if (!favoritesBar || !favoritesBarContent) return;

    // Clear current content (also removes old event listeners)
    favoritesBarContent.innerHTML = '';

    if (favorites.length > 0) {
        favoritesBar.classList.add('has-favorites');

        favorites.forEach(url => {
            const card = document.querySelector(`.card[data-url="${CSS.escape(url)}"]`);
            if (!card) return;

            const title = card.dataset.title || card.querySelector('.title')?.textContent || 'Link';
            const iconSrc = card.querySelector('.icon-image')?.src || '';
            const customIcon = card.querySelector('.custom-icon');
            const description = card.dataset.description || card.querySelector('.description')?.textContent || '';

            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item-wrapper';
            favoriteItem.draggable = true;
            favoriteItem.dataset.url = url;

            // Build icon HTML safely
            let iconElement;
            if (customIcon) {
                const wrapper = document.createElement('div');
                wrapper.className = 'icon-wrapper-small';
                wrapper.appendChild(customIcon.cloneNode(true));
                iconElement = wrapper;
            } else {
                let faviconUrl = iconSrc;
                if (iconSrc && iconSrc.includes('google.com/s2/favicons')) {
                    try {
                        const domain = new URL(url).hostname;
                        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                    } catch (e) {
                        faviconUrl = iconSrc;
                    }
                }
                const img = document.createElement('img');
                img.src = faviconUrl;
                img.alt = escapeHTML(title);
                img.onerror = function () {
                    this.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=128';
                };
                iconElement = img;
            }

            // Build remove button safely
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-favorite-btn';
            removeBtn.dataset.url = url;
            removeBtn.title = 'إزالة من المفضلة';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';

            // Build link safely
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'favorite-item';
            link.title = escapeHTML(description);
            link.appendChild(iconElement);

            const titleDiv = document.createElement('div');
            titleDiv.className = 'favorite-item-title';
            titleDiv.textContent = title; // Safe: textContent auto-escapes
            link.appendChild(titleDiv);

            favoriteItem.appendChild(removeBtn);
            favoriteItem.appendChild(link);
            favoritesBarContent.appendChild(favoriteItem);
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
            let currentFavorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');

            currentFavorites = currentFavorites.filter(u => u !== urlToRemove);
            localStorage.setItem('app-favorites', JSON.stringify(currentFavorites));

            // Update the card's favorite button
            const card = document.querySelector(`.card[data-url="${CSS.escape(urlToRemove)}"]`);
            if (card) {
                const favBtn = card.querySelector('.favorite-btn');
                if (favBtn) {
                    favBtn.classList.remove('active');
                    const icon = favBtn.querySelector('i');
                    if (icon) icon.className = 'far fa-heart';
                }
            }

            updateFavoritesBar();
            updateCategoryBadges();
            showToast('تمت الإزالة من المفضلة', 'info');
        });
    });

    // Initialize drag and drop for favorites bar
    initializeFavoritesBarDragDrop();
}

// ========== Card Buttons ==========

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

// ========== Favorites ==========

function initializeFavorites() {
    // Check if this is first visit
    const isFirstVisit = !localStorage.getItem('app-visited');

    // Get saved favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');

    // If first visit or no favorites saved, use defaults
    if (isFirstVisit || favorites.length === 0) {
        favorites = [...DEFAULT_FAVORITES];
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
                if (icon) icon.className = 'fas fa-heart';
                btn.classList.add('active');
            } else {
                if (icon) icon.className = 'far fa-heart';
                btn.classList.remove('active');
            }
        }
    });

    // Update favorites bar
    updateFavoritesBar();

    // Add click listener for toggle (single delegate handler)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.favorite-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.card');
        if (!card) return;

        const url = card.dataset.url;
        const icon = btn.querySelector('i');
        if (!icon) return;

        // Get current favorites
        let currentFavorites = JSON.parse(localStorage.getItem('app-favorites') || '[]');
        const index = currentFavorites.indexOf(url);

        if (index > -1) {
            currentFavorites.splice(index, 1);
            icon.className = 'far fa-heart';
            btn.classList.remove('active');
            showToast('تمت الإزالة من المفضلة', 'info');
        } else {
            currentFavorites.push(url);
            icon.className = 'fas fa-heart';
            btn.classList.add('active');
            showToast('تمت الإضافة للمفضلة', 'success');
        }

        localStorage.setItem('app-favorites', JSON.stringify(currentFavorites));

        updateFavoritesBar();
        updateCategoryBadges();
    });
}

// ========== Category Badges ==========

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

// ========== Category Filter ==========

function initializeCategoryFilter() {
    const buttons = document.querySelectorAll('.category-btn');

    // Update badges initially
    updateCategoryBadges();

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Update active button
            buttons.forEach(b => {
                b.classList.remove('active');
                b.style.transform = 'none';
            });
            btn.classList.add('active');
            btn.style.transform = 'none';

            // Get current search query and apply both filters
            const searchInput = document.getElementById('searchInput');
            const searchQuery = searchInput ? searchInput.value : '';

            // Use filterCards which now respects the active category
            filterCards(searchQuery);
        });
    });
}

// ========== Keyboard Shortcuts ==========

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+K: Focus search
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }

        // Escape: Clear search and reset filter
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                filterCards('');
                const clearBtn = document.getElementById('clearSearch');
                if (clearBtn) clearBtn.style.display = 'none';
            }
        }
    });
}

// ========== Toast Notifications ==========

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${escapeHTML(message)}</span>
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

// ========== Scroll to Top ==========

function initializeScrollTop() {
    const scrollBtn = document.getElementById('scrollTop');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== Drag and Drop (Cards) ==========

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

// ========== Quick Actions ==========

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

    // Reset favorites to defaults
    const clearBtn = document.getElementById('clearAllFavorites');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('هل تريد إعادة تعيين المفضلات إلى الافتراضية؟')) {
                localStorage.setItem('app-favorites', JSON.stringify([...DEFAULT_FAVORITES]));

                // Reset all favorite buttons
                document.querySelectorAll('.favorite-btn').forEach(btn => {
                    const card = btn.closest('.card');
                    if (card && DEFAULT_FAVORITES.includes(card.dataset.url)) {
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

// ========== Dynamic Copyright ==========

function updateCopyrightYear() {
    const copyrightSpan = document.querySelector('.footer-copyright span');
    if (copyrightSpan) {
        const currentYear = new Date().getFullYear();
        copyrightSpan.textContent = `${currentYear} جميع الحقوق محفوظة`;
    }
}

// ========== Main Initialization ==========

function initialize() {
    console.log('🚀 Initializing Linkaty...');

    hideLoading();
    initializeTheme();
    initializeIconFallback();
    initializeSearch();
    initializeCardClicks();
    initializeFavorites();
    initializeCategoryFilter();
    initializeKeyboardShortcuts();
    initializeScrollTop();
    loadCardOrder();
    initializeDragAndDrop();
    // Note: initializeFavoritesBarDragDrop() is called inside updateFavoritesBar()
    initializeQuickActions();
    updateCopyrightYear();

    console.log('✅ Linkaty Initialized Successfully!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
