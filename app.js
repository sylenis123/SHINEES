document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. CONFIGURACIÓN Y SELECTORES
    // =================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4", authDomain: "shinees.firebaseapp.com", projectId: "shinees",
        storageBucket: "shinees.appspot.com", messagingSenderId: "109623976622", appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const readerView = document.getElementById('vertical-reader');
    const interactionView = document.getElementById('chapter-interaction-section');
    const profileView = document.getElementById('profile-view');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    
    let seriesData = [];
    let currentSerieId = null;
    let currentChapterId = null;

    // =================================================================
    // 2. NAVEGACIÓN PRINCIPAL
    // =================================================================
    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');
        readerView.classList.add('hidden');
        interactionView.classList.add('hidden');
        profileView.classList.add('hidden');
        if (view === 'main') mainView.classList.remove('hidden');
        else if (view === 'detail') detailView.classList.remove('hidden');
        else if (view === 'reader') {
            readerView.classList.remove('hidden');
            interactionView.classList.remove('hidden');
        }
        else if (view === 'profile') profileView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // =================================================================
    // 3. LÓGICA DE AUTENTICACIÓN Y PERFIL
    // =================================================================
    auth.onAuthStateChanged(user => {
        const mostrarRegistroBtn = document.getElementById('mostrar-registro-btn');
        const headerActions = document.querySelector('.header-actions');
        let botonLogin = document.getElementById('mostrar-login-btn');
        let divPerfilUsuario = document.getElementById('perfil-usuario');

        // Limpiamos por si acaso para evitar duplicados
        if (botonLogin) botonLogin.remove();
        if (divPerfilUsuario) divPerfilUsuario.remove();

        if (user) {
            // --- Usuario Conectado ---
            mostrarRegistroBtn.classList.add('hidden');
            
            divPerfilUsuario = document.createElement('div');
            divPerfilUsuario.id = 'perfil-usuario';
            const nombreUsuario = user.displayName || user.email.split('@')[0];
            divPerfilUsuario.innerHTML = `<span class="nombre-usuario">Hola, ${nombreUsuario}</span><button id="logout-btn">Cerrar Sesión</button>`;
            headerActions.appendChild(divPerfilUsuario);
            
            document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
            
            // Actualizamos la info en la página de perfil
            document.getElementById('profile-display-name').textContent = nombreUsuario;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-avatar-img').src = user.photoURL || 'https://i.imgur.com/SYJ2s1k.png';

        } else {
            // --- Usuario Invitado ---
            mostrarRegistroBtn.classList.remove('hidden' );
            
            botonLogin = document.createElement('button');
            botonLogin.id = 'mostrar-login-btn';
            botonLogin.textContent = 'Iniciar Sesión';
            headerActions.appendChild(botonLogin);
        }
    });

    // =================================================================
    // 4. RENDERIZADO DE CONTENIDO (SERIES, CAPÍTULOS, ETC.)
    // =================================================================
    function openVerticalReader(serieId, chapter) {
        currentSerieId = serieId;
        currentChapterId = chapter.id;
        const readerContent = document.getElementById('reader-content');
        readerContent.innerHTML = '';
        if (chapter.tiras && chapter.tiras.length > 0) {
            chapter.tiras.forEach(tira => {
                for (let i = 1; i <= tira.paginas; i++) {
                    const imageUrl = `https://raw.githubusercontent.com/sylenis123/SHINEES/main/contenido/${chapter.path}/${parseInt(tira.id ) + 1}_${i.toString().padStart(2, '0')}.${chapter.formato}`;
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    readerContent.appendChild(img);
                }
            });
        }
        displayChapterInteractions(serieId, chapter.id);
        document.querySelector('.bottom-nav').classList.add('hidden');
        navigateTo('reader');
    }

    function buildDetailPage(serie) {
        const serieId = serie.id;
        detailView.innerHTML = `<div class="series-detail-container"><header class="detail-header" style="background-image: url('${serie.portada}')"><button class="back-button">‹</button><div class="detail-info"><div class="detail-info-cover"><img src="${serie.portada}" alt="${serie.titulo}"></div><div class="detail-info-text"><h1>${serie.titulo}</h1></div></div></header><div class="detail-content"><p class="detail-description">${serie.descripcion}</p><h2>Capítulos</h2><ul class="chapter-list"></ul></div></div>`;
        const chapterList = detailView.querySelector('.chapter-list');
        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const listItem = document.createElement('li');
                listItem.className = 'chapter-list-item';
                listItem.innerHTML = `<a href="#">${cap.numero === 0 ? 'Prólogo' : `Cap. ${cap.numero}`}: ${cap.titulo_cap || ''}</a><div class="chapter-stats"><span>❤️ ${cap.likes || 0}</span><span>💬 ${cap.commentsCount || 0}</span></div>`;
                listItem.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); openVerticalReader(serieId, cap); });
                chapterList.appendChild(listItem);
            });
        }
    }

    async function loadContent() {
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
                card.addEventListener('click', (e) => { e.preventDefault(); buildDetailPage(serie); navigateTo('detail'); });
                if (serie.destacado) {
                    card.className = 'hero-card';
                    card.innerHTML = `<div class="hero-card-bg" style="background-image: url('${serie.portada}')"></div><img src="${serie.portada}" class="hero-card-cover"><div class="hero-card-info"><h3>${serie.titulo}</h3></div>`;
                    featuredCarousel.appendChild(card);
                } else {
                    card.className = 'series-card';
                    card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}"><div class="series-card-info"><h3>${serie.titulo}</h3></div>`;
                    popularSeriesGrid.appendChild(card);
                }
            });
            loader.style.display = 'none';
            appContent.style.display = 'block';
        } catch (error) {
            console.error("Error al cargar contenido:", error);
        }
    }

    // =================================================================
    // 5. LÓGICA DE INTERACCIONES (LIKES Y COMENTARIOS)
    // =================================================================
    function displayChapterInteractions(serieId, chapterId) {
        const user = auth.currentUser;
        const reactionBtn = document.getElementById('chapter-reaction-btn');
        const reactionCount = document.getElementById('chapter-reaction-count');
        const commentsList = document.getElementById('comments-list');
        const chapterRef = db.collection('series').doc(serieId).collection('capitulos').doc(chapterId);
        chapterRef.get().then(doc => {
            reactionCount.textContent = (doc.data() && doc.data().likes) || 0;
        });
        if (user) {
            chapterRef.collection('reacciones').doc(user.uid).get().then(doc => {
                reactionBtn.classList.toggle('liked', doc.exists);
            });
        }
        commentsList.innerHTML = '';
        chapterRef.collection('comentarios').orderBy('fecha', 'desc').get().then(snap => {
            if (snap.empty) { commentsList.innerHTML = '<p>Aún no hay comentarios. ¡Sé el primero!</p>'; return; }
            snap.forEach(doc => {
                const data = doc.data();
                const el = document.createElement('div');
                el.className = 'comment';
                el.innerHTML = `<img src="${data.userAvatar || 'https://i.imgur.com/SYJ2s1k.png'}" class="comment-avatar"><div class="comment-body"><p class="comment-author">${data.userName || 'Anónimo'}</p><p class="comment-text">${data.texto}</p></div>`;
                commentsList.appendChild(el );
            });
        });
    }

    function handlePostComment(e) {
        e.preventDefault();
        const user = auth.currentUser;
        const commentInput = document.getElementById('comment-input');
        if (!user) { alert("Debes iniciar sesión para comentar."); return; }
        if (!commentInput.value.trim()) return;
        const chapterRef = db.collection('series').doc(currentSerieId).collection('capitulos').doc(currentChapterId);
        db.runTransaction(async t => {
            const chapterDoc = await t.get(chapterRef);
            const commentsCount = (chapterDoc.data() && chapterDoc.data().commentsCount) || 0;
            const newCommentRef = chapterRef.collection('comentarios').doc();
            t.set(newCommentRef, { texto: commentInput.value.trim(), userId: user.uid, userName: user.displayName || user.email.split('@')[0], userAvatar: user.photoURL, fecha: firebase.firestore.FieldValue.serverTimestamp() });
            t.update(chapterRef, { commentsCount: commentsCount + 1 });
        }).then(() => {
            commentInput.value = '';
            displayChapterInteractions(currentSerieId, currentChapterId);
        });
    }

    function handleReaction() {
        const user = auth.currentUser;
        if (!user) { alert("Debes iniciar sesión para reaccionar."); return; }
        const chapterRef = db.collection('series').doc(currentSerieId).collection('capitulos').doc(currentChapterId);
        const reactionRef = chapterRef.collection('reacciones').doc(user.uid);
        db.runTransaction(async t => {
            const chapterDoc = await t.get(chapterRef);
            const reactionDoc = await t.get(reactionRef);
            const currentLikes = (chapterDoc.data() && chapterDoc.data().likes) || 0;
            if (reactionDoc.exists) {
                t.delete(reactionRef);
                t.update(chapterRef, { likes: currentLikes - 1 });
            } else {
                t.set(reactionRef, { likedAt: firebase.firestore.FieldValue.serverTimestamp() });
                t.update(chapterRef, { likes: currentLikes + 1 });
            }
        }).then(() => displayChapterInteractions(currentSerieId, currentChapterId));
    }

    // =================================================================
    // 6. EVENT LISTENERS (VIGILANTES DE CLICS Y ACCIONES)
    // =================================================================
    document.getElementById('add-comment-form').addEventListener('submit', handlePostComment);
    document.getElementById('chapter-reaction-btn').addEventListener('click', handleReaction);
    
    document.querySelector('.reader-close-button').addEventListener('click', () => {
        navigateTo('detail');
        document.querySelector('.bottom-nav').classList.remove('hidden');
    });

    document.addEventListener('click', e => {
        if (e.target.matches('.back-button')) navigateTo('main');
        if (e.target.matches('#mostrar-registro-btn')) document.getElementById('registro-modal-overlay').classList.remove('hidden');
        if (e.target.matches('#mostrar-login-btn')) document.getElementById('login-modal-overlay').classList.remove('hidden');
        if (e.target.matches('.modal-close-button')) e.target.closest('.modal-overlay').classList.add('hidden');
        if (e.target.matches('#nav-home')) { e.preventDefault(); navigateTo('main'); }
        if (e.target.matches('#nav-profile')) {
            e.preventDefault();
            if (auth.currentUser) navigateTo('profile');
            else document.getElementById('login-modal-overlay').classList.remove('hidden');
        }
        if (e.target.matches('#logout-btn-profile')) auth.signOut();
    });

    document.getElementById('registro-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('registro-email').value;
        const password = document.getElementById('registro-password').value;
        auth.createUserWithEmailAndPassword(email, password)
            .then(uc => { uc.user.sendEmailVerification(); alert('¡Registro exitoso!'); document.getElementById('registro-modal-overlay').classList.add('hidden'); })
            .catch(err => console.error(err));
    });

    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password).then(() => document.getElementById('login-modal-overlay').classList.add('hidden')).catch(() => alert("Error de login."));
    });

    document.getElementById('avatar-upload-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const CLOUD_NAME = 'dhmhfplfc'; const UPLOAD_PRESET = 'bjm8b3s4';
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        const formData = new FormData( );
        formData.append('file', file); formData.append('upload_preset', UPLOAD_PRESET);
        fetch(url, { method: 'POST', body: formData }).then(res => res.json()).then(data => {
            if (data.secure_url && auth.currentUser) {
                auth.currentUser.updateProfile({ photoURL: data.secure_url }).then(() => {
                    document.getElementById('profile-avatar-img').src = data.secure_url;
                });
            }
        });
    });

    // Carga inicial del contenido
    loadContent();
});
