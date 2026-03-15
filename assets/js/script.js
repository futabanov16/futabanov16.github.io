// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('.theme-icon');

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'dark';
body.classList.add(currentTheme + '-theme');

// Update icon based on current theme
if (currentTheme === 'dark') {
    themeIcon.textContent = '☀️';
} else {
    themeIcon.textContent = '🌙';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    body.classList.toggle('dark-theme');

    const isDark = body.classList.contains('dark-theme');
    themeIcon.textContent = isDark ? '☀️' : '🌙';

    // Save theme preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Hero background scroll effect with parallax
const heroBackground = document.getElementById('heroBackground');
const heroImage = document.getElementById('heroImage');

function updateHeroEffects() {
    if (!heroBackground || !heroImage) return;
    
    const scrollPosition = window.scrollY;
    const heroHeight = heroBackground.offsetHeight;
    const fadeStart = 0;
    const fadeEnd = heroHeight * 0.8; // Start fading when scrolled 80% of image height
    
    // Parallax effect - background moves slower (0.2x speed for long image)
    const parallaxSpeed = 0.2;
    const parallaxOffset = scrollPosition * parallaxSpeed;
    heroImage.style.transform = `translateY(${parallaxOffset}px)`;
    
    // Opacity fade effect - gradually fade from 1 to 0
    let opacity = 1;
    if (scrollPosition >= fadeStart && scrollPosition <= fadeEnd) {
        opacity = 1 - (scrollPosition - fadeStart) / (fadeEnd - fadeStart);
    } else if (scrollPosition > fadeEnd) {
        opacity = 0;
    }
    
    heroImage.style.opacity = opacity;
}

// Run on scroll
window.addEventListener('scroll', updateHeroEffects);

// Run on load
updateHeroEffects();

// Add scrolled class to body for container background
function updateScrolledClass() {
    if (window.scrollY > 100) {
        body.classList.add('scrolled');
    } else {
        body.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', updateScrolledClass);
updateScrolledClass();

// Update last updated date
function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        lastUpdatedElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Run on load
updateLastUpdated();

// Gallery photo organization and lightbox
function organizeGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    const items = Array.from(galleryGrid.querySelectorAll('.gallery-item'));
    if (items.length === 0) return;

    // Store original items for lightbox
    const allItems = items.map(item => {
        const img = item.querySelector('.gallery-image');
        return {
            item: item.cloneNode(true),
            src: img ? img.src : '',
            alt: img ? img.alt : ''
        };
    });

    // Clear existing content
    galleryGrid.innerHTML = '';

    // Separate landscape and portrait images
    const landscapeItems = [];
    const portraitItems = [];
    const squareItems = [];
    let loadedCount = 0;

    function checkAndRender() {
        if (loadedCount === items.length) {
            renderOrganizedGallery(galleryGrid, landscapeItems, portraitItems, squareItems, allItems);
        }
    }

    items.forEach((item, originalIndex) => {
        const img = item.querySelector('.gallery-image');
        if (!img) {
            loadedCount++;
            checkAndRender();
            return;
        }

        // Wait for image to load to determine orientation
        if (img.complete && img.naturalWidth > 0) {
            categorizeImage(item, img, landscapeItems, portraitItems, squareItems);
            loadedCount++;
            checkAndRender();
        } else {
            img.onload = () => {
                categorizeImage(item, img, landscapeItems, portraitItems, squareItems);
                loadedCount++;
                checkAndRender();
            };
            img.onerror = () => {
                loadedCount++;
                checkAndRender();
            };
        }
    });

    // Fallback timeout
    setTimeout(() => {
        if (galleryGrid.children.length === 0) {
            renderOrganizedGallery(galleryGrid, landscapeItems, portraitItems, squareItems, allItems);
        }
    }, 500);
}

function categorizeImage(item, img, landscapeItems, portraitItems, squareItems) {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    if (aspectRatio > 1.1) {
        landscapeItems.push(item);
    } else if (aspectRatio < 0.9) {
        portraitItems.push(item);
    } else {
        squareItems.push(item);
    }
}

function renderOrganizedGallery(container, landscapeItems, portraitItems, squareItems, allItems) {
    // Combine landscape and square items (horizontal orientation)
    const horizontalItems = [...landscapeItems, ...squareItems];
    // Portrait items (vertical orientation)
    const verticalItems = [...portraitItems];
    
    const rows = [];
    const ITEMS_PER_ROW = 3;

    // Helper function to create rows from items
    function createRowsFromItems(items, itemType) {
        let currentRow = null;
        let itemsInRow = 0;

        items.forEach((item, index) => {
            const img = item.querySelector('.gallery-image');
            if (!img) return;

            // Create new row if needed (new type or row is full)
            if (!currentRow || itemsInRow >= ITEMS_PER_ROW) {
                currentRow = document.createElement('div');
                currentRow.className = 'gallery-row';
                rows.push(currentRow);
                itemsInRow = 0;
            }

            // Find original index in allItems
            const originalIndex = allItems.findIndex(orig => orig.src === img.src);
            const clickIndex = originalIndex >= 0 ? originalIndex : index;

            // Store original index as data attribute
            item.setAttribute('data-original-index', clickIndex);

            // Add click event
            item.addEventListener('click', () => {
                const allCurrentItems = Array.from(container.querySelectorAll('.gallery-item'));
                // Sort items by original index to maintain order
                const sortedItems = allCurrentItems.sort((a, b) => {
                    const indexA = parseInt(a.getAttribute('data-original-index')) || 0;
                    const indexB = parseInt(b.getAttribute('data-original-index')) || 0;
                    return indexA - indexB;
                });
                openLightbox(clickIndex, sortedItems);
            });

            currentRow.appendChild(item);
            itemsInRow++;
        });
    }

    // First render horizontal items (landscape and square)
    createRowsFromItems(horizontalItems, 'horizontal');
    
    // Then render vertical items (portrait)
    createRowsFromItems(verticalItems, 'vertical');

    // Append all rows to container
    rows.forEach(row => container.appendChild(row));
}

// Lightbox functionality
let currentLightboxIndex = 0;
let lightboxItems = [];

function openLightbox(index, items) {
    currentLightboxIndex = index;
    lightboxItems = items;

    // Create lightbox if it doesn't exist
    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <span class="lightbox-prev">&#10094;</span>
            <span class="lightbox-next">&#10095;</span>
            <div class="lightbox-content">
                <img class="lightbox-image" src="" alt="Lightbox Image">
            </div>
        `;
        document.body.appendChild(lightbox);

        // Event listeners
        lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox-prev').addEventListener('click', () => changeLightboxImage(-1));
        lightbox.querySelector('.lightbox-next').addEventListener('click', () => changeLightboxImage(1));
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    // Update image
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function changeLightboxImage(direction) {
    currentLightboxIndex += direction;
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = lightboxItems.length - 1;
    } else if (currentLightboxIndex >= lightboxItems.length) {
        currentLightboxIndex = 0;
    }
    updateLightboxImage();
}

function updateLightboxImage() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightboxItems.length === 0) return;

    const img = lightboxItems[currentLightboxIndex].querySelector('.gallery-image');
    if (img) {
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
    }
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') {
        closeLightbox();
    } else if (e.key === 'ArrowLeft') {
        changeLightboxImage(-1);
    } else if (e.key === 'ArrowRight') {
        changeLightboxImage(1);
    }
});

// Run gallery organization on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', organizeGallery);
} else {
    organizeGallery();
}
// Research description show more/less toggles
function initResearchToggles() {
    const toggles = document.querySelectorAll('.research-toggle');
    toggles.forEach(toggle => {
        const targetId = toggle.dataset.target;
        const target = document.getElementById(targetId);
        if (!target) {
            toggle.hidden = true;
            return;
        }

        toggle.addEventListener('click', () => {
            const expanded = target.classList.toggle('expanded');
            toggle.textContent = expanded ? 'Show Less' : 'Show More';
            toggle.setAttribute('aria-expanded', expanded);
        });
    });
}

initResearchToggles();

