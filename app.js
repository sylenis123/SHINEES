document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. CONFIGURACIÓN
    // =================================================================
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4",
        authDomain: "shinees.firebaseapp.com",
        projectId: "shinees",
        storageBucket: "shinees.appspot.com",
        messagingSenderId: "109623976622",
        appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
    };
    const GOOGLE_DRIVE_API_KEY = "https://drive.google.com/drive/folders/1q8QgkBUGao1gLr_ploP_u5vmWhEyTx8z?usp=sharing"; // <-- ¡IMPORTANTE!
    const DRIVE_FOLDER_ID = "capitulos"; // <-- ¡IMPORTANTE!

    // Inicialización de servicios
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // Selectores de elementos del nuevo HTML
    const mainContainer = document.getElementById('main-container');

    // =================================================================
    // 2. LÓGICA DE LA INTERFAZ (Notificaciones, Modales, Temas)
    // =================================================================
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `position: fixed; top: 80px; right: 20px; background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#ff6b1a'}; color: white; padding: 15px 20px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 2000; animation: slideInRight 0.3s forwards;`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function renderModal(title, content) {
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-overlay';
        modalContainer.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 2000;`;
        modalContainer.innerHTML = `<div class="modal-content" style="background: var(--bg-card); padding: 2rem; border-radius: 16px; width: 90%; max-width: 400px; position: relative;"><button class="modal-close-button" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--text); font-size: 1.5rem; cursor: pointer;">&times;</button><h2 style="margin-bottom: 1.5rem;">${title}</h2>${content}</div>`;
        document.body.appendChild(modalContainer);
    }

    function renderLoginModal() {
        renderModal('Iniciar Sesión', `<form id="login-form"><div style="margin-bottom: 1rem;"><label style="display: block; margin-bottom: 0.5rem;">Email:</label><input type="email" id="login-email" class="search-input" required /></div><div style="margin-bottom: 1rem;"><label style="display: block; margin-bottom: 0.5rem;">Contraseña:</label><input type="password" id="login-password" class="search-input" required /></div><button type="submit" class="watch-btn" style="width:100%;">Entrar</button></form>`);
    }

    function renderProfileModal(user) {
        renderModal('Mi Perfil', `<div style="text-align: center;"><div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 1rem;">${user.email.charAt(0).toUpperCase()}</div><h3>${user.displayName || user.email}</h3><p style="color: var(--text-secondary);">${user.email}</p><hr style="border-color: var(--border); margin: 1.5rem 0;"><button class="watch-btn" id="logout-btn" style="background: #ef4444; width: 100%;">Cerrar Sesión</button></div>`);
    }
    
    function toggleTheme() {
        const themes = ['dark', 'light', 'girl', 'boy'];
        let currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const currentIndex = themes.indexOf(currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        document.documentElement.setAttribute('data-theme', nextTheme);
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) {
            const icons = { 'dark': '🌙', 'light': '☀️', 'girl': '🌸', 'boy': '⚡' };
            themeBtn.textContent = icons[nextTheme];
        }
    }

    // =================================================================
    // 3. LÓGICA DE GOOGLE DRIVE Y FIREBASE DB
    // =================================================================
    async function findFileInDrive(fileName, folderId) {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and name='${fileName}' and trashed=false&key=${GOOGLE_DRIVE_API_KEY}`;
        const response = await fetch(url );
        if (!response.ok) throw new Error(`Error de red con la API de Drive`);
        const data = await response.json();
        if (!data.files || data.files.length === 0) return null;
        return data.files[0].id;
    }

    async function getDriveFileContent(fileId) {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
        const response = await fetch(url );
        if (!response.ok) throw new Error(`No se pudo descargar el archivo de Drive`);
        return await response.json();
    }

    async function loadCatalogFromFirebase() {
        const seriesSnapshot = await db.collection('series').get();
        if (seriesSnapshot.empty) {
            throw new Error("No se encontró contenido en la base de datos.");
        }
        return seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async function loadSerieFromFirebase(serieId) {
        const doc = await db.collection('series').doc(serieId).get();
        if (!doc.exists) {
            throw new Error("La serie que buscas no existe.");
        }
        return { id: doc.id, ...doc.data() };
    }

    // =================================================================
    // 4. RENDERIZADO DE VISTAS (PÁGINA PRINCIPAL Y DETALLES)
    // =================================================================
    function renderHomePage(seriesData) {
        mainContainer.innerHTML = `
            <div class="hero-carousel"></div>
            <main>
                <section class="content-section">
                    <div class="section-header">
                        <h2 class="section-title">🔥 Tendencias Ahora</h2>
                        <a href="#" class="view-all">Ver todo →</a>
                    </div>
                    <div class="anime-grid" id="trending-grid"></div>
                </section>
            </main>`;
        
        const trendingGrid = document.getElementById('trending-grid');
        const carousel = document.querySelector('.hero-carousel');
        
        seriesData.forEach(serie => {
            trendingGrid.innerHTML += `<a href="?serie=${serie.id}" class="anime-card" data-id="${serie.id}"><img src="${serie.portada}" alt="${serie.titulo}"><div class="anime-info"><div class="anime-title">${serie.titulo}</div><div class="anime-meta">${serie.tipo} • ${serie.año}</div></div></a>`;
            if (serie.destacado) {
                carousel.innerHTML += `<div class="carousel-slide ${carousel.children.length === 0 ? 'active' : ''}"><div class="carousel-content"><h1 class="carousel-title">${serie.titulo}</h1><p class="carousel-description">${(serie.descripcion || '').substring(0, 100)}...</p><a href="?serie=${serie.id}" class="watch-btn">▶ Ver Ahora</a></div><img src="${serie.portada}" class="carousel-image"></div>`;
            }
        });
        document.querySelectorAll('.anime-card').forEach((card, index) => {
            card.style.animation = `fadeInUp 0.5s ${index * 0.05}s forwards`;
        });
    }

    function renderDetailPage(serieData) {
        mainContainer.innerHTML = `<div class="detail-container"><div class="detail-header"><div class="detail-cover"><img src="${serieData.portada}" alt="${serieData.titulo}"></div><div class="detail-info"><div class="detail-meta"><span>${serieData.tipo}</span> • <span>${serieData.estado}</span> • <span>${serieData.año}</span></div><h1>${serieData.titulo}</h1><p>${serieData.descripcion}</p><div class="detail-actions"><button class="watch-btn">▶ Empezar a ver</button><button class="watch-btn" style="background: var(--bg-card); color: var(--text);">+ Añadir a biblioteca</button></div></div></div><div class="detail-body"><h2>Episodios</h2><ul class="chapter-list">${(serieData.episodios || []).map(ep => `<li class="chapter-item"><a href="#">${ep.titulo}</a></li>`).join('')}</ul></div></div>`;
    }

    // =================================================================
    // 5. LÓGICA PRINCIPAL Y ROUTING
    // =================================================================
    async function router() {
        const params = new URLSearchParams(window.location.search);
        const serieId = params.get('serie');

        try {
            if (serieId) {
                showNotification(`Cargando ${serieId}...`, 'info');
                // Carga desde Firebase
                const serieData = await loadSerieFromFirebase(serieId);
                renderDetailPage(serieData);
            } else {
                showNotification('Cargando catálogo...', 'info');
                // Carga desde Firebase
                const catalog = await loadCatalogFromFirebase();
                renderHomePage(catalog);
            }
        } catch (error) {
            console.error(error);
            showNotification(error.message, 'error');
            mainContainer.innerHTML = `<div class="content-section"><h1>Error</h1><p>${error.message} <a href="/">Volver al inicio</a></p></div>`;
        }
    }

    // =================================================================
    // 6. MANEJO DE EVENTOS
    // =================================================================
    auth.onAuthStateChanged(user => {
        const userMenu = document.querySelector('.user-menu');
        if (!userMenu) return;
        if (user) {
            userMenu.innerHTML = `<button class="theme-toggle"></button><div class="user-avatar" id="user-avatar-btn" title="${user.email}">${user.email.charAt(0).toUpperCase()}</div>`;
        } else {
            userMenu.innerHTML = `<button class="theme-toggle"></button><button class="watch-btn" id="login-btn-header">Iniciar Sesión</button>`;
        }
        const themeBtn = userMenu.querySelector('.theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', toggleTheme);
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const icons = { 'dark': '🌙', 'light': '☀️', 'girl': '🌸', 'boy': '⚡' };
            themeBtn.textContent = icons[currentTheme];
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.id === 'login-btn-header') renderLoginModal();
        if (e.target.id === 'user-avatar-btn' && auth.currentUser) renderProfileModal(auth.currentUser);
        if (e.target.id === 'footer-profile-link') auth.currentUser ? renderProfileModal(auth.currentUser) : renderLoginModal();
        if (e.target.id === 'logout-btn' || e.target.id === 'footer-logout-link') {
            e.preventDefault();
            await auth.signOut();
            document.querySelector('.modal-overlay')?.remove();
            showNotification('Has cerrado sesión.', 'info');
        }
        if (e.target.classList.contains('modal-close-button') || e.target.classList.contains('modal-overlay')) {
            document.querySelector('.modal-overlay')?.remove();
        }
        if (e.target.closest('.anime-card')) {
            e.preventDefault();
            const serieId = e.target.closest('.anime-card').dataset.id;
            history.pushState({}, '', `?serie=${serieId}`);
            router();
        }
        if (e.target.closest('.search-btn')) {
            const query = document.getElementById('searchInput').value.trim();
            if (query) showNotification(`Buscando: "${query}"...`);
        }
    });

    document.body.addEventListener('submit', async (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const email = e.target.querySelector('#login-email').value;
            const password = e.target.querySelector('#login-password').value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                showNotification(`Error: ${error.message}`, 'error');
            }
        }
    });
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) showNotification(`Buscando: "${query}"...`);
        }
    });

    window.addEventListener('popstate', router);

    // =================================================================
    // 7. EJECUCIÓN INICIAL
    // =================================================================
    router();
});
