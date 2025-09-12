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
    const auth = firebase.auth(); // Lo dejamos por si hay usuario logueado

    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const readerView = document.getElementById('vertical-reader');
    const interactionView = document.getElementById('chapter-interaction-section');

    let currentSerieId = null;
    let currentChapterId = null;

    // =================================================================
    // 2. NAVEGACIÓN
    // =================================================================
    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');
        readerView.classList.add('hidden');
        interactionView.classList.add('hidden');
        
        if (view === 'main') mainView.classList.remove('hidden');
        else if (view === 'detail') detailView.classList.remove('hidden');
        else if (view === 'reader') {
            readerView.classList.remove('hidden');
            interactionView.classList.remove('hidden');
        }
    }

    // =================================================================
    // 3. LÓGICA DE RENDERIZADO (PINTAR LA PÁGINA)
    // =================================================================
    function buildDetailPage(serie) {
        detailView.innerHTML = `<div class="series-detail-container"><header class="detail-header" style="background-image: url('${serie.portada}')"><button class="back-button">‹</button></header><div class="detail-content"><h1>${serie.titulo}</h1><p>${serie.descripcion}</p><h2>Capítulos</h2><ul class="chapter-list"></ul></div></div>`;
        const chapterList = detailView.querySelector('.chapter-list');
        
        serie.capitulos.forEach(cap => {
            const listItem = document.createElement('li');
            listItem.className = 'chapter-list-item';
            listItem.innerHTML = `<a href="#">Cap. ${cap.numero}: ${cap.titulo_cap || ''}</a><div class="chapter-stats"><span>❤️ ${cap.likes || 0}</span><span>💬 ${cap.commentsCount || 0}</span></div>`;
            listItem.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                openVerticalReader(serie.id, cap);
            });
            chapterList.appendChild(listItem);
        });

        detailView.querySelector('.back-button').addEventListener('click', () => navigateTo('main'));
    }

    function openVerticalReader(serieId, chapter) {
        currentSerieId = serieId;
        currentChapterId = chapter.id;
        const readerContent = document.getElementById('reader-content');
        readerContent.innerHTML = '';
        
        chapter.tiras.forEach(tira => {
            for (let i = 1; i <= tira.paginas; i++) {
                const imageUrl = `https://raw.githubusercontent.com/sylenis123/SHINEES/main/contenido/${chapter.path}/${parseInt(tira.id ) + 1}_${i.toString().padStart(2, '0')}.${chapter.formato}`;
                const img = document.createElement('img');
                img.src = imageUrl;
                readerContent.appendChild(img);
            }
        });

        displayChapterInteractions(serieId, chapter.id);
        document.querySelector('.bottom-nav').classList.add('hidden');
        navigateTo('reader');
    }

    // =================================================================
    // 4. LÓGICA DE INTERACCIONES (EL CORAZÓN DEL PROBLEMA)
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
            if (snap.empty) { commentsList.innerHTML = '<p>Aún no hay comentarios.</p>'; return; }
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
            t.set(newCommentRef, { texto: commentInput.value.trim(), userId: user.uid, userName: user.displayName || 'Anónimo', userAvatar: user.photoURL, fecha: firebase.firestore.FieldValue.serverTimestamp() });
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
    // 5. CARGA INICIAL Y EVENT LISTENERS
    // =================================================================
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
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    buildDetailPage(serie);
                    navigateTo('detail');
                });

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

    // --- ASIGNACIÓN DE EVENTOS ---
    document.getElementById('add-comment-form').addEventListener('submit', handlePostComment);
    document.getElementById('chapter-reaction-btn').addEventListener('click', handleReaction);
    document.querySelector('.reader-close-button').addEventListener('click', () => {
        navigateTo('main');
        document.querySelector('.bottom-nav').classList.remove('hidden');
        main(); // Vuelve a cargar todo para actualizar los contadores
    });

    // --- INICIO DE LA APP ---
    main();
});
