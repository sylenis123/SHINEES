document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // CONFIGURACIÓN Y SELECTORES GLOBALES
    // =================================================================

    // Configuración de Firebase
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
    const auth = firebase.auth(); // Obtenemos el servicio de autenticación

    // Selectores del DOM para las vistas principales
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const readerView = document.getElementById('vertical-reader');
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const themeToggleButton = document.getElementById('theme-toggle');
    
    let seriesData = [];

    // =================================================================
    // LÓGICA DE AUTENTICACIÓN Y MODAL DE REGISTRO (CÓDIGO MODIFICADO)
    // =================================================================

    // Selectores para el modal y el formulario de registro
    const registroModalOverlay = document.getElementById('registro-modal-overlay');
    const registroForm = document.getElementById('registro-form');
    const registroError = document.getElementById('registro-error');
    const mostrarRegistroBtn = document.getElementById('mostrar-registro-btn');
    const cerrarModalBtn = document.getElementById('cerrar-modal-btn');

    // --- Funciones para controlar el modal ---
    function abrirModalRegistro() {
      if (registroModalOverlay) registroModalOverlay.classList.remove('hidden');
    }

    function cerrarModalRegistro() {
      if (registroModalOverlay) registroModalOverlay.classList.add('hidden');
      if (registroError) registroError.textContent = ''; // Limpia cualquier error al cerrar
    }
// =================================================================
// GESTIÓN DE LA SESIÓN DE USUARIO
// =================================================================

const botonRegistro = document.getElementById('mostrar-registro-btn');
const botonLogin = document.createElement('button'); // Creamos un botón de Login
botonLogin.id = 'mostrar-login-btn';
botonLogin.textContent = 'Iniciar Sesión';

const divPerfilUsuario = document.createElement('div'); // Creamos un div para el perfil
divPerfilUsuario.id = 'perfil-usuario';
divPerfilUsuario.classList.add('hidden'); // Oculto por defecto

// Lo insertamos en el header
const headerActions = document.querySelector('.header-actions');
if (headerActions) {
    headerActions.appendChild(botonLogin);
    headerActions.appendChild(divPerfilUsuario);
}

// El "Vigilante" de Firebase
auth.onAuthStateChanged(user => {
    if (user) {
        // ----- EL USUARIO TIENE SESIÓN INICIADA -----
        console.log("Usuario conectado:", user.email);

        // 1. Ocultamos los botones de "Registrarse" e "Iniciar Sesión"
        botonRegistro.classList.add('hidden');
        botonLogin.classList.add('hidden');

        // 2. Mostramos la sección de perfil
        divPerfilUsuario.classList.remove('hidden');
        
        // 3. Creamos el contenido del perfil
        // Si el usuario tiene un nombre guardado, lo usamos. Si no, usamos el email.
        const nombreUsuario = user.displayName || user.email.split('@')[0];
        
        divPerfilUsuario.innerHTML = `
            <span class="nombre-usuario">Hola, ${nombreUsuario}</span>
            <button id="logout-btn">Cerrar Sesión</button>
        `;

        // 4. Añadimos el evento para cerrar sesión
        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.signOut(); // La función mágica para cerrar sesión
        });

        // 5. Personalizamos la barra de navegación inferior
        const navYo = document.querySelector('.bottom-nav a[href="#"] span:last-child');
        if (navYo && navYo.textContent === 'Yo') {
            // Aquí podrías cambiar "Yo" por el avatar del usuario, por ejemplo
        }

    } else {
        // ----- EL USUARIO NO TIENE SESIÓN INICIADA (ES INVITADO) -----
        console.log("Nadie conectado.");

        // 1. Mostramos los botones de "Registrarse" e "Iniciar Sesión"
        botonRegistro.classList.remove('hidden');
        botonLogin.classList.remove('hidden');

        // 2. Ocultamos la sección de perfil
        divPerfilUsuario.classList.add('hidden');
    }
});
    // --- Event Listeners para el modal ---

    // 1. Abrir el modal al hacer clic en "Registrarse"
    if (mostrarRegistroBtn) {
      mostrarRegistroBtn.addEventListener('click', abrirModalRegistro);
    }

    // 2. Cerrar el modal con el botón de la 'X'
    if (cerrarModalBtn) {
      cerrarModalBtn.addEventListener('click', cerrarModalRegistro);
    }

    // 3. Cerrar el modal si se hace clic en el fondo oscuro
    if (registroModalOverlay) {
      registroModalOverlay.addEventListener('click', (event) => {
        if (event.target === registroModalOverlay) { // Solo si se hace clic en el overlay, no en el contenido
          cerrarModalRegistro();
        }
      });
    }

    // 4. Manejar el envío del formulario de registro
    if (registroForm) {
      registroForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('registro-email').value;
        const password = document.getElementById('registro-password').value;
        registroError.textContent = '';

        auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            console.log('¡Usuario registrado!', userCredential.user);
            alert('¡Registro exitoso!');
            cerrarModalRegistro(); // Cierra el modal después del registro exitoso
          })
          .catch((error) => {
            console.error('Error en el registro:', error.message);
            // Traducimos algunos errores comunes para el usuario
            if (error.code === 'auth/email-already-in-use') {
              registroError.textContent = 'Este correo electrónico ya está en uso.';
            } else if (error.code === 'auth/weak-password') {
              registroError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            } else {
              registroError.textContent = 'Ocurrió un error. Inténtalo de nuevo.';
            }
          });
      });
    }

    // =================================================================
    // FUNCIONES PRINCIPALES DE LA APLICACIÓN (TU CÓDIGO ORIGINAL)
    // =================================================================

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
            document.getElementById('ad-modal').classList.remove('hidden');
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

    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');
        readerView.classList.add('hidden');
        if (view === 'main') mainView.classList.remove('hidden');
        else if (view === 'detail') detailView.classList.remove('hidden');
        else if (view === 'reader') readerView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // =================================================================
    // EVENT LISTENERS GENERALES
    // =================================================================

    readerView.querySelector('.reader-close-button').addEventListener('click', () => {
        const bottomNav = document.querySelector('.bottom-nav');
        bottomNav.classList.remove('hidden');
        navigateTo('detail');
    });
    
    document.getElementById('ad-modal-close').addEventListener('click', () => {
        document.getElementById('ad-modal').classList.add('hidden');
    });

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
