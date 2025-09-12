document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. CONFIGURACIÓN DE FIREBASE
    // ¡¡¡Pega aquí las llaves (el objeto firebaseConfig) que guardaste!!!
    // =================================================================
    const firebaseConfig = {
        <script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDsv2keytFIEeS4QT4_chwOHMgyWpV8gP4",
    authDomain: "shinees.firebaseapp.com",
    projectId: "shinees",
    storageBucket: "shinees.firebasestorage.app",
    messagingSenderId: "109623976622",
    appId: "1:109623976622:web:c9ab5a1c345f502b71833f",
    measurementId: "G-Z0HSJ2WDZQ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
    };

    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(); // Nuestra conexión a la base de datos Firestore

    // =================================================================
    // 2. SELECTORES DEL DOM (igual que antes)
    // =================================================================
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    // ... (el resto de tus selectores: readerView, loader, etc.)
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const themeToggleButton = document.getElementById('theme-toggle');
    const readerView = document.getElementById('vertical-reader');


    let seriesData = []; // Aquí guardaremos los datos de Firebase

    // =================================================================
    // 3. LÓGICA DE LA APLICACIÓN (casi igual, pero con la nueva carga)
    // =================================================================

    // --- ¡¡¡NUEVA FUNCIÓN loadContent!!! ---
    async function loadContent() {
        try {
            const seriesCollection = await db.collection('series').get(); // Pide los datos a Firestore
            
            seriesData = seriesCollection.docs.map(doc => doc.data()); // Convierte los datos a un formato que entendemos

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
            loader.innerHTML = '<p>Error al conectar con la base de datos. Revisa la configuración de Firebase.</p>';
        }
    }

    // El resto de tus funciones (createSeriesCard, buildDetailPage, etc.)
    // se quedan exactamente igual que las teníamos. Las pego aquí para que no falte nada.

    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');
        readerView.classList.add('hidden');
        if (view === 'main') mainView.classList.remove('hidden');
        else if (view === 'detail') detailView.classList.remove('hidden');
        else if (view === 'reader') readerView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    function openVerticalReader(chapter) {
        const readerContent = document.getElementById('reader-content');
        const bottomNav = document.querySelector('.bottom-nav');
        readerContent.innerHTML = '';
        
        if (chapter && chapter.tiras && chapter.tiras.length > 0) {
            chapter.tiras.forEach(tira => {
                for (let i = 1; i <= tira.paginas; i++) {
                    const pageNumber = i.toString().padStart(2, '0');
                    const imageUrl = `https://raw.githubusercontent.com/sylenis123/SHINEES/main/contenido/${chapter.path}/${tira.id}_${pageNumber}.${chapter.formato}`;
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
            adModal.style.display = 'flex';
        };
        readerContent.appendChild(adButton);

        bottomNav.classList.add('hidden');
        navigateTo('reader');
    }

    function buildDetailPage(serie) {
        detailView.innerHTML = `<div class="series-detail-container"><header class="detail-header" style="background-image: url('${serie.portada}')"><button class="back-button">‹</button><div class="detail-info"><div class="detail-info-cover"><img src="${serie.portada}" alt="${serie.titulo}"></div><div class="detail-info-text"><h1>${serie.titulo}</h1><p>${serie.categoria}</p></div></div></header><div class="detail-content"><p class="detail-description">${serie.descripcion}</p><h2>Capítulos</h2><ul class="chapter-list" id="detail-chapter-list"></ul></div></div>`;
        const chapterList = detailView.querySelector('#detail-chapter-list');
        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = `${cap.numero}: ${cap.titulo_cap}`;
                link.addEventListener('click', (e) => { e.preventDefault(); openVerticalReader(cap); });
                listItem.appendChild(link);
                chapterList.appendChild(listItem);
            });
        } else {
            chapterList.innerHTML = '<li><p>Aún no hay capítulos disponibles.</p></li>';
        }
        detailView.querySelector('.back-button').addEventListener('click', () => navigateTo('main'));
    }

    function createSeriesCard(serie, type = 'grid') {
        const card = document.createElement('a');
        card.href = '#';
        if (type === 'hero') {
            card.className = 'hero-card';
            card.innerHTML = `<div class="hero-card-bg" style="background-image: url('${serie.portada}')"></div><img src="${serie.portada}" class="hero-card-cover" alt="${serie.titulo}"><div class="hero-card-info"><h3>${serie.titulo}</h3><p>${serie.categoria}</p></div>`;
        } else {
            card.className = 'series-card';
            card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}"><div class="series-card-info"><h3>${serie.titulo}</h3></div>`;
        }
        card.addEventListener('click', (e) => { e.preventDefault(); showDetailPage(serie.id); });
        return card;
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
