document.addEventListener('DOMContentLoaded', () => {

    // --- 1. OBTENER REFERENCIAS A ELEMENTOS ---
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    // ... (el resto de referencias que ya teníamos)
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const themeToggleButton = document.getElementById('theme-toggle');

    let seriesData = [];

    // --- NAVEGACIÓN ENTRE VISTAS ---
    function navigateTo(view) {
        mainView.classList.add('hidden');
        detailView.classList.add('hidden');

        if (view === 'main') {
            mainView.classList.remove('hidden');
        } else if (view === 'detail') {
            detailView.classList.remove('hidden');
        }
        window.scrollTo(0, 0); // Sube al inicio de la página
    }

    // --- FUNCIÓN PARA CONSTRUIR LA PÁGINA DE DETALLES ---
    function buildDetailPage(serie) {
        detailView.innerHTML = `
            <div class="series-detail-container">
                <header class="detail-header" style="background-image: url('${serie.portada}')">
                    <button class="back-button">‹</button>
                    <div class="detail-info">
                        <div class="detail-info-cover">
                            <img src="${serie.portada}" alt="${serie.titulo}">
                        </div>
                        <div class="detail-info-text">
                            <h1>${serie.titulo}</h1>
                            <p>${serie.categoria}</p>
                        </div>
                    </div>
                </header>
                <div class="detail-content">
                    <p class="detail-description">${serie.descripcion}</p>
                    <h2>Capítulos</h2>
                    <ul class="chapter-list" id="detail-chapter-list">
                        <!-- Los capítulos se insertarán aquí -->
                    </ul>
                </div>
            </div>
        `;

        const chapterList = detailView.querySelector('#detail-chapter-list');
        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="#">${cap.numero}: ${cap.titulo_cap}</a>`;
                chapterList.appendChild(listItem);
            });
        } else {
            chapterList.innerHTML = '<li><p>Aún no hay capítulos disponibles.</p></li>';
        }

        // Añadir evento al botón de volver
        detailView.querySelector('.back-button').addEventListener('click', () => {
            navigateTo('main');
        });
    }

    // --- FUNCIÓN PARA MOSTRAR LA PÁGINA DE DETALLES ---
    function showDetailPage(serieId) {
        const serie = seriesData.find(s => s.id === serieId);
        if (!serie) return;

        buildDetailPage(serie);
        navigateTo('detail');
    }

    // --- FUNCIÓN PARA CREAR TARJETAS (MODIFICADA PARA NAVEGAR) ---
    function createSeriesCard(serie, type = 'grid') {
        const card = document.createElement('a');
        card.href = '#'; // Usamos JS para la navegación
        
                if (type === 'hero') {
            // --- CREA LA TARJETA GRANDE PARA EL CARRUSEL (NUEVA ESTRUCTURA) ---
            card.className = 'hero-card';
            card.innerHTML = `
                <!-- Fondo desenfocado -->
                <img src="${serie.portada}" class="hero-card-background" alt="">
                
                <!-- Portada nítida superpuesta -->
                <img src="${serie.portada}" class="hero-card-cover" alt="${serie.titulo}">

                <!-- Información de la serie -->
                <div class="hero-card-info">
                    <h3>${serie.titulo}</h3>
                    <p>${serie.categoria}</p>
                </div>
            `;
        } else {
            // --- CREA LA TARJETA PEQUEÑA PARA LA PARRILLA (SIN CAMBIOS) ---
            card.className = 'series-card';
            card.innerHTML = `
                <img src="${serie.portada}" alt="${serie.titulo}">
                <div class="series-card-info">
                    <h3>${serie.titulo}</h3>
                    <p>${serie.categoria}</p>
                </div>
            `;
        }

        // El evento de clic ahora llama a showDetailPage
        card.addEventListener('click', (e) => {
            e.preventDefault();
            showDetailPage(serie.id);
        });

        return card;
    }

    // --- FUNCIÓN PRINCIPAL PARA CARGAR EL CONTENIDO (sin cambios mayores) ---
    async function loadContent() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            seriesData = data.series;

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
            console.error("No se pudo cargar el contenido:", error);
            loader.innerHTML = '<p>Error al cargar el contenido.</p>';
        }
    }

    // --- LÓGICA DEL TEMA (sin cambios) ---
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

    // --- INICIAR LA CARGA ---
    loadContent();
});
