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
            console.log("Usuario conectado:", user.email);
            mostrarRegistroBtn.classList.add('hidden');
            botonLogin.classList.add('hidden');
            divPerfilUsuario.classList.remove('hidden');
            
            const nombreUsuario = user.displayName || user.email.split('@')[0];
            divPerfilUsuario.innerHTML = `<span class="nombre-usuario">Hola, ${nombreUsuario}</span><button id="logout-btn">Cerrar Sesión</button>`;
            document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

            document.getElementById('profile-display-name').textContent = nombreUsuario;
            document.getElementById('profile-email').textContent = user.email;
            if (user.photoURL) document.getElementById('profile-avatar-img').src = user.photoURL;

            if (navProfileButton) navProfileButton.addEventListener('click', (e) => { e.preventDefault(); navigateTo('profile'); });

        } else {
            console.log("Nadie conectado.");
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

    // ESTAS FUNCIONES ESTABAN MAL UBICADAS, AHORA ESTÁN EN EL LUGAR CORRECTO
    function openVerticalReader(chapter) {
        const readerContent = document.getElementById('reader-content');
        const bottomNav = document.querySelector('.bottom-nav');
        readerContent.innerHTML = '';
        
        if (chapter && chapter.tiras && chapter.tiras.length > 0) {
            const formatoGeneral = chapter.formato; 
            chapter.tiras.forEach(tira => {
                const tiraNumero = parseInt(tira.id) + 1;
                for (let i = 1; i <= tira.paginas; i++) {
                    const pageNumber = i.toString().padStart(2, '0');
                    const imageUrl = `https://raw.githubusercontent.com/sylenis123/SHINEES/main/contenido/${chapter.path}/${tiraNumero}_${pageNumber}.${formatoGeneral}`;
                    const img = document.createElement('img' );
                    img.src = imageUrl;
                    img.className = 'reader-page-image';
                    readerContent.appendChild(img);
                }
            });
        } else {
            readerContent.innerHTML = '<p style="color:white; text-align:center; margin-top: 50px;">Este capítulo no tiene páginas.</p>';
        }

        const adButton = document.createElement('button');
        adButton.className = 'ad-trigger-button';
        adButton.textContent = 'Ver anuncio para apoyar al creador';
        adButton.onclick = () => {
            const adModal = document.getElementById('ad-modal');
            if (adModal) adModal.classList.remove('hidden');
        };
        readerContent.appendChild(adButton);

        bottomNav.classList.add('hidden');
        navigateTo('reader');
    }

    function buildDetailPage(serie) {
        detailView.innerHTML = `<div class="series-detail-container"><header class="detail-header" style="background-image: url('${serie.portada}')"><button class="back-button">‹</button><div class="detail-info"><div class="detail-info-cover"><img src="${serie.portada}" alt="${serie.titulo}"></div><div class="detail-info-text"><h1>${serie.titulo}</h1><p>${serie.categoria || ''}</p></div></div></header><div class="detail-content"><p class="detail-description">${serie.descripcion}</p><h2>Capítulos</h2><ul class="chapter-list" id="detail-chapter-list"></ul></div></div>`;
        const chapterList = detailView.querySelector('#detail-chapter-list');
        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                
                const chapterLabel = cap.numero === 0 ? 'Prólogo' : `Capítulo ${cap.numero}`;
                link.textContent = `${chapterLabel}: ${cap.titulo_cap || ''}`;
                
                link.addEventListener('click', (e) => { e.preventDefault(); openVerticalReader(cap); });
                listItem.appendChild(link);
                chapterList.appendChild(listItem);
            });
        } else {
            chapterList.innerHTML = '<li><p>Aún no hay capítulos disponibles.</p></li>';
        }
        detailView.querySelector('.back-button').addEventListener('click', () => navigateTo('main'));
    }

    async function loadContent() {
        try {
            const seriesCollection = await db.collection('series').get();
            seriesData = seriesCollection.docs.map(doc => doc.data());
            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';
            seriesData.forEach(serie => {
                const cardType = serie.destacado ? 'hero' : 'grid';
                const card = createSeriesCard(serie, cardType);
                if (serie.destacado) {
                    featuredCarousel.appendChild(card);
                } else {
                    popularSeriesGrid.appendChild(card);
                }
            });
            loader.style.display = 'none';
            appContent.style.display = 'block';
        } catch (error) {
            console.error("Error al cargar datos desde Firestore:", error);
            loader.innerHTML = '<p>Error al conectar con la base de datos.</p>';
        }
    }

    function showDetailPage(serieId) {
        const serie = seriesData.find(s => s.id === serieId);
        if (!serie) return;
        buildDetailPage(serie);
        navigateTo('detail');
    }

    function createSeriesCard(serie, type = 'grid') {
        const card = document.createElement('a');
        card.href = '#';
        card.addEventListener('click', (e) => { e.preventDefault(); showDetailPage(serie.id); });
        if (type === 'hero') {
            card.className = 'hero-card';
            card.innerHTML = `<div class="hero-card-bg" style="background-image: url('${serie.portada}')"></div><img src="${serie.portada}" class="hero-card-cover" alt="${serie.titulo}"><div class="hero-card-info"><h3>${serie.titulo}</h3><p>${serie.categoria || ''}</p></div>`;
        } else {
            card.className = 'series-card';
            card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}"><div class="series-card-info"><h3>${serie.titulo}</h3></div>`;
        }
        return card;
    }

    // =================================================================
    // 4. EVENT LISTENERS GENERALES
    // =================================================================

    if (navHomeButton) navHomeButton.addEventListener('click', (e) => { e.preventDefault(); navigateTo('main'); });
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

    // Carga inicial del contenido
    loadContent();
});
