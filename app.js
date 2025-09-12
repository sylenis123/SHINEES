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
        chapterRef.collection('comentarios').add({
            texto: commentText, userId: user.uid, userName: user.displayName || user.email.split('@')[0], userAvatar: user.photoURL, fecha: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => { commentInput.value = ''; displayChapterInteractions(currentSerieId, currentChapterId); }).catch(err => console.error("Error al publicar: ", err));
    }

    function handleReaction() {
        const user = auth.currentUser;
        if (!user) { alert("Debes iniciar sesión para reaccionar."); abrirModal(loginModalOverlay); return; }
        if (!currentSerieId || !currentChapterId) return;
        const reactionRef = db.collection('series').doc(currentSerieId).collection('capitulos').doc(currentChapterId).collection('reacciones').doc(user.uid);
        const chapterRef = db.collection('series').doc(currentSerieId).collection('capitulos').doc(currentChapterId);
        db.runTransaction(async (transaction) => {
            const reactionDoc = await transaction.get(reactionRef);
            const chapterDoc = await transaction.get(chapterRef);
            const likesCount = (chapterDoc.data() && chapterDoc.data().likes) || 0;
            if (reactionDoc.exists) {
                transaction.delete(reactionRef);
                transaction.update(chapterRef, { likes: likesCount > 0 ? likesCount - 1 : 0 });
                return false;
            } else {
                transaction.set(reactionRef, { liked: true });
                transaction.update(chapterRef, { likes: likesCount + 1 });
                return true;
            }
        }).then((liked) => {
            const reactionBtn = document.getElementById('chapter-reaction-btn');
            const countSpan = document.getElementById('chapter-reaction-count');
            let currentLikes = parseInt(countSpan.textContent);
            if (liked) {
                reactionBtn.classList.add('liked');
                countSpan.textContent = currentLikes + 1;
            } else {
                reactionBtn.classList.remove('liked');
                countSpan.textContent = currentLikes - 1;
            }
        }).catch(err => console.error("Error en reacción: ", err));
    }

    function openVerticalReader(serieId, chapter) {
        currentSerieId = serieId;
        currentChapterId = chapter.id;
        const readerContent = document.getElementById('reader-content');
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
        displayChapterInteractions(serieId, chapter.id);
        
        // **CORRECCIÓN CLAVE:** Asignar los listeners DESPUÉS de que la vista del lector se ha creado.
        const chapterReactionBtn = document.getElementById('chapter-reaction-btn');
        if (chapterReactionBtn) chapterReactionBtn.addEventListener('click', handleReaction);
        const commentFormInReader = document.getElementById('add-comment-form');
        if (commentFormInReader) commentFormInReader.addEventListener('submit', handlePostComment);

        document.querySelector('.bottom-nav').classList.add('hidden');
        navigateTo('reader');
    }

    function buildDetailPage(serie) {
        const serieId = serie.id;
        detailView.innerHTML = `<div class="series-detail-container"><header class="detail-header" style="background-image: url('${serie.portada}')"><button class="back-button">‹</button><div class="detail-info"><div class="detail-info-cover"><img src="${serie.portada}" alt="${serie.titulo}"></div><div class="detail-info-text"><h1>${serie.titulo}</h1><p>${serie.categoria || ''}</p></div></div></header><div class="detail-content"><p class="detail-description">${serie.descripcion}</p><h2>Capítulos</h2><ul class="chapter-list" id="detail-chapter-list"></ul></div></div>`;
        const chapterList = detailView.querySelector('#detail-chapter-list');
        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const listItem = document.createElement('li');
                listItem.className = 'chapter-list-item';
                
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = `${cap.numero === 0 ? 'Prólogo' : `Cap. ${cap.numero}`}: ${cap.titulo_cap || ''}`;
                link.addEventListener('click', (e) => { e.preventDefault(); openVerticalReader(serieId, cap); });
                
                // **NUEVA MEJORA:** Contenedor para las estadísticas
                const statsContainer = document.createElement('div');
                statsContainer.className = 'chapter-stats';
                statsContainer.innerHTML = `
                    <span><span class="icon">❤️</span> ${cap.likes || 0}</span>
                    <span><span class="icon">💬</span> ${cap.commentsCount || 0}</span>
                `;
                
                listItem.appendChild(link);
                listItem.appendChild(statsContainer); // Añadimos las estadísticas al item
                chapterList.appendChild(listItem);
            });
        } else {
            chapterList.innerHTML = '<li><p>Aún no hay capítulos.</p></li>';
        }
        detailView.querySelector('.back-button').addEventListener('click', () => navigateTo('main'));
    }

    function showDetailPage(serieId) {
        const serie = seriesData.find(s => s.id === serieId);
        if (!serie) return;
        buildDetailPage(serie);
        navigateTo('detail');
    }

    async function loadContent() {
        try {
            const seriesCollection = await db.collection('series').get();
            seriesData = seriesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';
            seriesData.forEach(serie => {
                const cardType = serie.destacado ? 'hero' : 'grid';
                const card = createSeriesCard(serie, cardType);
                if (serie.destacado) featuredCarousel.appendChild(card);
                else popularSeriesGrid.appendChild(card);
            });
            loader.style.display = 'none';
            appContent.style.display = 'block';
        } catch (error) {
            console.error("Error al cargar contenido:", error);
            loader.innerHTML = '<p>Error al conectar con la base de datos.</p>';
        }
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
    
    readerView.querySelector('.reader-close-button').addEventListener('click', () => {
        navigateTo('detail');
        document.querySelector('.bottom-nav').classList.remove('hidden');
    });
    
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
