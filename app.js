document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. INICIALIZACIÓN Y SELECTORES
    // =================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4", authDomain: "shinees.firebaseapp.com", projectId: "shinees",
        storageBucket: "shinees.appspot.com", messagingSenderId: "109623976622", appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const profileView = document.getElementById('profile-view');
    const registroModal = document.getElementById('registro-modal-overlay');
    const loginModal = document.getElementById('login-modal-overlay');

    let seriesData = [];

    // =================================================================
    // 2. NAVEGACIÓN
    // =================================================================
    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');
        profileView.classList.add('hidden');
        if (view === 'main') mainView.classList.remove('hidden');
        else if (view === 'detail') detailView.classList.remove('hidden');
        else if (view === 'profile') profileView.classList.remove('hidden');
    }

    // =================================================================
    // 3. RENDERIZADO (PINTAR LAS VISTAS)
    // =================================================================
    function renderAuthUI(user) {
        const headerActions = document.querySelector('.header-actions');
        headerActions.innerHTML = '<button id="theme-toggle">☀️</button>'; // Limpia y añade el botón de tema
        
        if (user) {
            const profileBtn = document.createElement('button');
            profileBtn.textContent = `Hola, ${user.displayName || user.email.split('@')[0]}`;
            profileBtn.addEventListener('click', () => navigateTo('profile'));
            headerActions.appendChild(profileBtn);
        } else {
            const registerBtn = document.createElement('button');
            registerBtn.textContent = 'Registrarse';
            registerBtn.addEventListener('click', () => renderRegistroModal());
            headerActions.appendChild(registerBtn);

            const loginBtn = document.createElement('button');
            loginBtn.textContent = 'Iniciar Sesión';
            loginBtn.addEventListener('click', () => renderLoginModal());
            headerActions.appendChild(loginBtn);
        }
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    }

    function renderProfileView(user) {
        profileView.innerHTML = `
            <header class="main-header"><h1>Mi Perfil</h1></header>
            <div class="profile-content">
                <div class="profile-card">
                    <div class="profile-avatar-container">
                        <img id="profile-avatar-img" src="${user.photoURL || 'https://i.imgur.com/SYJ2s1k.png'}" alt="Avatar">
                        <label for="avatar-upload-input" class="avatar-edit-button" title="Cambiar avatar">✏️</label>
                        <input type="file" id="avatar-upload-input" accept="image/*" style="display: none;">
                    </div>
                    <h2 id="profile-display-name">${user.displayName || 'Sin nombre'}</h2>
                    <p id="profile-email">${user.email}</p>
                </div>
                <div class="profile-actions"><button id="logout-btn-profile" class="logout-button">Cerrar Sesión</button></div>
            </div>`;
        document.getElementById('logout-btn-profile' ).addEventListener('click', () => auth.signOut());
    }

    function renderLoginModal() {
        loginModal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-button">&times;</button>
                <h2>Iniciar Sesión</h2>
                <form id="login-form">
                    <div><label for="login-email">Email:</label><input type="email" id="login-email" required /></div>
                    <div><label for="login-password">Contraseña:</label><input type="password" id="login-password" required /></div>
                    <button type="submit">Entrar</button>
                </form>
            </div>`;
        loginModal.classList.remove('hidden');
    }

    function renderRegistroModal() {
        registroModal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-button">&times;</button>
                <h2>Crear una cuenta</h2>
                <form id="registro-form">
                    <div><label for="registro-email">Email:</label><input type="email" id="registro-email" required /></div>
                    <div><label for="registro-password">Contraseña:</label><input type="password" id="registro-password" required minlength="6" /></div>
                    <button type="submit">Confirmar</button>
                </form>
            </div>`;
        registroModal.classList.remove('hidden');
    }

    function buildDetailPage(serie) {
        detailView.innerHTML = `
            <div class="series-detail-container">
                <header class="detail-header" style="background-image: url('${serie.portada}')">
                    <button class="back-button">‹</button>
                </header>
                <div class="detail-content">
                    <h1>${serie.titulo}</h1>
                    <p>${serie.descripcion}</p>
                    <h2>Capítulos</h2>
                    <ul class="chapter-list"></ul>
                </div>
            </div>`;
        const chapterList = detailView.querySelector('.chapter-list');
        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="#">Cap. ${cap.numero}: ${cap.titulo_cap || ''}</a>`;
                chapterList.appendChild(listItem);
            });
        }
    }

    // =================================================================
    // 4. LÓGICA DE DATOS Y CARGA INICIAL
    // =================================================================
    auth.onAuthStateChanged(user => {
        renderAuthUI(user);
        if (user) {
            renderProfileView(user);
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
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    buildDetailPage(serie);
                    navigateTo('detail');
                });

                if (serie.destacado) {
                    card.className = 'hero-card';
                    card.innerHTML = `<div class="hero-card-bg" style="background-image: url('${serie.portada}')"></div><img src="${serie.portada}" class="hero-card-cover">`;
                    featuredCarousel.appendChild(card);
                } else {
                    card.className = 'series-card';
                    card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}">`;
                    popularSeriesGrid.appendChild(card);
                }
            });

            loader.style.display = 'none';
            appContent.style.display = 'block';
        } catch (error) {
            console.error("Error al cargar:", error);
        }
    }

    // =================================================================
    // 5. EVENT LISTENERS
    // =================================================================
