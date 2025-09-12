document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. CONFIGURACIÓN Y SELECTORES GLOBALES
    // =================================================================
    const firebaseConfig = { /* Tu config */ };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    // ... (Todos tus selectores del DOM)
    let seriesData = [];
    let currentSerieId = null;
    let currentChapterId = null;

    // =================================================================
    // 2. LÓGICA DE AUTENTICACIÓN Y PERFIL DE USUARIO
    // =================================================================
    // ... (Toda tu lógica de autenticación y perfil se queda exactamente igual)

    // =================================================================
    // 3. FUNCIONES PRINCIPALES DE LA APLICACIÓN
    // =================================================================

    function navigateTo(view) {
        // ... (Sin cambios aquí)
    }

    // --- FUNCIONES PARA COMENTARIOS Y REACCIONES (AHORA POR CAPÍTULO) ---

    function displayChapterInteractions(serieId, chapterId) {
        const user = auth.currentUser;
        const reactionBtn = document.getElementById('chapter-reaction-btn');
        const reactionCount = document.getElementById('chapter-reaction-count');
        const commentsList = document.getElementById('comments-list');

        if (!reactionBtn || !commentsList) return;

        // 1. Cargar Reacciones
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

        // 2. Cargar Comentarios
        commentsList.innerHTML = ''; // Limpiamos la lista para evitar duplicados
        chapterRef.collection('comentarios').orderBy('fecha', 'desc').get().then(querySnapshot => {
            if (querySnapshot.empty) {
                commentsList.innerHTML = '<p>Aún no hay comentarios. ¡Sé el primero!</p>';
                return;
            }
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
        }).then(() => {
            commentInput.value = '';
            displayChapterInteractions(currentSerieId, currentChapterId); // Recargamos todo
        }).catch(err => console.error("Error al publicar: ", err));
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
                return false; // Devolvió el like
            } else {
                transaction.set(reactionRef, { liked: true });
                transaction.update(chapterRef, { likes: likesCount + 1 });
                return true; // Dio like
            }
        }).then((liked) => {
            // Actualización visual instantánea
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

    // --- FUNCIONES PRINCIPALES MODIFICADAS ---

    function openVerticalReader(serieId, chapter) {
        currentSerieId = serieId;
        currentChapterId = chapter.id;

        const readerContent = document.getElementById('reader-content');
        readerContent.innerHTML = '';
        // ... (tu lógica para cargar las imágenes del capítulo se queda igual)

        // Cargar interacciones del capítulo
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
                listItem.appendChild(link);
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

    // ... (El resto de tus funciones: loadContent, createSeriesCard, etc., se quedan igual)

    // =================================================================
    // 4. EVENT LISTENERS GENERALES
    // =================================================================
    // ... (Tus listeners para navHome, readerClose, themeToggle, etc., se quedan igual)

    // NUEVOS LISTENERS PARA LA VISTA DEL LECTOR
    const chapterReactionBtn = document.getElementById('chapter-reaction-btn');
    if (chapterReactionBtn) chapterReactionBtn.addEventListener('click', handleReaction);

    const commentFormInReader = document.getElementById('add-comment-form');
    if (commentFormInReader) commentFormInReader.addEventListener('submit', handlePostComment);

    // Carga inicial del contenido
    loadContent();
});
