document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. CONFIGURACIÓN Y SELECTORES GLOBALES
    // =================================================================
    // ... (Sin cambios aquí, tu configuración de Firebase y selectores principales)
    const firebaseConfig = { /* Tu config */ };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    // ... (Todos tus selectores del DOM)
    const addCommentForm = document.getElementById('add-comment-form');
    const commentInput = document.getElementById('comment-input');
    const commentsList = document.getElementById('comments-list');

    // =================================================================
    // 2. LÓGICA DE AUTENTICACIÓN Y PERFIL DE USUARIO
    // =================================================================
    // ... (Sin cambios aquí, toda tu lógica de login, registro, perfil, etc.)

    // --- Event Listener para el formulario de comentarios ---
    if (addCommentForm) {
        addCommentForm.addEventListener('submit', handlePostComment);
    }

    // =================================================================
    // 3. FUNCIONES PRINCIPALES DE LA APLICACIÓN
    // =================================================================

    // --- NUEVAS FUNCIONES PARA COMENTARIOS Y REACCIONES ---

    function displayComments(serieId) {
        const commentsListContainer = document.getElementById('comments-list');
        if (!commentsListContainer) return;
        commentsListContainer.innerHTML = '';
        
        db.collection('series').doc(serieId).collection('comentarios').orderBy('fecha', 'desc').get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    commentsListContainer.innerHTML = '<p>Aún no hay comentarios. ¡Sé el primero!</p>';
                    return;
                }
                querySnapshot.forEach(doc => {
                    const commentData = doc.data();
                    const commentElement = document.createElement('div');
                    commentElement.className = 'comment';
                    const avatar = commentData.userAvatar || 'https://i.imgur.com/SYJ2s1k.png';
                    const author = commentData.userName || 'Usuario Anónimo';
                    commentElement.innerHTML = `
                        <img src="${avatar}" alt="Avatar" class="comment-avatar">
                        <div class="comment-body">
                            <p class="comment-author">${author}</p>
                            <p class="comment-text">${commentData.texto}</p>
                        </div>`;
                    commentsListContainer.appendChild(commentElement );
                });
            });
    }

    function handlePostComment(e) {
        e.preventDefault();
        const user = auth.currentUser;
        const serieId = detailView.dataset.serieId;
        const commentInput = document.getElementById('comment-input');
        const commentText = commentInput.value.trim();

        if (!user) { alert("Debes iniciar sesión para poder comentar."); abrirModal(loginModalOverlay); return; }
        if (!commentText || !serieId) return;

        db.collection('series').doc(serieId).collection('comentarios').add({
            texto: commentText,
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            userAvatar: user.photoURL,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            commentInput.value = '';
            displayComments(serieId);
        }).catch(error => console.error("Error al publicar comentario: ", error));
    }

    function handleReaction(serieId, chapterId) {
        const user = auth.currentUser;
        if (!user) { alert("Debes iniciar sesión para reaccionar."); abrirModal(loginModalOverlay); return; }

        const reactionRef = db.collection('series').doc(serieId).collection('capitulos').doc(chapterId).collection('reacciones').doc(user.uid);
        const chapterRef = db.collection('series').doc(serieId).collection('capitulos').doc(chapterId);

        db.runTransaction(async (transaction) => {
            const reactionDoc = await transaction.get(reactionRef);
            const chapterDoc = await transaction.get(chapterRef);
            const likesCount = chapterDoc.data().likes || 0;

            if (reactionDoc.exists) {
                // El usuario ya ha reaccionado, quitamos el like
                transaction.delete(reactionRef);
                transaction.update(chapterRef, { likes: likesCount - 1 });
            } else {
                // El usuario no ha reaccionado, añadimos el like
                transaction.set(reactionRef, { liked: true });
                transaction.update(chapterRef, { likes: likesCount + 1 });
            }
        }).then(() => {
            console.log("Reacción actualizada!");
            // Actualizamos la UI al instante
            buildDetailPage(seriesData.find(s => s.id === serieId));
        }).catch(error => console.error("Error en la transacción de reacción: ", error));
    }

    // --- FUNCIONES PRINCIPALES MODIFICADAS ---

    function buildDetailPage(serie) {
        const serieId = serie.id;
        detailView.innerHTML = `
            <div class="series-detail-container">
                <header class="detail-header" style="background-image: url('${serie.portada}')">
                    <button class="back-button">‹</button>
                    <div class="detail-info">
                        <div class="detail-info-cover"><img src="${serie.portada}" alt="${serie.titulo}"></div>
                        <div class="detail-info-text"><h1>${serie.titulo}</h1><p>${serie.categoria || ''}</p></div>
                    </div>
                </header>
                <div class="detail-content">
                    <p class="detail-description">${serie.descripcion}</p>
                    <h2>Capítulos</h2>
                    <ul class="chapter-list" id="detail-chapter-list"></ul>
                    <div id="comments-section" class="comments-container">
                        <h2>Comentarios de la Serie</h2>
                        <div id="add-comment-form-container">
                            <form id="add-comment-form">
                                <textarea id="comment-input" placeholder="Escribe tu comentario aquí..." required></textarea>
                                <button type="submit">Publicar</button>
                            </form>
                        </div>
                        <div id="comments-list"></div>
                    </div>
                </div>
            </div>`;
        
        const chapterList = detailView.querySelector('#detail-chapter-list');
        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const chapterId = cap.id; // Asumimos que cada capítulo tiene un ID único
                const likes = cap.likes || 0;
                const listItem = document.createElement('li');
                listItem.className = 'chapter-list-item';

                const link = document.createElement('a');
                link.href = '#';
                const chapterLabel = cap.numero === 0 ? 'Prólogo' : `Capítulo ${cap.numero}`;
                link.textContent = `${chapterLabel}: ${cap.titulo_cap || ''}`;
                link.addEventListener('click', (e) => { e.preventDefault(); openVerticalReader(cap); });

                const reactionContainer = document.createElement('div');
                reactionContainer.className = 'reactions-container';
                const reactionButton = document.createElement('button');
                reactionButton.className = 'reaction-button';
                reactionButton.innerHTML = `<span class="icon">👍</span> <span class="count">${likes}</span>`;
                reactionButton.onclick = () => handleReaction(serieId, chapterId);

                // Verificamos si el usuario actual ya le dio like
                const user = auth.currentUser;
                if (user) {
                    db.collection('series').doc(serieId).collection('capitulos').doc(chapterId).collection('reacciones').doc(user.uid).get().then(doc => {
                        if (doc.exists) {
                            reactionButton.classList.add('liked');
                        }
                    });
                }
                
                reactionContainer.appendChild(reactionButton);
                listItem.appendChild(link);
                listItem.appendChild(reactionContainer);
                chapterList.appendChild(listItem);
            });
        } else {
            chapterList.innerHTML = '<li><p>Aún no hay capítulos disponibles.</p></li>';
        }

        detailView.querySelector('.back-button').addEventListener('click', () => navigateTo('main'));
        detailView.querySelector('#add-comment-form').addEventListener('submit', handlePostComment);
    }

    function showDetailPage(serieId) {
        const serie = seriesData.find(s => s.id === serieId);
        if (!serie) return;
        detailView.dataset.serieId = serieId;
        buildDetailPage(serie);
        displayComments(serieId);
        navigateTo('detail');
    }

    // ... (El resto de tus funciones: navigateTo, loadContent, etc., se quedan igual)
});
