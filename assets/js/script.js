// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('.theme-icon');

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
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
const heroVideo = document.getElementById('heroVideo');

function updateHeroEffects() {
    if (!heroBackground) return;

    const scrollPosition = window.scrollY;
    const heroHeight = heroBackground.offsetHeight;
    const fadeStart = 0;
    const fadeEnd = heroHeight * 0.8;

    const parallaxSpeed = 0.2;
    const parallaxOffset = scrollPosition * parallaxSpeed;

    let opacity = 1;
    if (scrollPosition >= fadeStart && scrollPosition <= fadeEnd) {
        opacity = 1 - (scrollPosition - fadeStart) / (fadeEnd - fadeStart);
    } else if (scrollPosition > fadeEnd) {
        opacity = 0;
    }

    if (heroImage) {
        heroImage.style.transform = `translateY(${parallaxOffset}px)`;
        heroImage.style.opacity = opacity;
    }
    if (heroVideo) {
        heroVideo.style.transform = `translateY(${parallaxOffset}px)`;
        heroVideo.style.opacity = opacity;
    }
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

    // Skip if album-editorial.js will handle this page
    if (galleryGrid.hasAttribute('data-title')) return;

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

// ============================================
// Particle Effects: Petals (light) + Snow (dark)
// ============================================
(function () {
    const canvas = document.getElementById('petalCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const PETAL_COUNT = 175;
    const SNOW_COUNT = 150;
    let petals = [];
    let snowflakes = [];

    const petalColors = [
        'rgba(255, 183, 197, 0.7)',
        'rgba(255, 160, 180, 0.6)',
        'rgba(255, 200, 210, 0.65)',
        'rgba(248, 170, 190, 0.55)',
        'rgba(255, 220, 230, 0.5)',
    ];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ---- Petals ----
    function createPetal() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 1.2 + 0.4,
            speedX: Math.random() * 0.8 - 0.2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.01,
            color: petalColors[Math.floor(Math.random() * petalColors.length)],
            opacity: Math.random() * 0.4 + 0.3,
        };
    }

    function drawPetal(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size * 0.4, -p.size * 0.6, p.size, -p.size * 0.4, p.size * 0.5, p.size * 0.2);
        ctx.bezierCurveTo(p.size * 0.2, p.size * 0.6, -p.size * 0.2, p.size * 0.4, 0, 0);
        ctx.fill();
        ctx.restore();
    }

    function updatePetals() {
        petals.forEach(p => {
            p.wobble += p.wobbleSpeed;
            p.x += p.speedX + Math.sin(p.wobble) * 0.5;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;
            if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
            if (p.x > canvas.width + 20) p.x = -20;
            if (p.x < -20) p.x = canvas.width + 20;
        });
    }

    // ---- Snowflakes ----
    function createSnowflake() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            radius: Math.random() * 2.5 + 0.8,
            speedY: Math.random() * 0.8 + 0.2,
            speedX: Math.random() * 0.4 - 0.2,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.015 + 0.005,
            opacity: Math.random() * 0.5 + 0.3,
        };
    }

    function drawSnowflake(s) {
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function updateSnow() {
        snowflakes.forEach(s => {
            s.wobble += s.wobbleSpeed;
            s.x += s.speedX + Math.sin(s.wobble) * 0.3;
            s.y += s.speedY;
            if (s.y > canvas.height + 10) { s.y = -10; s.x = Math.random() * canvas.width; }
            if (s.x > canvas.width + 10) s.x = -10;
            if (s.x < -10) s.x = canvas.width + 10;
        });
    }

    // ---- Animation loop ----
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDark = document.body.classList.contains('dark-theme');

        if (isDark) {
            updateSnow();
            snowflakes.forEach(drawSnowflake);
        } else {
            updatePetals();
            petals.forEach(drawPetal);
        }
        requestAnimationFrame(animate);
    }

    function init() {
        resize();
        petals = [];
        snowflakes = [];
        for (let i = 0; i < PETAL_COUNT; i++) {
            const p = createPetal();
            p.y = Math.random() * canvas.height;
            petals.push(p);
        }
        for (let i = 0; i < SNOW_COUNT; i++) {
            const s = createSnowflake();
            s.y = Math.random() * canvas.height;
            snowflakes.push(s);
        }
        animate();
    }

    window.addEventListener('resize', resize);
    init();
})();

// ============================================
// Neko Cat - chases mouse (light theme only)
// Uses 4 sprite images with CSS animations
// sit: resting, idle: facing front, love: near mouse, run: chasing
// ============================================
(function () {
    // Detect path prefix (for album pages in /albums/)
    const scripts = document.querySelectorAll('script[src*="script.js"]');
    const scriptSrc = scripts.length ? scripts[0].getAttribute('src') : '';
    const prefix = scriptSrc.replace('assets/js/script.js', '').replace('../assets/js/script.js', '../');

    const v = '?v=5';
    const lightPaths = {
        idle: prefix + 'assets/images/cat-idle.png' + v,
        love: prefix + 'assets/images/cat-love.png' + v,
        run: prefix + 'assets/images/cat-run.png' + v,
        runRight: prefix + 'assets/images/cat-run-right.png' + v,
    };
    const darkPaths = {
        idle: prefix + 'assets/images/cat-dark-idle.png' + v,
        love: prefix + 'assets/images/cat-dark-love.png' + v,
        run: prefix + 'assets/images/cat-dark-run.png' + v,
        runRight: prefix + 'assets/images/cat-dark-run-right.png' + v,
    };

    // Preload all
    [lightPaths, darkPaths].forEach(paths => {
        Object.values(paths).forEach(src => { const i = new Image(); i.src = src; });
    });

    function getPaths() {
        return document.body.classList.contains('dark-theme') ? darkPaths : lightPaths;
    }

    const cat = document.createElement('div');
    cat.id = 'neko';
    const catImg = document.createElement('img');
    catImg.src = getPaths().idle;
    catImg.alt = '';
    cat.appendChild(catImg);
    document.body.appendChild(cat);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let catX = mouseX;
    let catY = mouseY;
    let catVX = 0;
    let catVY = 0;
    let idleTime = 0;
    let currentState = '';

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        idleTime = 0;
    });

    let lastTheme = '';

    function setState(newState, flip) {
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        if (currentState !== newState || theme !== lastTheme) {
            currentState = newState;
            lastTheme = theme;
            catImg.src = getPaths()[newState];
            cat.className = 'neko-' + newState;
        }
        if (flip) {
            cat.classList.add('neko-flip');
        } else {
            cat.classList.remove('neko-flip');
        }
    }

    function update() {
        cat.style.display = 'block';

        const dx = mouseX - catX;
        const dy = mouseY - catY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 60) {
            // Chase mouse
            const speed = Math.min(dist * 0.014, 1.75);
            catVX += (dx / dist) * speed * 0.14;
            catVY += (dy / dist) * speed * 0.14;
            idleTime = 0;
            setState(catVX < -0.5 ? 'run' : 'runRight', false);
        } else {
            // Near mouse or stopped
            catVX *= 0.85;
            catVY *= 0.85;
            idleTime++;

            if (idleTime < 80) {
                setState('love', false);
            } else {
                setState('idle', false);
            }
        }

        catVX *= 0.89;
        catVY *= 0.89;
        catX += catVX;
        catY += catVY;

        cat.style.left = (catX - 36) + 'px';
        cat.style.top = (catY + window.scrollY - 36) + 'px';

        requestAnimationFrame(update);
    }

    update();
})();

