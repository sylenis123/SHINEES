<script>
    // =================================================================
    // 1. CONFIGURACIÓN DE FIREBASE (¡CORREGIDA CON TU KEY!)
    // =================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4",
        authDomain: "shinees.firebaseapp.com",
        projectId: "shinees",
        storageBucket: "shinees.appspot.com",
        messagingSenderId: "109623976622",
        appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
    };
    
    // Inicialización de Firebase (activada)
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // =================================================================
    // LÓGICA DEL NUEVO DISEÑO (YA PRESENTE EN TU HTML)
    // =================================================================
    
    // --- Sistema de temas ---
    let currentTheme = 'dark';
    const themes = ['dark', 'light', 'girl', 'boy'];
    function toggleTheme() {
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        currentTheme = themes[nextIndex];
        document.documentElement.setAttribute('data-theme', currentTheme);
        const themeBtn = document.querySelector('.theme-toggle');
        const icons = { 'dark': '🌙', 'light': '☀️', 'girl': '🌸', 'boy': '⚡' };
        themeBtn.textContent = icons[currentTheme];
        const logo = document.querySelector('.logo-3d');
        logo.style.animation = 'none';
        setTimeout(() => {
            logo.style.animation = 'rotate3d 1s ease-in-out, float 3s ease-in-out infinite';
        }, 10);
    }

    // --- Sistema de notificaciones ---
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 80px; right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#ff6b1a'};
            color: white; padding: 15px 20px; border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 2000;
            animation: slideInRight 0.3s forwards;`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // --- Búsqueda ---
    function performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (query) {
            showNotification(`Buscando: "${query}"...`);
        }
    }

    // --- Carrusel ---
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    function nextSlide() {
        if (slides.length > 0) {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }
    }
    setInterval(nextSlide, 5000);

    // --- Animaciones de Scroll ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.5s forwards';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.anime-card').forEach(card => {
        card.style.opacity = '0'; // Ocultar para animar
        observer.observe(card);
    });

    // =================================================================
    // LÓGICA ADAPTADA DEL SCRIPT ANTIGUO
    // =================================================================

    // --- Renderizado de UI de Autenticación (Adaptado) ---
    function renderAuthUI(user) {
        const userMenu = document.querySelector('.user-menu');
        if (user) {
            // Usuario ha iniciado sesión: muestra su avatar
            userMenu.innerHTML = `
                <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
                <div class="user-avatar" title="${user.email}">${user.email.charAt(0).toUpperCase()}</div>
            `;
        } else {
            // No hay usuario: muestra botón de inicio de sesión
            userMenu.innerHTML = `
                <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
                <button class="watch-btn" id="login-btn-header">Iniciar Sesión</button>
            `;
        }
    }

    // --- Renderizado de Modales (Adaptado para el nuevo CSS) ---
    function renderModal(title, formId, formContent) {
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-overlay';
        modalContainer.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 2000;`;
        modalContainer.innerHTML = `
            <div class="modal-content" style="background: var(--bg-card); padding: 2rem; border-radius: 16px; width: 90%; max-width: 400px; position: relative;">
                <button class="modal-close-button" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--text); font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h2 style="margin-bottom: 1.5rem;">${title}</h2>
                <form id="${formId}">${formContent}</form>
            </div>`;
        document.body.appendChild(modalContainer);
    }

    function renderLoginModal() {
        renderModal('Iniciar Sesión', 'login-form', `
            <div style="margin-bottom: 1rem;"><label style="display: block; margin-bottom: 0.5rem;">Email:</label><input type="email" id="login-email" class="search-input" required /></div>
            <div style="margin-bottom: 1rem;"><label style="display: block; margin-bottom: 0.5rem;">Contraseña:</label><input type="password" id="login-password" class="search-input" required /></div>
            <button type="submit" class="watch-btn" style="width:100%;">Entrar</button>
        `);
    }

    // --- Lógica de estado de autenticación de Firebase ---
    auth.onAuthStateChanged(user => {
        renderAuthUI(user);
        if (user) {
            showNotification(`¡Bienvenido de nuevo, ${user.email}!`, 'success');
        }
    });

    // =================================================================
    // MANEJO DE EVENTOS (ADAPTADO)
    // =================================================================
    document.addEventListener('click', async (e) => {
        // --- Botón de Login en el Header ---
        if (e.target && e.target.id === 'login-btn-header') {
            renderLoginModal();
        }

        // --- Cierre de Modales ---
        if (e.target.classList.contains('modal-close-button') || e.target.classList.contains('modal-overlay')) {
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
        }

        // --- Búsqueda ---
        if (e.target.closest('.search-btn')) {
            performSearch();
        }

        // --- Filtros de Biblioteca ---
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            showNotification(`Filtro cambiado a: ${e.target.textContent}`);
        }
        
        // --- Clic en Tarjeta de Anime ---
        if (e.target.closest('.anime-card')) {
            const title = e.target.closest('.anime-card').querySelector('.anime-title').textContent;
            showNotification(`Abriendo detalles para: ${title}`);
            // Aquí iría la lógica para mostrar la página de detalles
        }
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // --- Manejo de Formularios de Login/Registro ---
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (e.target.id === 'login-form') {
            const email = e.target.querySelector('#login-email').value;
            const password = e.target.querySelector('#login-password').value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                document.querySelector('.modal-overlay').remove();
            } catch (error) {
                showNotification(`Error: ${error.message}`, 'error');
            }
        }
        // Aquí puedes añadir la lógica para el formulario de registro si lo creas
    });

    // =================================================================
    // INICIALIZACIÓN
    // =================================================================
    // Inyectar estilos necesarios para las animaciones JS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
    document.head.appendChild(style);

    // Mensaje de bienvenida inicial
    showNotification('¡Bienvenido a Shinees Platform!', 'info');
</script>
        if (!user) {
            views.profile.innerHTML = `<div class="main-content"><p>Debes iniciar sesión para ver tu perfil.</p></div>`;
            return;
        }
        views.profile.innerHTML = `
            <header class="main-header"><h1>Mi Perfil</h1></header>
            <div class="profile-content">
                <div class="profile-card">
                    <div class="profile-avatar-container">
                        <img id="profile-avatar-img" src="${user.photoURL || 'https://i.imgur.com/SYJ2s1k.png'}" alt="Avatar">
                    </div>
                    <h2>${user.displayName || 'Sin nombre'}</h2>
                    <p>${user.email}</p>
                </div>
                <div class="profile-actions">
                    <button id="logout-btn-profile" class="btn logout-button">Cerrar Sesión</button>
                </div>
            </div>`;
    }

    function renderModal(title, formId, formContent ) {
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close-button">&times;</button>
                    <h2>${title}</h2>
                    <form id="${formId}">${formContent}</form>
                </div>
            </div>`;
    }

    function renderLoginModal() {
        renderModal('Iniciar Sesión', 'login-form', `
            <div class="form-group"><label class="form-label">Email:</label><input type="email" id="login-email" class="form-input" required /></div>
            <div class="form-group"><label class="form-label">Contraseña:</label><input type="password" id="login-password" class="form-input" required /></div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Entrar</button>
        `);
    }

    function renderRegistroModal() {
        renderModal('Crear una cuenta', 'registro-form', `
            <div class="form-group"><label class="form-label">Email:</label><input type="email" id="registro-email" class="form-input" required /></div>
            <div class="form-group"><label class="form-label">Contraseña:</label><input type="password" id="registro-password" class="form-input" required minlength="6" /></div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Confirmar</button>
        `);
    }

    function buildDetailPage(serie) {
        views.detail.innerHTML = `
            <div class="detail-hero" style="background-image: url('${serie.portada}')">
                <div class="detail-info">
                    <div class="detail-info-cover"><img src="${serie.portada}" alt="Portada de ${serie.titulo}"></div>
                    <div>
                        <h1>${serie.titulo}</h1>
                        <p>${serie.tipo} • ${serie.año} • ${serie.estado}</p>
                    </div>
                </div>
            </div>
            <div class="detail-content">
                <button class="btn back-button">‹ Volver</button>
                <p>${serie.descripcion}</p>
                <h2>Capítulos</h2>
                <ul class="chapter-list">
                    ${(serie.capitulos && serie.capitulos.length > 0)
                        ? serie.capitulos.map(cap => `<li><a href="#">Cap. ${cap.numero}: ${cap.titulo_cap || ''}</a></li>`).join('')
                        : '<li>No hay capítulos disponibles.</li>'
                    }
                </ul>
            </div>`;
        navigateTo('detail');
    }

    function renderLibrary() {
        const grid = document.getElementById('library-grid');
        if (!grid) return;

        grid.innerHTML = seriesData.map(serie => `
            <div class="series-card" data-serie-id="${serie.id}">
                <img src="${serie.portada || 'https://via.placeholder.com/300x450?text=No+Cover'}" alt="${serie.titulo}" class="series-poster">
                <div class="series-info">
                    <h3 class="series-title">${serie.titulo}</h3>
                    <p class="series-meta">${serie.tipo} • ${serie.año}</p>
                </div>
            </div>
        ` ).join('');
    }

    // =================================================================
    // 4. LÓGICA DE DATOS Y ESTADO (SIN CAMBIOS)
    // =================================================================
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        const themeToggleBtn = document.getElementById('theme-toggle');
        if(themeToggleBtn) themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    auth.onAuthStateChanged(user => {
        renderAuthUI(user);
        if (user) {
            renderProfileView(user);
            modalContainer.innerHTML = '';
        } else {
            renderProfileView(null);
            navigateTo('main');
        }
    });

    async function main() {
        try {
            const seriesCollection = await db.collection('series').get();
            seriesData = seriesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            console.log(`✅ Cargadas ${seriesData.length} series de Firebase`);

            const featuredCarousel = document.getElementById('featured-carousel');
            const popularSeriesGrid = document.getElementById('series-grid');
            
            if (!featuredCarousel || !popularSeriesGrid) {
                console.error("Error: No se encontraron los contenedores de series.");
                return;
            }

            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';

            seriesData.forEach(serie => {
                const card = document.createElement('a');
                card.href = '#';
                card.dataset.serieId = serie.id;

                if (serie.destacado) {
                    card.className = 'hero-card';
                    card.innerHTML = `<div class="hero-card-bg" style="background-image: url('${serie.portada}')"></div><img src="${serie.portada}" class="hero-card-cover" alt="Portada de ${serie.titulo}">`;
                    featuredCarousel.appendChild(card);
                } else {
                    card.className = 'series-card';
                    card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}" class="series-poster"><div class="series-info"><h3 class="series-title">${serie.titulo}</h3><p class="series-meta">${serie.tipo} • ${serie.año}</p></div>`;
                    popularSeriesGrid.appendChild(card);
                }
            });

            loader.style.display = 'none';
            appContent.style.display = 'block';
            renderAuthUI(auth.currentUser);
        } catch (error) {
            console.error("Error al cargar los datos:", error);
            loader.innerHTML = "<p>Error al cargar el contenido. Revisa la consola y tu API Key de Firebase.</p>";
        }
    }

    // =================================================================
    // 5. DELEGACIÓN DE EVENTOS (¡¡¡SECCIÓN CORREGIDA!!!)
    // =================================================================
    document.body.addEventListener('click', async (e) => {
        // --- Botones del Header ---
        if (e.target.id === 'theme-toggle') toggleTheme();
        if (e.target.id === 'header-profile-btn') navigateTo('profile');
        if (e.target.id === 'header-register-btn') renderRegistroModal();
        if (e.target.id === 'header-login-btn') renderLoginModal();
        if (e.target.id === 'logout-btn-profile') await auth.signOut();

        // --- Navegación Principal (Sidebar y Bottom Nav) ---
        const navItem = e.target.closest('.nav-item, .sidebar-link');
        if (navItem) {
            e.preventDefault();
            const view = navItem.dataset.view;

            if (!view) return; // Si no hay data-view, no hace nada

            // Lógica especial para vistas que requieren autenticación
            if ((view === 'profile' || view === 'favorites' || view === 'history') && !auth.currentUser) {
                renderLoginModal();
                return; 
            }
            
            // Lógica especial para vistas que necesitan renderizar contenido
            if (view === 'library') {
                renderLibrary();
            }
            // Aquí iría la lógica para 'favorites', 'history', etc.
            
            // Navega a la vista correspondiente
            navigateTo(view);
        }

        // --- Clic en Tarjetas de Series (Carrusel, Parrilla, Biblioteca) ---
        const seriesLink = e.target.closest('.hero-card, .series-card');
        if (seriesLink) {
            e.preventDefault();
            const serie = seriesData.find(s => s.id === seriesLink.dataset.serieId);
            if (serie) buildDetailPage(serie);
        }

        // --- Botón de Volver en la Vista de Detalles ---
        if (e.target.closest('.back-button')) {
            navigateTo('main');
        }

        // --- Cierre de Modales ---
        if (e.target.classList.contains('modal-close-button') || e.target.classList.contains('modal-overlay')) {
            modalContainer.innerHTML = '';
        }
    });

    // =================================================================
    // 6. MANEJO DE FORMULARIOS (SIN CAMBIOS)
    // =================================================================
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (e.target.id === 'registro-form') {
            const email = e.target.querySelector('#registro-email').value;
            const password = e.target.querySelector('#registro-password').value;
            try {
                await auth.createUserWithEmailAndPassword(email, password);
            } catch (error) {
                alert(`Error en el registro: ${error.message}`);
            }
        }

        if (e.target.id === 'login-form') {
            const email = e.target.querySelector('#login-email').value;
            const password = e.target.querySelector('#login-password').value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                alert(`Error al iniciar sesión: ${error.message}`);
            }
        }
    });

    // =================================================================
    // 7. EJECUCIÓN INICIAL (SIN CAMBIOS)
    // =================================================================
    main();
});
