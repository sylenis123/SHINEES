document.addEventListener('DOMContentLoaded', () => {

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
    const themeToggleButton = document.getElementById('theme-toggle');
    const navHomeButton = document.getElementById('nav-home');
    const navProfileButton = document.getElementById('nav-profile');
    
    let seriesData = [];
    let currentSerieId = null;
    let currentChapterId = null;

    const registroModalOverlay = document.getElementById('registro-modal-overlay');
    const loginModalOverlay = document.getElementById('login-modal-overlay');
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
        const mostrarRegistroBtn = document.getElementById('mostrar-registro-btn');
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
        } else {
            mostrarRegistroBtn.classList.remove('hidden' );
            botonLogin.classList.remove('hidden');
            divPerfilUsuario.classList.add('hidden');
        }
    });

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

    function displayChapterInteractions(serieId, chapterId) {
        const user = auth.currentUser;
        const reactionBtn = document.getElementById('chapter-reaction-btn');
        const reactionCount = document.getElementById('chapter-reaction-count');
        const commentsList = document.getElementById('comments-list');
        if (!reactionBtn || !commentsList) return;
        const chapterRef = db.collection('series').doc(serieId).collection('capitulos').doc(chapterId);
        chapterRef.get().then(doc => {
            reactionCount.textContent = (doc.data() && doc.data().likes) || 0;
        });
        if (user) {
            chapterRef.collection('reacciones').doc(user.uid).get().then(doc => {
                reactionBtn.classList.toggle('liked', doc.exists);
            });
        } else {
            reactionBtn.classList.remove('liked');
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
        const commentText = commentInput.value.trim();
        if (!user) { alert("Debes iniciar sesión para comentar."); abrirModal(loginModalOverlay); return; }
        if (!commentText || !currentSerieId || !currentChapterId) return;
        const chapterRef = db.collection('series').doc(currentSerieId).collection('capitulos').doc(currentChapterId);
        db.runTransaction(async t => {
            const chapterDoc = await t.get(chapterRef);
            const commentsCount = (chapterDoc.data() && chapterDoc.data().commentsCount) || 0;
            const newCommentRef = chapterRef.collection('comentarios').doc();
            t.set(newCommentRef, { texto: commentText, userId: user.uid, userName: user.displayName || user.email.split('@')[0], userAvatar: user.photoURL, fecha: firebase.firestore.FieldValue.serverTimestamp() });
            t.update(chapterRef, { commentsCount: commentsCount + 1 });
        }).then(() => {
            commentInput.value = '';
            displayChapterInteractions(currentSerieId, currentChapterId);
        }).catch(err => console.error("Error al publicar comentario: ", err));
    }

    function handleReaction() {
        const user = auth.currentUser;
        if (!user) { alert("Debes iniciar sesión para reaccionar."); abrirModal(loginModalOverlay); return; }
        if (!currentSerieId || !currentChapterId) return;
        const chapterRef = db.collection('series').doc(currentSerieId).collection('capitulos').doc(currentChapterId);
        const reactionRef = chapterRef.collection('reacciones').doc(user.uid);
        db.runTransaction(async t => {
            const chapterDoc = await t.get(chapterRef);
            const reactionDoc = await t.get(reactionRef);
            const currentLikes = (chapterDoc.data() && chapterDoc.data().likes) || 0;
            if (reactionDoc.exists) {
                t.delete(reactionRef);
                t.update(chapterRef, { likes: currentLikes - 1 });
                return { liked: false, newCount: currentLikes - 1 };
            } else {
                t.set(reactionRef, { likedAt: firebase.firestore.FieldValue.serverTimestamp() });
                t.update(chapterRef, { likes: currentLikes + 1 });
                return { liked: true, newCount: currentLikes + 1 };
            }
        }).then(({ liked, newCount }) => {
            document.getElementById('chapter-reaction-btn').classList.toggle('liked', liked);
            document.getElementById('chapter-reaction-count').textContent = newCount < 0 ? 0 : newCount;
        }).catch(err => console.error("Error en la transacción de reacción: ", err));
    }

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
        } else {
            readerContent.innerHTML = '<p style="color:white; text-align:center; margin-top: 50px;">Este capítulo no tiene páginas.</p>';
        }
        displayChapterInteractions(serieId, chapter.id);
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
                const statsContainer = document.createElement('div');
                statsContainer.className = 'chapter-stats';
                statsContainer.innerHTML = `<span><span class="icon">❤️</span> ${cap.likes || 0}</span><span><span class="icon">💬</span> ${cap.commentsCount || 0}</span>`;
                listItem.appendChild(link);
                listItem.appendChild(statsContainer);
                chapterList.appendChild(listItem);
            });
        } else {
            chapterList.innerHTML = '<li><p>Aún no hay capítulos.</p></li>';
        }
    }

    async function loadContent() {
        try {
            const seriesCollection
