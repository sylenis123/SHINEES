document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. INICIALIZACIÓN Y SELECTORES
    // =================================================================
    const firebaseConfig = {
        apiKey: "<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4",
    authDomain: "shinees.firebaseapp.com",
    projectId: "shinees",
    storageBucket: "shinees.firebasestorage.app",
    messagingSenderId: "109623976622",
    appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
    measurementId: "G-Z0HSJ2WDZQ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
", // MEJORA: Reemplaza con tus credenciales reales
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
    
    // MEJORA: Almacenamos las vistas para un acceso más fácil
    const views = {
        main: document.getElementById('main-view'),
        detail: document.getElementById('series-detail-view'),
        profile: document.getElementById('profile-view'),
    };

    let seriesData = [];

    // =================================================================
    // 2. NAVEGACIÓN
    // =================================================================
    function navigateTo(viewName) {
        // Oculta todas las vistas
        Object.values(views).forEach(view => view.classList.add('hidden'));
        
        // Muestra la vista solicitada
        if (views[viewName]) {
            views[viewName].classList.remove('hidden');
        }

        // Actualiza el estado activo de la navegación inferior
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
    }

    // =================================================================
    // 3. RENDERIZADO DE COMPONENTES
    // =================================================================
    function renderAuthUI(user) {
        const headerActions = document.querySelector('.header-actions');
        headerActions.innerHTML = `<button id="theme-toggle" title="Cambiar tema">${document.body.dataset.theme === 'dark' ? '☀️' : '🌙'}</button>`;
        
        if (user) {
            const profileBtn = document.createElement('button');
            profileBtn.id = 'header-profile-btn';
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
        if (!user) {
            views.profile.innerHTML = `<p>Debes iniciar sesión para ver tu perfil.</p>`;
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
                    <button id="logout-btn-profile" class="logout-button">Cerrar Sesión</button>
                </div>
            </div>`;
    }

    // MEJORA: Función genérica para crear modales
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
                    <button class="back-button" title="Volver">‹</button>
                    <div class="detail-info">
                        <div class="detail-info-cover"><img src="${serie.portada}" alt="Portada de ${serie.titulo}"></div>
                        <div class="detail-info-text"><h1>${serie.titulo}</h1></div>
                    </div>
                </header>
                <div class="detail-content">
                    <p>${serie.descripcion}</p>
                    <h2>Capítulos</h2>
                    <ul class="chapter-list">
                        ${(serie.capitulos && serie.capitulos.length > 0)
                            ? serie.capitulos.map(cap => `<li><a href="#">Cap. ${cap.numero}: ${cap.titulo_cap || ''}</a></li>`).join('')
                            : '<li>No hay capítulos disponibles.</li>'
                        }
                    </ul>
                </div>
            </div>`;
        navigateTo('detail');
    }

    // =================================================================
    // 4. LÓGICA DE DATOS Y ESTADO
    // =================================================================
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.getElementById('theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    auth.onAuthStateChanged(user => {
        renderAuthUI(user);
        if (user) {
            renderProfileView(user);
            modalContainer.innerHTML = ''; // Cierra cualquier modal abierto
        } else {
            // Si el usuario cierra sesión, lo llevamos al inicio
            renderProfileView(null);
            navigateTo('main');
        }
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
                card.dataset.serieId = serie.id; // MEJORA: Usamos data-attributes para identificar la serie

                if (serie.destacado) {
                    card.className += ' hero-card';
                    card.innerHTML = `<div class="hero-card-bg" style="background-image: url('${serie.portada}')"></div><img src="${serie.portada}" class="hero-card-cover" alt="Portada de ${serie.titulo}">`;
                    featuredCarousel.appendChild(card);
                } else {
                    card.className += ' series-card';
                    card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}">`;
                    popularSeriesGrid.appendChild(card);
                }
            });

            loader.style.display = 'none';
            appContent.style.display = 'block';
            renderAuthUI(auth.currentUser); // Renderiza la UI de autenticación inicial
        } catch (error) {
            console.error("Error al cargar los datos:", error);
            loader.innerHTML = "<p>Error al cargar el contenido. Inténtalo de nuevo más tarde.</p>";
        }
    }

    // =================================================================
    // 5. DELEGACIÓN DE EVENTOS
    // =================================================================
    document.body.addEventListener('click', async (e) => {
        // --- Botones del Header ---
        if (e.target.id === 'theme-toggle') toggleTheme();
        if (e.target.id === 'header-profile-btn') navigateTo('profile');
        if (e.target.id === 'header-register-btn') renderRegistroModal();
        if (e.target.id === 'header-login-btn') renderLoginModal();
        if (e.target.id === 'logout-btn-profile') await auth.signOut();

        // --- Navegación ---
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            e.preventDefault();
            const view = navItem.dataset.view;
            if (view === 'profile' && !auth.currentUser) {
                renderLoginModal(); // Si no está logueado, pide iniciar sesión
            } else {
                navigateTo(view);
            }
        }

        // --- Tarjetas de Series ---
        const seriesLink = e.target.closest('.series-card-link');
        if (seriesLink) {
            e.preventDefault();
            const serie = seriesData.find(s => s.id === seriesLink.dataset.serieId);
            if (serie) buildDetailPage(serie);
        }

        // --- Botón de Volver ---
        if (e.target.closest('.back-button')) {
            navigateTo('main');
        }

        // --- Cierre de Modales ---
        if (e.target.classList.contains('modal-close-button') || e.target.classList.contains('modal-overlay')) {
            modalContainer.innerHTML = '';
        }
    });

    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // --- Formulario de Registro ---
        if (e.target.id === 'registro-form') {
            const email = e.target.querySelector('#registro-email').value;
            const password = e.target.querySelector('#registro-password').value;
            try {
                await auth.createUserWithEmailAndPassword(email, password);
            } catch (error) {
                alert(`Error en el registro: ${error.message}`);
            }
        }

        // --- Formulario de Login ---
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
