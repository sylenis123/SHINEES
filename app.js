document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. CONFIGURACIÓN Y SELECTORES GLOBALES
    // =================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4",
        authDomain: "shinees.firebaseapp.com",
        projectId: "shinees",
        storageBucket: "shinees.appspot.com",
        messagingSenderId: "109623976622",
        appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
        measurementId: "G-Z0HSJ2WDZQ"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const readerView = document.getElementById('vertical-reader');
    const profileView = document.getElementById('profile-view');
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const themeToggleButton = document.getElementById('theme-toggle');
    const navHomeButton = document.getElementById('nav-home');
    const navProfileButton = document.getElementById('nav-profile');
    
    let seriesData = [];
    let currentSerieId = null;
    let currentChapterId = null;

    // =================================================================
    // 2. LÓGICA DE AUTENTICACIÓN Y PERFIL DE USUARIO
    // =================================================================
    const registroModalOverlay = document.getElementById('registro-modal-overlay');
    const registroForm = document.getElementById('registro-form');
    const registroError = document.getElementById('registro-error');
    const mostrarRegistroBtn = document.getElementById('mostrar-registro-btn');
    const cerrarRegistroModalBtn = document.getElementById('cerrar-modal-btn');
    const loginModalOverlay = document.getElementById('login-modal-overlay');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const cerrarLoginModalBtn = document.getElementById('cerrar-login-modal-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const displayNameInput = document.getElementById('display-name-input');
    const logoutBtnProfile = document.getElementById('logout-btn-profile');
    const avatarUploadInput = document.getElementById('avatar-upload-input');

    const headerActions = document.querySelector('.header-actions');
    const botonLogin = document.createElement('button');
    botonLogin.id = 'mostrar-login-btn';
    botonLogin.textContent = 'Iniciar Sesión';
    const divPerfilUsuario = document.createElement('div');
    divPerfilUsuario.id = 'perfil-usuario';
    divPerfilUsuario.classList.add('hidden');
    if (headerActions) {
        headerActions.appendChild(botonLogin);
        headerActions.appendChild(divPerfilUsuario);
    }

    function abrirModal(modalOverlay) { if (modalOverlay) modalOverlay.classList.remove('hidden'); }
    function cerrarModal(modalOverlay, errorElement) {
        if (modalOverlay) modalOverlay.classList.add('hidden');
        if (errorElement) errorElement.textContent = '';
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            mostrarRegistroBtn.classList.add('hidden');
            botonLogin.classList.add('hidden');
            divPerfilUsuario.classList.remove('hidden');
            const nombreUsuario = user.displayName || user.email.split('@')[0];
            divPerfilUsuario.innerHTML = `<span class="nombre-usuario">Hola, ${nombreUsuario}</span><button id="logout-btn">Cerrar Sesión</button>`;
            document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
            document.getElementById('profile-display-name').textContent = nombreUsuario;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-avatar-img').src = user.photoURL || 'https://i.imgur.com/SYJ2s1k.png';
            if (navProfileButton ) navProfileButton.addEventListener('click', (e) => { e.preventDefault(); navigateTo('profile'); });
        } else {
            mostrarRegistroBtn.classList.remove('hidden');
            botonLogin.classList.remove('hidden');
            divPerfilUsuario.classList.add('hidden');
            if (navProfileButton) navProfileButton.addEventListener('click', (e) => { e.preventDefault(); abrirModal(loginModalOverlay); });
        }
    });

    if (mostrarRegistroBtn) mostrarRegistroBtn.addEventListener('click', () => abrirModal(registroModalOverlay));
    if (cerrarRegistroModalBtn) cerrarRegistroModalBtn.addEventListener('click', () => cerrarModal(registroModalOverlay, registroError));
    if (registroModalOverlay) registroModalOverlay.addEventListener('click', (e) => { if (e.target === registroModalOverlay) cerrarModal(registroModalOverlay, registroError); });
    if (botonLogin) botonLogin.addEventListener('click', () => abrirModal(loginModalOverlay));
    if (cerrarLoginModalBtn) cerrarLoginModalBtn.addEventListener('click', () => cerrarModal(loginModalOverlay, loginError));
    if (loginModalOverlay) loginModalOverlay.addEventListener('click', (e) => { if (e.target === loginModalOverlay) cerrarModal(loginModalOverlay, loginError); });

    if (registroForm) {
        registroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('registro-email').value;
            const password = document.getElementById('registro-password').value;
            registroError.textContent = '';
            auth.createUserWithEmailAndPassword(email, password)
                .then(uc => { uc.user.sendEmailVerification(); alert('¡Registro exitoso! Se ha enviado un correo de verificación.'); cerrarModal(registroModalOverlay, registroError); })
                .catch(err => {
                    if (err.code === 'auth/email-already-in-use') registroError.textContent = 'Este correo ya está en uso.';
                    else if (err.code === 'auth/weak-password') registroError.textContent = 'La contraseña es muy débil.';
                    else registroError.textContent = 'Ocurrió un error.';
                });
        });
    }
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').
