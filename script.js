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
// GESTION DE GALERIE AVANCÉE
// ============================================

let galleryData = null;
let currentCategory = 'tous';
let currentPage = 1;
let photosPerPage = 6;

async function loadGallery() {
    try {
        const response = await fetch('gallery.json');
        galleryData = await response.json();
        photosPerPage = galleryData.photosPerPage || 6;
        
        renderGallery();
        setupFilterButtons();
        updateGalleryInfo();
    } catch (error) {
        console.warn('Galerie non configurée:', error);
        document.getElementById('gallery-grid').innerHTML = 
            '<p class="no-photos">Aucune photo disponible pour le moment.</p>';
    }
}

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    // Filtrer les photos par catégorie
    const filteredPhotos = currentCategory === 'tous' 
        ? galleryData.photos 
        : galleryData.photos.filter(photo => photo.category === currentCategory);
    
    // Pagination
    const startIndex = (currentPage - 1) * photosPerPage;
    const endIndex = startIndex + photosPerPage;
    const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex);
    
    if (paginatedPhotos.length === 0) {
        grid.innerHTML = '<p class="no-photos">Aucune photo dans cette catégorie.</p>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // Créer les éléments de galerie
    paginatedPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item fade-in';
        item.dataset.index = startIndex + index;
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
    renderPagination(filteredPhotos.length);
}

function setupFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Mise à jour de l'état actif
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Changement de catégorie
            currentCategory = btn.dataset.category;
            currentPage = 1;
            
            // Animation de transition
            const grid = document.getElementById('gallery-grid');
            grid.style.opacity = '0';
            
            setTimeout(() => {
                renderGallery();
                grid.style.opacity = '1';
            }, 300);
        });
    });
}

function renderPagination(totalPhotos) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalPhotos / photosPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-buttons">';
    
    // Bouton précédent
    if (currentPage > 1) {
        html += `<button class="page-btn prev" data-page="${currentPage - 1}">← Précédent</button>`;
    }
    
    // Numéros de page
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="page-btn active">${i}</button>`;
        } else {
            html += `<button class="page-btn" data-page="$${i}">$${i}</button>`;
        }
    }
    
    // Bouton suivant
    if (currentPage < totalPages) {
        html += `<button class="page-btn next" data-page="${currentPage + 1}">Suivant →</button>`;
    }
    
    html += '</div>';
    pagination.innerHTML = html;
    
    // Événements de pagination
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                renderGallery();
                // Scroll vers la galerie
                document.getElementById('galerie').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function updateGalleryInfo() {
    const info = document.getElementById('gallery-info');
    const filteredPhotos = currentCategory === 'tous' 
        ? galleryData.photos.length 
        : galleryData.photos.filter(p => p.category === currentCategory).length;
    
    info.textContent = `$${filteredPhotos} photo$${filteredPhotos > 1 ? 's' : ''} affichée${filteredPhotos > 1 ? 's' : ''}`;
}


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
// ENVOI DE FORMULAIRE DE CONTACT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');
    
    // Remplace par tes identifiants EmailJS
    const EMAILJS_PUBLIC_KEY = 'TON_PUBLIC_KEY';
    const EMAILJS_SERVICE_ID = 'TON_SERVICE_ID';
    const EMAILJS_TEMPLATE_ID = 'TON_TEMPLATE_ID';
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Désactiver le bouton pendant l'envoi
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';
            formStatus.textContent = '';
            formStatus.style.color = 'var(--text-secondary)';
            
            try {
                // Récupérer les données du formulaire
                const formData = {
                    nom: document.getElementById('nom').value,
                    email: document.getElementById('email').value,
                    message: document.getElementById('message').value
                };
                
                // Envoyer via EmailJS
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formData, EMAILJS_PUBLIC_KEY);
                
                // Succès
                formStatus.textContent = '✅ Message envoyé avec succès !';
                formStatus.style.color = '#10B981';
                contactForm.reset();
                
            } catch (error) {
                // Erreur
                console.error('Erreur d\'envoi:', error);
                formStatus.textContent = '❌ Erreur lors de l\'envoi. Veuillez réessayer.';
                formStatus.style.color = '#EF4444';
            } finally {
                // Réactiver le bouton
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer';
            }
        });
    }
});
