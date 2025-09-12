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
    const profileView = document.getElementById('profile-view'); // Selector para la vista de perfil
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const themeToggleButton = document.getElementById('theme-toggle');
    const navHomeButton = document.getElementById('nav-home');
    const navProfileButton = document.getElementById('nav-profile'); // Selector para el botón "Yo"
    
    let seriesData = [];

    // =================================================================
    // 2. LÓGICA DE AUTENTICACIÓN Y PERFIL DE USUARIO
    // =================================================================

    // --- Selectores de Autenticación ---
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

    // --- Selectores de Perfil ---
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const displayNameInput = document.getElementById('display-name-input');
    const logoutBtnProfile = document.getElementById('logout-btn-profile');

    // --- Creación dinámica de elementos del header ---
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

    // --- Funciones para controlar los modales ---
    function abrirModal(modalOverlay) { if (modalOverlay) modalOverlay.classList.remove('hidden'); }
    function cerrarModal(modalOverlay, errorElement) {
        if (modalOverlay) modalOverlay.classList.add('hidden');
        if (errorElement) errorElement.textContent = '';
    }

    // --- El "Vigilante" de Firebase: Gestiona la sesión ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // ----- USUARIO CON SESIÓN INICIADA -----
            console.log("Usuario conectado:", user.email);
            mostrarRegistroBtn.classList.add('hidden');
            botonLogin.classList.add('hidden');
            divPerfilUsuario.classList.remove('hidden');
            
            const nombreUsuario = user.displayName || user.email.split('@')[0];
            divPerfilUsuario.innerHTML = `<span class="nombre-usuario">Hola, ${nombreUsuario}</span><button id="logout-btn">Cerrar Sesión</button>`;
            document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

            // Rellenamos la información en la página de perfil
            document.getElementById('profile-display-name').textContent = nombreUsuario;
            document.getElementById('profile-email').textContent = user.email;
            if (user.photoURL) document.getElementById('profile-avatar-img').src = user.photoURL;

            // Hacemos que el botón "Yo" navegue a la vista de perfil
            if (navProfileButton) navProfileButton.addEventListener('click', (e) => { e.preventDefault(); navigateTo('profile'); });

        } else {
            // ----- USUARIO INVITADO (SIN SESIÓN) -----
            console.log("Nadie conectado.");
            mostrarRegistroBtn.classList.remove('hidden');
            botonLogin.classList.remove('hidden');
            divPerfilUsuario.classList.add('hidden');

            // Si no hay usuario, el botón "Yo" abre el modal de login
            if (navProfileButton) navProfileButton.addEventListener('click', (e) => { e.preventDefault(); abrirModal(loginModalOverlay); });
        }
    });

    // --- Event Listeners para Modales y Formularios ---
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
                .then(userCredential => {
                    userCredential.user.sendEmailVerification();
                    alert('¡Registro exitoso! Se ha enviado un correo de verificación a tu email.');
                    cerrarModal(registroModalOverlay, registroError);
                })
                .catch(error => {
                    if (error.code === 'auth/email-already-in-use') registroError.textContent = 'Este correo electrónico ya está en uso.';
                    else if (error.code === 'auth/weak-password') registroError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                    else registroError.textContent = 'Ocurrió un error. Inténtalo de nuevo.';
                });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginError.textContent = '';
            auth.signInWithEmailAndPassword(email, password)
                .then(() => cerrarModal(loginModalOverlay, loginError))
                .catch(() => loginError.textContent = "Email o contraseña incorrectos.");
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            if (!email) { alert("Por favor, introduce tu correo electrónico y luego haz clic en '¿Olvidaste tu contraseña?'."); return; }
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert("¡Correo de recuperación enviado! Revisa tu bandeja de entrada.");
                    cerrarModal(loginModalOverlay, loginError);
                })
                .catch(() => alert("No se pudo enviar el correo. Asegúrate de que la dirección es correcta."));
        });
    }

    // --- Lógica para editar el perfil ---
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const newDisplayName = displayNameInput.value;
            const user = auth.currentUser;
            if (user && newDisplayName) {
                user.updateProfile({ displayName: newDisplayName })
                    .then(() => {
                        alert("¡Nombre de usuario actualizado!");
                        document.getElementById('profile-display-name').textContent = newDisplayName;
                        const nombreUsuarioSpan = document.querySelector('.nombre-usuario');
if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = `Hola, ${newDisplayName}`;
                        displayNameInput.value = '';
                    })
                    .catch(error => alert("Ocurrió un error al guardar los cambios."));
            }
        });
    }

    if (logoutBtnProfile) logoutBtnProfile.addEventListener('click', () => auth.signOut());

    // =================================================================
    // 3. FUNCIONES PRINCIPALES DE LA APLICACIÓN
    // =================================================================

    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');
        readerView.classList.add('hidden');
        profileView.classList.add('hidden');
        if (view === 'main') mainView.classList.remove('hidden');
        else if (view === 'detail') detailView.classList.remove('hidden');
        else if (view === 'reader') readerView.classList.remove('hidden');
        else if (view === 'profile') profileView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    if (navHomeButton) navHomeButton.addEventListener('click', (e) => { e.preventDefault(); navigateTo('main'); });

    function openVerticalReader(chapter) {
        // ... (tu código original)
    }
    function buildDetailPage(serie) {
        // ... (tu código original)
    }
    async function loadContent() {
        // ... (tu código original)
    }
    function showDetailPage(serieId) {
        // ... (tu código original)
    }
    function createSeriesCard(serie, type = 'grid') {
        // ... (tu código original)
    }

    // =================================================================
    // 4. EVENT LISTENERS GENERALES
    // =================================================================

    readerView.querySelector('.reader-close-button').addEventListener('click', () => navigateTo('detail'));
    document.getElementById('ad-modal-close').addEventListener('click', () => document.getElementById('ad-modal').classList.add('hidden'));
    themeToggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggleButton.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggleButton.textContent = '☀️';
        }
    });

    loadContent();
});
