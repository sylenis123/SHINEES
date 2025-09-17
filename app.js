document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. INICIALIZACIÓN Y SELECTORES
    // =================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4", // RECUERDA USAR TU API KEY REAL
        authDomain: "shinees.firebaseapp.com",
        projectId: "shinees",
        storageBucket: "shinees.appspot.com",
        messagingSenderId: "109623976622",
        appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const registroModal = document.getElementById('registro-modal-overlay');
    const loginModal = document.getElementById('login-modal-overlay');

    // Objeto de vistas para una gestión más sencilla
    const views = {
        main: document.getElementById('main-view'),
        detail: document.getElementById('series-detail-view'),
        profile: document.getElementById('profile-view'),
        library: document.getElementById('library-view') // Vista de biblioteca añadida
    };

    let seriesData = [];

    // =================================================================
    // 2. NAVEGACIÓN
    // =================================================================
    function navigateTo(viewName) {
        Object.values(views).forEach(view => view.classList.add('hidden'));
        if (views[viewName]) {
            views[viewName].classList.remove('hidden');
        }
        // Actualiza el estado activo de la navegación
        document.querySelectorAll('.nav-item, .sidebar-link').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
    }

    // =================================================================
    // 3. RENDERIZADO (PINTAR LAS VISTAS)
    // =================================================================
    function renderAuthUI(user) {
        const headerActions = document.querySelector('.header-actions');
        headerActions.innerHTML = '<button id="theme-toggle">☀️</button>';
        
        if (user) {
            const profileBtn = document.createElement('button');
            profileBtn.textContent = `Hola, ${user.displayName || user.email.split('@')[0]}`;
            headerActions.appendChild(profileBtn);
        } else {
            headerActions.innerHTML += `
                <button id="header-register-btn">Registrarse</button>
                <button id="header-login-btn">Iniciar Sesión</button>
            `;
        }
    }

    function renderProfileView(user) {
        if (!views.profile) return;
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
                    <button id="logout-btn-profile" class="logout-button">Cerrar Sesión</button>
                </div>
            </div>`;
    }

    function renderModal(title, formId, formContent ) {
        const modalContainer = document.getElementById(formId === 'login-form' ? 'login-modal-overlay' : 'registro-modal-overlay');
        modalContainer.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-button">&times;</button>
                <h2>${title}</h2>
                <form id="${formId}">${formContent}</form>
            </div>`;
        modalContainer.classList.remove('hidden');
    }

    function renderLoginModal() {
        renderModal('Iniciar Sesión', 'login-form', `
            <div><label for="login-email">Email:</label><input type="email" id="login-email" required /></div>
            <div><label for="login-password">Contraseña:</label><input type="password" id="login-password" required /></div>
            <button type="submit">Entrar</button>
        `);
    }

    function renderRegistroModal() {
        renderModal('Crear una cuenta', 'registro-form', `
            <div><label for="registro-email">Email:</label><input type="email" id="registro-email" required /></div>
            <div><label for="registro-password">Contraseña:</label><input type="password" id="registro-password" required minlength="6" /></div>
            <button type="submit">Confirmar</button>
        `);
    }

    function buildDetailPage(serie) {
        views.detail.innerHTML = `
            <div class="series-detail-container">
                <header class="detail-header" style="background-image: url('${serie.portada}')">
                    <button class="back-button">‹</button>
                </header>
                <div class="detail-content">
                    <h1>${serie.titulo}</h1>
                    <p>${serie.descripcion}</p>
                    <h2>Capítulos</h2>
                    <ul class="chapter-list">${(serie.capitulos && serie.capitulos.length > 0)
                        ? serie.capitulos.map(cap => `<li><a href="#">Cap. ${cap.numero}: ${cap.titulo_cap || ''}</a></li>`).join('')
                        : '<li>No hay capítulos disponibles.</li>'
                    }</ul>
                </div>
            </div>`;
    }

    // FUNCIÓN NUEVA PARA RENDERIZAR LA BIBLIOTECA
    function renderLibrary() {
        const grid = document.getElementById('library-grid');
        if (!grid) return;

        grid.innerHTML = seriesData.map(serie => `
            <div class="series-card" data-serie-id="${serie.id}">
                <img src="${serie.portada || 'https://via.placeholder.com/300x450?text=No+Cover'}" alt="${serie.titulo}" class="series-poster" loading="lazy">
                <div class="series-info">
                    <h3 class="series-title">${serie.titulo}</h3>
                    <p class="series-meta">${serie.tipo} • ${serie.año}</p>
                </div>
            </div>
        ` ).join('');
    }

    // =================================================================
    // 4. LÓGICA DE DATOS Y CARGA INICIAL
    // =================================================================
    auth.onAuthStateChanged(user => {
        renderAuthUI(user);
        if (user) renderProfileView(user);
    });

    async function main() {
        try {
            const seriesCollection = await db.collection('series').get();
            seriesData = seriesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const featuredCarousel = document.getElementById('featured-carousel');
            const popularSeriesGrid = document.getElementById('popular-series');
            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';

            seriesData.forEach(serie => {
                const card = document.createElement('a');
                card.href = '#';
                card.className = 'series-card-link';
                card.dataset.serieId = serie.id;

                if (serie.destacado) {
                    card.className += ' hero-card';
                    card.innerHTML = `<div class="hero-card-bg" style="background-image: url('${serie.portada}')"></div><img src="${serie.portada}" class="hero-card-cover">`;
                    featuredCarousel.appendChild(card);
                } else {
                    card.className += ' series-card';
                    card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}">`;
                    popularSeriesGrid.appendChild(card);
                }
            });

            loader.style.display = 'none';
            appContent.style.display = 'block';
            renderAuthUI(auth.currentUser);
        } catch (error) {
            console.error("Error al cargar:", error);
            loader.innerHTML = "<p>Error al cargar. Revisa la consola.</p>";
        }
    }

    // =================================================================
    // 5. DELEGACIÓN DE EVENTOS
    // =================================================================
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.getElementById('theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    document.body.addEventListener('click', (e) => {
        // --- Botones del Header ---
        if (e.target.id === 'theme-toggle') toggleTheme();
        if (e.target.id === 'header-profile-btn') navigateTo('profile');
        if (e.target.id === 'header-register-btn') renderRegistroModal();
        if (e.target.id === 'header-login-btn') renderLoginModal();
        if (e.target.id === 'logout-btn-profile') auth.signOut();

        // --- Navegación ---
        const navItem = e.target.closest('.nav-item, .sidebar-link');
        if (navItem) {
            e.preventDefault();
            const view = navItem.dataset.view;

            if (view === 'profile' && !auth.currentUser) {
                renderLoginModal();
                return; 
            }
            if (view === 'library') {
                renderLibrary();
            }
            if (view) {
                navigateTo(view);
            }
        }

        // --- Tarjetas de Series ---
        const seriesLink = e.target.closest('.series-card-link, .series-card');
        if (seriesLink) {
            e.preventDefault();
            const serie = seriesData.find(s => s.id === seriesLink.dataset.serieId);
            if (serie) {
                buildDetailPage(serie);
                navigateTo('detail');
            }
        }

        // --- Botón de Volver ---
        if (e.target.closest('.back-button')) {
            navigateTo('main');
        }

        // --- Cierre de Modales ---
        if (e.target.classList.contains('modal-close-button') || e.target.classList.contains('modal-overlay')) {
            e.target.closest('.modal-overlay').classList.add('hidden');
        }
    });

    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (e.target.id === 'registro-form') {
            const email = e.target.querySelector('#registro-email').value;
            const password = e.target.querySelector('#registro-password').value;
            try {
                await auth.createUserWithEmailAndPassword(email, password);
                registroModal.classList.add('hidden');
            } catch (error) {
                alert(`Error en el registro: ${error.message}`);
            }
        }

        if (e.target.id === 'login-form') {
            const email = e.target.querySelector('#login-email').value;
            const password = e.target.querySelector('#login-password').value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                loginModal.classList.add('hidden');
            } catch (error) {
                alert(`Error al iniciar sesión: ${error.message}`);
            }
        }
    });

    // =================================================================
    // 6. EJECUCIÓN INICIAL
    // =================================================================
    main();
});
