// ============================================
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Gestion du mode sombre/clair
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    function setTheme(theme) {
        if (theme === 'light') {
            body.classList.add('light-mode');
            themeToggle.innerHTML = '☀️';
            themeToggle.setAttribute('aria-label', 'Passer en mode sombre');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-mode');
            themeToggle.innerHTML = '🌙';
            themeToggle.setAttribute('aria-label', 'Passer en mode clair');
            localStorage.setItem('theme', 'dark');
        }
    }
    
    themeToggle?.addEventListener('click', () => {
        const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });
    
    // Gestion du menu burger mobile
    const burgerMenu = document.querySelector('.burger-menu');
    const navUl = document.querySelector('.modern-nav ul');
    
    burgerMenu?.addEventListener('click', () => {
        burgerMenu.classList.toggle('active');
        navUl?.classList.toggle('active');
        document.body.style.overflow = navUl?.classList.contains('active') ? 'hidden' : '';
    });
    
    const navLinks = document.querySelectorAll('.modern-nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            burgerMenu.classList.remove('active');
            navUl?.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.modern-nav')) {
            burgerMenu?.classList.remove('active');
            navUl?.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Charger la galerie
    loadGallery();
    
    // Charger les diplômes
    loadDiplomas();
    
    // Bouton retour en haut
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }, { passive: true });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Formulaire de contact
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';
            formStatus.textContent = '';
            
            try {
                const formData = {
                    nom: document.getElementById('nom').value,
                    email: document.getElementById('email').value,
                    message: document.getElementById('message').value
                };
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formData, EMAILJS_PUBLIC_KEY);
                formStatus.textContent = '✅ Message envoyé avec succès !';
                formStatus.style.color = '#10B981';
                contactForm.reset();
            } catch (error) {
                console.error('Erreur d\'envoi:', error);
                formStatus.textContent = '❌ Erreur lors de l\'envoi.';
                formStatus.style.color = '#EF4444';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer';
            }
        });
    }
});

// ============================================
// VARIABLES GLOBALES DE GALERIE
// ============================================
let galleryData = null;
let currentCategory = 'tous';
let currentPage = 1;
const photosPerPage = 6;

// ============================================
// CHARGEMENT DE LA GALERIE
// ============================================
async function loadGallery() {
    try {
        const response = await fetch('gallery.json');
        galleryData = await response.json();
        
        setupFilters();
        renderGallery();
        updateGalleryInfo();
    } catch (error) {
        console.warn('Galerie non configurée:', error);
        const grid = document.getElementById('gallery-grid');
        if(grid) {
            grid.innerHTML = '<p class="no-photos">Aucune photo disponible pour le moment.</p>';
        }
    }
}

// ============================================
// GESTION DES FILTRES DE CATÉGORIES
// ============================================
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.dataset.category;
            currentPage = 1;
            renderGallery();
            updateGalleryInfo();
        });
    });
}

// ============================================
// AFFICHAGE DES PHOTOS
// ============================================
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    if (!galleryData || !galleryData.photos || galleryData.photos.length === 0) {
        grid.innerHTML = '<p class="no-photos">Aucune photo disponible.</p>';
        removeLoadMoreButton();
        return;
    }
    
    let filteredPhotos = galleryData.photos;
    if (currentCategory !== 'tous') {
        filteredPhotos = galleryData.photos.filter(photo => photo.category === currentCategory);
    }
    
    if (filteredPhotos.length === 0) {
        grid.innerHTML = '<p class="no-photos">Aucune photo dans cette catégorie.</p>';
        removeLoadMoreButton();
        return;
    }
    
    const startIndex = 0;
    const endIndex = Math.min(currentPage * photosPerPage, filteredPhotos.length);
    const photosToShow = filteredPhotos.slice(startIndex, endIndex);
    
    photosToShow.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item fade-in';
        item.dataset.index = index;
        
        const captionHtml = photo.caption 
            ? '<div class="photo-caption">' + photo.caption + '</div>' 
            : '';
            
        item.innerHTML = 
            '<img src="' + photo.filename + '" ' +
            'alt="' + (photo.caption || photo.filename) + '" ' +
            'loading="lazy" class="gallery-img">' +
            '<div class="overlay" aria-hidden="true"></div>' +
            captionHtml;
        
        grid.appendChild(item);
    });
    
    setupLightbox();
    
    if (endIndex < filteredPhotos.length) {
        renderLoadMoreButton(filteredPhotos.length);
    } else {
        removeLoadMoreButton();
    }
}

// ============================================
// BOUTON "VOIR PLUS" (+)
// ============================================
function renderLoadMoreButton(totalFiltered) {
    removeLoadMoreButton();
    
    const grid = document.getElementById('gallery-grid');
    const container = document.createElement('div');
    container.className = 'load-more-container';
    
    const currentDisplayed = grid.querySelectorAll('.gallery-item').length;
    const remaining = totalFiltered - currentDisplayed;
    
    if (remaining > 0) {
        const btnText = '+';
        const btnCount = 'Voir ' + remaining + ' autre' + (remaining > 1 ? 's' : '');
        
        container.innerHTML = 
            '<button id="load-more-btn" class="load-more-btn">' +
            '<span class="btn-text">' + btnText + '</span>' +
            '<span class="btn-count">' + btnCount + '</span>' +
            '</button>';
        
        grid.parentNode.insertBefore(container, grid.nextSibling);
        
        const loadMoreBtn = document.getElementById('load-more-btn');
        loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.classList.add('loading');
            loadMoreBtn.querySelector('.btn-text').textContent = '...';
            
            setTimeout(() => {
                currentPage++;
                loadMoreBtn.classList.remove('loading');
                renderGallery();
                updateGalleryInfo();
            }, 300);
        });
    }
}

function removeLoadMoreButton() {
    const existingBtn = document.getElementById('load-more-btn');
    if (existingBtn) {
        existingBtn.parentElement.remove();
    }
}

// ============================================
// MISE À JOUR DES INFOS GALERIE
// ============================================
function updateGalleryInfo() {
    let info = document.getElementById('gallery-info');
    if (!info) {
        info = document.createElement('p');
        info.id = 'gallery-info';
        info.className = 'gallery-info';
        const gallerySection = document.getElementById('galerie');
        if(gallerySection) gallerySection.appendChild(info);
    }
    
    if (!galleryData || !galleryData.photos) {
        info.textContent = '';
        return;
    }

    let filteredPhotos = galleryData.photos;
    if (currentCategory !== 'tous') {
        filteredPhotos = galleryData.photos.filter(photo => photo.category === currentCategory);
    }
    
    const totalPhotos = filteredPhotos.length;
    const displayedCount = document.querySelectorAll('.gallery-item').length;
    
    let infoText = displayedCount + ' photo' + (displayedCount > 1 ? 's' : '') + ' affichée' + (displayedCount > 1 ? 's' : '');
    
    if (displayedCount < totalPhotos) {
        infoText += ' sur ' + totalPhotos + ' totale' + (totalPhotos > 1 ? 's' : '');
    } else if (totalPhotos > 0) {
        infoText += ' (' + totalPhotos + ' au total)';
    }
    
    info.textContent = infoText;
}

// ============================================
// CHARGEMENT DES DIPLÔMES
// ============================================
async function loadDiplomas() {
    try {
        const response = await fetch('diplomes.json');
        const data = await response.json();
        const grid = document.getElementById('diplomes-grid');
        if(!grid) return;
        
        grid.innerHTML = '';
        data.diplomas.forEach((filename, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = 
                '<img src="assets/Diplomes/' + filename + '" ' +
                'alt="Diplôme ' + (index + 1) + '" ' +
                'loading="lazy" class="gallery-img">' +
                '<div class="overlay" aria-hidden="true">' +
                '<span class="overlay-text">📜</span>' +
                '</div>';
            grid.appendChild(item);
        });
        
        setupLightbox();
    } catch (error) {
        console.warn('Diplômes non configurés:', error);
    }
}

// ============================================
// LIGHTBOX
// ============================================
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if(img) {
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    closeBtn?.addEventListener('click', () => {
        lightbox.classList.remove('active');
        lightboxImg.src = '';
        document.body.style.overflow = '';
    });
    
    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
            lightboxImg.src = '';
            document.body.style.overflow = '';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox?.classList.contains('active')) {
            lightbox.classList.remove('active');
            lightboxImg.src = '';
            document.body.style.overflow = '';
        }
    });
}

// ============================================
// EMAILJS CONFIGURATION
// ============================================
const EMAILJS_PUBLIC_KEY = 'TON_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'TON_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'TON_TEMPLATE_ID';