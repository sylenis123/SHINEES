document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. INICIALIZACIÓN Y SELECTORES
    // =================================================================
    const firebaseConfig = {
        apiKey: "TU_API_KEY_REAL_VA_AQUI", // ¡¡¡IMPORTANTE!!!
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
    const modalContainer = document.getElementById('modal-container');
    
    // AÑADIDO: La nueva vista de biblioteca
    const views = {
        main: document.getElementById('main-view'),
        detail: document.getElementById('detail-view'),
        profile: document.getElementById('profile-view'),
        library: document.getElementById('library-view') 
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
        document.querySelectorAll('.nav-item, .sidebar-link').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
    }

    // =================================================================
    // 3. RENDERIZADO DE COMPONENTES
    // =================================================================
    function renderAuthUI(user) {
        const headerActions = document.querySelector('.header-actions');
        headerActions.innerHTML = `<button id="theme-toggle">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</button>`;
        
        if (user) {
            const profileBtn = document.createElement('button');
            profileBtn.id = 'header-profile-btn';
            profileBtn.className = 'btn';
            profileBtn.textContent = `Hola, ${user.displayName || user.email.split('@')[0]}`;
            headerActions.appendChild(profileBtn);
        } else {
            headerActions.innerHTML += `
                <button id="header-register-btn" class="btn">Registrarse</button>
                <button id="header-login-btn" class="btn btn-primary">Iniciar Sesión</button>
            `;
        }
    }

    function renderProfileView(user) {
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

    // AÑADIDO: La nueva función para pintar la biblioteca
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
    // 4. LÓGICA DE DATOS Y ESTADO
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
    // 5. DELEGACIÓN DE EVENTOS
    // =================================================================
    document.body.addEventListener('click', async (e) => {
        if (e.target.id === 'theme-toggle') toggleTheme();
        if (e.target.id === 'header-profile-btn') navigateTo('profile');
        if (e.target.id === 'header-register-btn') renderRegistroModal();
        if (e.target.id === 'header-login-btn') renderLoginModal();
        if (e.target.id === 'logout-btn-profile') await auth.signOut();

        const navItem = e.target.closest('.nav-item, .sidebar-link');
        if (navItem) {
            e.preventDefault();
            const view = navItem.dataset.view;
            
            if (view === 'profile' && !auth.currentUser) {
                renderLoginModal();
                return; // Importante: Detiene la ejecución para no navegar
            }
            
            // AÑADIDO: Lógica para renderizar la biblioteca antes de navegar
            if (view === 'library') {
                renderLibrary();
            }
            
            if (view) {
                navigateTo(view);
            }
        }

        const seriesLink = e.target.closest('.hero-card, .series-card');
        if (seriesLink) {
            e.preventDefault();
            const serie = seriesData.find(s => s.id === seriesLink.dataset.serieId);
            if (serie) buildDetailPage(serie);
        }

        if (e.target.closest('.back-button')) navigateTo('main');
        if (e.target.classList.contains('modal-close-button') || e.target.classList.contains('modal-overlay')) {
            modalContainer.innerHTML = '';
        }
    });

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
    // 6. EJECUCIÓN INICIAL
    // =================================================================
    main();
});
