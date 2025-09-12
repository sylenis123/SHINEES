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
            const password = document.getElementById('login-password').value;
            loginError.textContent = '';
            auth.signInWithEmailAndPassword(email, password).then(() => cerrarModal(loginModalOverlay, loginError)).catch(() => loginError.textContent = "Email o contraseña incorrectos.");
        });
    }
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            if (!email) { alert("Introduce tu email en el campo de arriba primero."); return; }
            auth.sendPasswordResetEmail(email).then(() => { alert("Correo de recuperación enviado."); cerrarModal(loginModalOverlay, loginError); }).catch(() => alert("Error al enviar el correo."));
        });
    }
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const newDisplayName = displayNameInput.value;
            const user = auth.currentUser;
            if (user && newDisplayName) {
                user.updateProfile({ displayName: newDisplayName }).then(() => {
                    alert("Nombre actualizado.");
                    document.getElementById('profile-display-name').textContent = newDisplayName;
                    const nombreUsuarioSpan = document.querySelector('.nombre-usuario');
                    if (nombreUsuarioSpan) nombreUsuarioSpan.textContent = `Hola, ${newDisplayName}`;
                    displayNameInput.value = '';
                }).catch(() => alert("Error al guardar."));
            }
        });
    }
    if (logoutBtnProfile) logoutBtnProfile.addEventListener('click', () => auth.signOut());
    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const CLOUD_NAME = 'dhmhfplfc'; const UPLOAD_PRESET = 'bjm8b3s4';
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
            const formData = new FormData( );
            formData.append('file', file); formData.append('upload_preset', UPLOAD_PRESET);
            alert("Subiendo imagen...");
            fetch(url, { method: 'POST', body: formData }).then(res => res.json()).then(data => {
                if (data.secure_url) {
                    const user = auth.currentUser;
                    if (user) {
                        user.updateProfile({ photoURL: data.secure_url }).then(() => {
                            alert("Imagen de perfil actualizada.");
                            document.getElementById('profile-avatar-img').src = data.secure_url;
                        }).catch(() => alert("Error al guardar la imagen."));
                    }
                }
            }).catch(() => alert("Error al subir la imagen."));
        });
    }

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

    function displayChapterInteractions(serieId, chapterId) {
        const user = auth.currentUser;
        const reactionBtn = document.getElementById('chapter-reaction-btn');
        const reactionCount = document.getElementById('chapter-reaction-count');
        const commentsList = document.getElementById('comments-list');
        if (!reactionBtn || !commentsList) return;
        const chapterRef = db.collection('series').doc(serieId).collection('capitulos').doc(chapterId);
        chapterRef.get().then(doc => {
            const likes = (doc.data() && doc.data().likes) || 0;
            reactionCount.textContent = likes;
        });
        if (user) {
            chapterRef.collection('reacciones').doc(user.uid).get().then(doc => {
                if (doc.exists) reactionBtn.classList.add('liked');
                else reactionBtn.classList.remove('liked');
            });
        }
        commentsList.innerHTML = '';
        chapterRef.collection('comentarios').orderBy('fecha', 'desc').get().then(querySnapshot => {
            if (querySnapshot.empty) { commentsList.innerHTML = '<p>Aún no hay comentarios. ¡Sé el primero!</p>'; return; }
            querySnapshot.forEach(doc => {
                const commentData = doc.data();
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                const avatar = commentData.userAvatar || 'https://i.imgur.com/SYJ2s1k.png';
                const author = commentData.userName || 'Anónimo';
                commentElement.innerHTML = `<img src="${avatar}" alt="Avatar" class="comment-avatar"><div class="comment-body"><p class="comment-author">${author}</p><p class="comment-text">${commentData.texto}</p></div>`;
                commentsList.appendChild(commentElement );
            });
        });
    }

    function handlePostComment(e) {
        e.preventDefault();
        const user = auth.currentUser;
        const commentInput = document.getElementById('comment-input');
        const commentText = commentInput.value.trim();
        if (!user) { alert("Debes iniciar sesión para comentar."); abrirModal(loginModalOverlay); return; }
        if (!commentText || !currentSerieId || !currentChapterId) return;
        
        const chapterRef = db.collection('series').doc(currentSerieId).collection('capitulos').doc(currentChapterId);
        
        // **CORRECCIÓN:** Usar una transacción para asegurar la consistencia
        db.runTransaction(async (transaction) => {
            const chapterDoc = await transaction.get(chapterRef);
            const commentsCount = (chapterDoc.data() && chapterDoc.data().commentsCount) || 0;
            
            // 1. Añadir el nuevo comentario
            const newCommentRef = chapterRef.collection('comentarios').doc();
            transaction.set(newCommentRef, {
                texto: commentText,
                userId: user.uid,
                userName: user.displayName || user.email.split('@')[0],
                userAvatar: user.photoURL,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 2. Actualizar el contador de comentarios en el capítulo
            transaction.update(chapterRef, { commentsCount: commentsCount + 1 });
        }).then(() => {
            commentInput.value = '';
            displayChapterInteractions(currentSerieId, currentChapterId); // Refrescar la vista
        }).catch(err => {
            console.error("Error al publicar comentario: ", err);
            alert("Hubo un error al publicar tu comentario.");
        });
    }

    function handleReaction() {
        const user = auth.currentUser;
        if (!user) { alert("Debes iniciar sesión para reaccionar."); abrirModal(loginModalOverlay); return; }
        
