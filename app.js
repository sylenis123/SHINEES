document.addEventListener('DOMContentLoaded', () => {

    // Configuración de Firebase (esto está bien)
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

    // Selectores del DOM (esto está bien)
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const themeToggleButton = document.getElementById('theme-toggle');
    const readerView = document.getElementById('vertical-reader');
    let seriesData = [];
const auth = firebase.auth(); // Obtenemos el servicio de autenticación

// Selectores para el nuevo formulario
const registroView = document.getElementById('registro-view');
const registroForm = document.getElementById('registro-form');
const registroEmailInput = document.getElementById('registro-email');
const registroPasswordInput = document.getElementById('registro-password');
const registroError = document.getElementById('registro-error');
const mostrarRegistroBtn = document.getElementById('mostrar-registro-btn');

// Evento para mostrar el formulario de registro
mostrarRegistroBtn.addEventListener('click', () => {
  registroView.style.display = 'block'; // Muestra el formulario
  // Aquí podrías ocultar otras vistas si es necesario
});

// Evento para manejar el envío del formulario
registroForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Evita que la página se recargue

  const email = registroEmailInput.value;
  const password = registroPasswordInput.value;
  registroError.textContent = ''; // Limpia errores anteriores

  // Usamos la función de Firebase para crear el usuario
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // ¡Registro exitoso!
      console.log('¡Usuario registrado!', userCredential.user);
      alert('¡Te has registrado con éxito!');
      registroView.style.display = 'none'; // Oculta el formulario de nuevo
    })
    .catch((error) => {
      // Hubo un error
      console.error('Error en el registro:', error.message);
      registroError.textContent = error.message; // Muestra el error al usuario
    });
});
    // =================================================================
    // FUNCIÓN openVerticalReader CORREGIDA
    // =================================================================
    function openVerticalReader(chapter) {
        const readerContent = document.getElementById('reader-content');
        const bottomNav = document.querySelector('.bottom-nav');
        readerContent.innerHTML = '';
        
        if (chapter && chapter.tiras && chapter.tiras.length > 0) {
            // CORRECCIÓN 1: Leemos el formato del objeto principal del capítulo
            const formatoGeneral = chapter.formato; 

            chapter.tiras.forEach(tira => {
                // CORRECCIÓN 2: Convertimos el ID de la tira a número y le sumamos 1
                const tiraNumero = parseInt(tira.id) + 1;

                for (let i = 1; i <= tira.paginas; i++) {
                    const pageNumber = i.toString().padStart(2, '0');
                    // CORRECCIÓN 3: Usamos las variables corregidas para construir la URL
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
            document.getElementById('ad-modal').style.display = 'flex';
        };
        readerContent.appendChild(adButton);

        bottomNav.classList.add('hidden');
        navigateTo('reader');
    }

    // =================================================================
    // FUNCIÓN buildDetailPage CORREGIDA
    // =================================================================
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

    // El resto de funciones se quedan igual
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

    readerView.querySelector('.reader-close-button').addEventListener('click', () => {
        const bottomNav = document.querySelector('.bottom-nav');
        bottomNav.classList.remove('hidden');
        navigateTo('detail');
    });
    
    document.getElementById('ad-modal-close').addEventListener('click', () => {
        document.getElementById('ad-modal').style.display = 'none';
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

    loadContent();
});
