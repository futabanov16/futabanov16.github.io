// ============================================
// Editorial Album Layout Engine
// Auto-arranges photos into magazine-style layouts
// based on actual image orientation
// ============================================

(function () {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.gallery-item img'));
    if (items.length === 0) return;

    const albumTitle = grid.dataset.title || '';
    const albumTagline = grid.dataset.tagline || '';
    const albumDate = grid.dataset.date || '';
    const albumCover = grid.dataset.cover || (items[0] ? items[0].src : '');
    const interstitials = (grid.dataset.interstitials || '').split('|').filter(Boolean);

    const photos = items.map((img, i) => ({
        src: img.src,
        alt: img.alt || `Photo ${i + 1}`,
        seq: String(i + 1).padStart(2, '0'),
        orientation: null, // will be set after load
    }));

    // Detect orientation of all photos, then build layout
    let loaded = 0;
    photos.forEach((p, i) => {
        const img = new Image();
        img.onload = function () {
            p.orientation = (img.naturalWidth >= img.naturalHeight) ? 'landscape' : 'portrait';
            loaded++;
            if (loaded === photos.length) buildLayout();
        };
        img.onerror = function () {
            p.orientation = 'landscape';
            loaded++;
            if (loaded === photos.length) buildLayout();
        };
        img.src = p.src;
    });

    function buildLayout() {
        grid.innerHTML = '';
        grid.className = 'album-editorial';

        // ---- Back to Gallery ----
        const backLink = document.createElement('a');
        backLink.href = '../gallery.html';
        backLink.className = 'album-back-link';
        backLink.innerHTML = '&larr; Back to Gallery';
        grid.appendChild(backLink);

        // ---- Hero ----
        const hero = document.createElement('div');
        hero.className = 'album-hero';
        hero.id = 'albumHero';
        hero.innerHTML = `
            <img src="${albumCover}" alt="${albumTitle}" loading="eager">
            <div class="album-hero-overlay">
                <h1 class="album-hero-title">${albumTitle}</h1>
                ${albumTagline ? `<p class="album-hero-tagline">${albumTagline}</p>` : ''}
                ${albumDate ? `<p class="album-hero-date">${albumDate}</p>` : ''}
            </div>
        `;
        grid.appendChild(hero);

        // Hero scroll fade
        function updateHeroFade() {
            const scrollY = window.scrollY;
            const heroHeight = hero.offsetHeight;
            const fadeEnd = heroHeight * 0.9;
            let opacity = 1;
            if (scrollY > 0 && scrollY <= fadeEnd) {
                opacity = 1 - scrollY / fadeEnd;
            } else if (scrollY > fadeEnd) {
                opacity = 0;
            }
            hero.style.opacity = opacity;
        }
        window.addEventListener('scroll', updateHeroFade);
        updateHeroFade();

        // ---- Skip cover photo ----
        let startIdx = 0;
        if (photos.length > 0 && photos[0].src === albumCover) {
            startIdx = 1;
        }
        const remaining = photos.slice(startIdx);

        // ---- Intelligent layout assignment ----
        // Rules:
        // - Single photo: A (full width) or D (centered small, for contemplation)
        // - 2 landscape photos: B or B-rev (asymmetric duo)
        // - 2 portrait photos: E (vertical pair)
        // - 3 same-orientation photos: C (triple)
        // - Mixed orientations: each gets A or D individually
        // - Never crop: all photos keep original aspect ratio

        let idx = 0;
        let interstitialIdx = 0;
        let groupCount = 0;
        let lastLayout = '';

        function pickSingleLayout() {
            if (lastLayout === 'layout-A') return 'layout-D';
            if (lastLayout === 'layout-D') return 'layout-A';
            return 'layout-A';
        }

        function createGroup(layoutClass, groupPhotos) {
            const group = document.createElement('div');
            group.className = `photo-group ${layoutClass}`;

            groupPhotos.forEach(p => {
                const el = document.createElement('div');
                el.className = 'album-photo';
                el.setAttribute('data-seq', p.seq);
                el.setAttribute('data-index', photos.indexOf(p));
                el.innerHTML = `<img src="${p.src}" alt="${p.alt}" loading="lazy">`;
                group.appendChild(el);
            });

            grid.appendChild(group);
            lastLayout = layoutClass;
            groupCount++;

            // Insert interstitial after every 3 groups
            if (interstitialIdx < interstitials.length && groupCount % 3 === 0) {
                const inter = document.createElement('div');
                inter.className = 'interstitial';
                inter.innerHTML = `<p>${interstitials[interstitialIdx]}</p>`;
                grid.appendChild(inter);
                interstitialIdx++;
            }
        }

        while (idx < remaining.length) {
            const current = remaining[idx];
            const next = remaining[idx + 1];
            const next2 = remaining[idx + 2];
            const left = remaining.length - idx;

            // Try triple (3 same orientation)
            if (left >= 3 && next && next2 &&
                current.orientation === next.orientation &&
                current.orientation === next2.orientation &&
                lastLayout !== 'layout-C') {
                createGroup('layout-C', [current, next, next2]);
                idx += 3;
                continue;
            }

            // Try pair
            if (left >= 2 && next) {
                // Both landscape: asymmetric duo
                if (current.orientation === 'landscape' && next.orientation === 'landscape') {
                    const layout = lastLayout === 'layout-B' ? 'layout-B-rev' : 'layout-B';
                    createGroup(layout, [current, next]);
                    idx += 2;
                    continue;
                }
                // Both portrait: vertical pair
                if (current.orientation === 'portrait' && next.orientation === 'portrait') {
                    createGroup('layout-E', [current, next]);
                    idx += 2;
                    continue;
                }
            }

            // Single photo
            const singleLayout = pickSingleLayout(current);
            createGroup(singleLayout, [current]);
            idx += 1;
        }

        // ---- Album footer ----
        const fin = document.createElement('div');
        fin.className = 'album-fin';
        fin.innerHTML = `
            <p class="album-fin-text">Fin.</p>
            <a href="../gallery.html" class="back-link">&larr; Back to Gallery</a>
        `;
        grid.appendChild(fin);

        // ---- Lightbox ----
        let lightboxEl = null;
        let lightboxImg = null;
        let currentLBIndex = 0;
        const allPhotos = remaining.map(p => p.src);

        function openLB(index) {
            if (!lightboxEl) {
                lightboxEl = document.createElement('div');
                lightboxEl.className = 'album-lightbox';
                lightboxEl.innerHTML = `
                    <div class="album-lightbox-close"></div>
                    <div class="album-lightbox-prev">&#8249;</div>
                    <div class="album-lightbox-next">&#8250;</div>
                    <img src="" alt="">
                `;
                document.body.appendChild(lightboxEl);
                lightboxImg = lightboxEl.querySelector('img');
                lightboxEl.querySelector('.album-lightbox-close').addEventListener('click', closeLB);
                lightboxEl.querySelector('.album-lightbox-prev').addEventListener('click', () => navLB(-1));
                lightboxEl.querySelector('.album-lightbox-next').addEventListener('click', () => navLB(1));
                lightboxEl.addEventListener('click', e => { if (e.target === lightboxEl) closeLB(); });
            }
            currentLBIndex = index;
            lightboxImg.src = allPhotos[index];
            lightboxEl.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLB() {
            if (lightboxEl) {
                lightboxEl.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        function navLB(dir) {
            currentLBIndex = (currentLBIndex + dir + allPhotos.length) % allPhotos.length;
            lightboxImg.src = allPhotos[currentLBIndex];
        }

        document.addEventListener('keydown', e => {
            if (!lightboxEl || !lightboxEl.classList.contains('active')) return;
            if (e.key === 'Escape') closeLB();
            else if (e.key === 'ArrowLeft') navLB(-1);
            else if (e.key === 'ArrowRight') navLB(1);
        });

        grid.querySelectorAll('.album-photo').forEach(el => {
            el.addEventListener('click', () => {
                const globalIdx = parseInt(el.dataset.index);
                const localIdx = globalIdx - startIdx;
                if (localIdx >= 0) openLB(localIdx);
            });
        });

        // ---- Scroll animations ----
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        grid.querySelectorAll('.photo-group, .interstitial').forEach(el => {
            observer.observe(el);
        });
    }
})();
