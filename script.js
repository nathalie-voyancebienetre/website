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
let currentPage = 1;
let photosPerPage = 6;
let visibleCount = 12; // Nombre initial de photos visibles

// ============================================
// CHARGEMENT DE LA GALERIE
// ============================================
async function loadGallery() {
    try {
        const response = await fetch('gallery.json');
        galleryData = await response.json();
        photosPerPage = galleryData.photosPerPage || 6;
        
        renderGallery();
        updateGalleryInfo();
    } catch (error) {
        console.warn('Galerie non configurée:', error);
        document.getElementById('gallery-grid').innerHTML = 
            '<p class="no-photos">Aucune photo disponible pour le moment.</p>';
    }
}

// ============================================
// AFFICHAGE DES PHOTOS
// ============================================
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    // Vérifier si les données existent
    if (!galleryData || !galleryData.photos || galleryData.photos.length === 0) {
        grid.innerHTML = '<p class="no-photos">Aucune photo disponible.</p>';
        return;
    }
    
    // Sélectionner les photos à afficher
    const photosToShow = galleryData.photos.slice(0, visibleCount);
    
    // Créer les éléments de galerie
    photosToShow.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item fade-in';
        item.dataset.index = index;
        item.innerHTML = `
            <img src="assets/${photo.filename}" 
                 alt="${photo.caption || photo.filename}" 
                 loading="lazy" 
                 class="gallery-img">
            <div class="overlay" aria-hidden="true"></div>
            $${photo.caption ? `<div class="photo-caption">$${photo.caption}</div>` : ''}
        `;
        grid.appendChild(item);
    });
    
    setupLightbox();
    renderLoadMoreButton();
    updateGalleryInfo();
}

// ============================================
// BOUTON "CHARGER PLUS"
// ============================================
function renderLoadMoreButton() {
    const grid = document.getElementById('gallery-grid');
    const existingBtn = document.getElementById('load-more-btn');
    if (existingBtn) existingBtn.remove();
    
    // Si toutes les photos sont visibles, masquer le bouton
    if (visibleCount >= galleryData.photos.length) {
        return;
    }
    
    const remaining = galleryData.photos.length - visibleCount;
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'load-more-container';
    btnContainer.innerHTML = `
        <button id="load-more-btn" class="load-more-btn">
            <span class="btn-text">Voir plus de photos</span>
            <span class="btn-count">(${remaining} restantes)</span>
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        </button>
    `;
    
    grid.parentNode.insertBefore(btnContainer, grid.nextSibling);
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    loadMoreBtn.addEventListener('click', () => {
        // Animation de chargement
        loadMoreBtn.classList.add('loading');
        loadMoreBtn.querySelector('.btn-text').textContent = 'Chargement...';
        
        // Petit délai pour simuler le chargement (peut être supprimé)
        setTimeout(() => {
            visibleCount += photosPerPage;
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.querySelector('.btn-text').textContent = 'Voir plus de photos';
            renderGallery();
        }, 300);
    });
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
        gallerySection.appendChild(info);
    }
    
    const totalPhotos = galleryData.photos.length;
    const displayedCount = Math.min(visibleCount, totalPhotos);
    
    let infoText = `$${displayedCount} photo$${displayedCount > 1 ? 's' : ''} affichée${displayedCount > 1 ? 's' : ''}`;
    
    if (displayedCount < totalPhotos) {
        infoText += ` sur $${totalPhotos} totale$${totalPhotos > 1 ? 's' : ''}`;
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
        
        data.diplomas.forEach((filename, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="assets/Diplomes/${filename}" alt="Diplôme ${index + 1}" loading="lazy" class="gallery-img">
                <div class="overlay" aria-hidden="true">
                    <span class="overlay-text">📜</span>
                </div>
            `;
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
            lightboxImg.src = img.src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
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