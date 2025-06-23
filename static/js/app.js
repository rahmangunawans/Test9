// Main application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (mobileMenu.classList.contains('open')) {
                mobileMenu.classList.remove('open');
                mobileMenu.style.maxHeight = '0';
            } else {
                mobileMenu.classList.add('open');
                mobileMenu.style.maxHeight = '500px';
            }
            
            // Toggle icon
            const icon = mobileMenuButton.querySelector('i');
            if (mobileMenu.classList.contains('open')) {
                icon.className = 'fas fa-times text-xl';
            } else {
                icon.className = 'fas fa-bars text-xl';
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('open');
                mobileMenu.style.maxHeight = '0';
                const icon = mobileMenuButton.querySelector('i');
                icon.className = 'fas fa-bars text-xl';
            }
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length > 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            } else {
                hideSearchResults();
            }
        });
        
        // Hide search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target)) {
                hideSearchResults();
            }
        });
    }
    
    // Auto-hide flash messages
    const flashMessages = document.querySelectorAll('[class*="alert-"]');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    });
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Carousel scroll buttons (if present)
    initializeCarousels();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Watch progress tracking
    initializeWatchProgress();
});

// Search functionality
function performSearch(query) {
    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(results => {
            displaySearchResults(results);
        })
        .catch(error => {
            console.error('Search error:', error);
        });
}

function displaySearchResults(results) {
    let searchResults = document.getElementById('search-results');
    
    if (!searchResults) {
        searchResults = document.createElement('div');
        searchResults.id = 'search-results';
        searchResults.className = 'absolute top-full left-0 right-0 bg-gray-800 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50';
        document.querySelector('#search-input').parentNode.appendChild(searchResults);
    }
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="p-4 text-gray-400 text-center">No results found</div>';
    } else {
        const resultsHTML = results.map(result => `
            <div class="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0">
                <div class="flex items-center space-x-3">
                    <img src="${result.thumbnail}" alt="${result.title}" class="w-10 h-14 object-cover rounded">
                    <div>
                        <div class="text-white font-medium">${result.title}</div>
                        <div class="text-gray-400 text-sm capitalize">${result.type}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        searchResults.innerHTML = resultsHTML;
        
        // Add click handlers
        searchResults.querySelectorAll('.cursor-pointer').forEach((item, index) => {
            item.addEventListener('click', () => {
                window.location.href = `/anime/${results[index].id}`;
            });
        });
    }
    
    searchResults.style.display = 'block';
}

function hideSearchResults() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Carousel initialization
function initializeCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    
    carousels.forEach(carousel => {
        let isDown = false;
        let startX;
        let scrollLeft;
        
        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            carousel.classList.add('active');
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });
        
        carousel.addEventListener('mouseleave', () => {
            isDown = false;
            carousel.classList.remove('active');
        });
        
        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.classList.remove('active');
        });
        
        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeft - walk;
        });
        
        // Touch support
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });
        
        carousel.addEventListener('touchmove', (e) => {
            const x = e.touches[0].pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeft - walk;
        });
    });
}

// Tooltip initialization
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bg-gray-800 text-white text-xs rounded px-2 py-1 z-50 pointer-events-none opacity-0 transition-opacity duration-200';
        tooltip.textContent = tooltipText;
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.marginBottom = '5px';
        
        element.style.position = 'relative';
        element.appendChild(tooltip);
        
        element.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}

// Watch progress tracking
function initializeWatchProgress() {
    // This will be used by the video player to track watch progress
    window.updateWatchProgress = function(episodeId, watchTime, completed = false) {
        fetch('/api/update-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                episode_id: episodeId,
                watch_time: watchTime,
                completed: completed
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Failed to update watch progress:', data.message);
            }
        })
        .catch(error => {
            console.error('Error updating watch progress:', error);
        });
    };
}

// Utility functions
function showLoading(element) {
    if (element) {
        element.classList.add('btn-loading');
        element.disabled = true;
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.remove('btn-loading');
        element.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm alert-${type}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <div class="text-white">
                ${message}
            </div>
            <button class="ml-4 text-white hover:text-gray-300" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for use in other scripts
window.AniFlix = {
    showLoading,
    hideLoading,
    showNotification,
    updateWatchProgress: window.updateWatchProgress
};
