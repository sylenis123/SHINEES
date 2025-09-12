document.addEventListener('DOMContentLoaded', () => {

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

    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');
        profileView.classList.add('hidden');
        if (view === 'main') mainView.classList.remove('hidden');
        else if (view === 'detail') detailView.classList.remove('hidden');
        else if (view === 'profile') profileView.classList.remove('hidden');
    }

    function renderAuthUI(user) {
        const headerActions = document.querySelector('.header-actions');
        headerActions.innerHTML = '<button id="theme-toggle">☀️</button>'; // Reset
        
        if (user) {
            const profileBtn = document.createElement('button');
            profileBtn.textContent = `Hola, ${user.displayName || user.email.split('@')[0]}`;
            profileBtn.addEventListener('click', () => navigateTo('profile'));
            headerActions.appendChild(profileBtn);
        } else {
            const registerBtn = document.createElement('button');
            registerBtn.textContent = 'Registrarse';
            registerBtn.addEventListener('click', () => registroModal.classList.remove('hidden'));
            headerActions.appendChild(registerBtn);

            const loginBtn = document.createElement('button');
            loginBtn.textContent = 'Iniciar Sesión';
            loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
            headerActions.appendChild(loginBtn);
        }
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.getElementById('theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    auth.onAuthStateChanged(user => {
        renderAuthUI(user);
        if (user) {
            profileView.innerHTML = `<h2>Mi Perfil</h2><p>Email: ${user.email}</p><button id="logout-btn">Cerrar Sesión</button>`;
            document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
        }
    });

    async function main() {
        try {
            const seriesCollection = await db.collection('series').get();
            const seriesData = seriesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const featuredCarousel = document.getElementById('featured-carousel');
            const popularSeriesGrid = document.getElementById('popular-series');
            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';

            seriesData.forEach(serie => {
                const card = document.createElement('a');
                card.href = '#';
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

    document.getElementById('nav-home').addEventListener('click', () => navigateTo('main'));
    document.getElementById('nav-profile').addEventListener('click', () => {
        if (auth.currentUser) navigateTo('profile');
        else loginModal.classList.remove('hidden');
    });

    loginModal.innerHTML = `<div class="modal-content"><button class="modal-close-button">&times;</button><h2>Iniciar Sesión</h2>...</div>`;
    registroModal.innerHTML = `<div class="modal-content"><button class="modal-close-button">&times;</button><h2>Registrarse</h2>...</div>`;
    
    document.querySelectorAll('.modal-close-button').forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.classList.add('hidden');
            registroModal.classList.add('hidden');
        });
    });

    main();
});
