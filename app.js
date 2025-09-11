document.addEventListener('DOMContentLoaded', () => {

    // --- 1. OBTENER REFERENCIAS A ELEMENTOS DEL HTML ---
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const modal = document.getElementById('viewer-modal');
    const modalContent = document.getElementById('viewer-content');
    const closeModalButton = document.querySelector('.close-button');
    const themeToggleButton = document.getElementById('theme-toggle'); // Botón de tema

    let seriesData = [];

    // --- 2. FUNCIÓN PARA CREAR TARJETAS (AHORA MÁS INTELIGENTE) ---
    // Recibe la serie y el tipo de tarjeta que debe crear ('hero' o 'grid')
    function createSeriesCard(serie, type = 'grid') {
        const card = document.createElement('a');
        card.dataset.id = serie.id;
        card.href = '#';

        if (type === 'hero') {
            // --- CREA LA TARJETA GRANDE PARA EL CARRUSEL ---
            card.className = 'hero-card';
            card.innerHTML = `
                <img src="${serie.portada}" alt="${serie.titulo}">
                <div class="hero-card-info">
                    <h3>${serie.titulo}</h3>
                    <p>${serie.categoria}</p>
                </div>
            `;
        } else {
            // --- CREA LA TARJETA PEQUEÑA PARA LA PARRILLA ---
            card.className = 'series-card';
            card.innerHTML = `
                <img src="${serie.portada}" alt="${serie.titulo}">
                <div class="series-card-info">
                    <h3>${serie.titulo}</h3>
                    <p>${serie.categoria}</p>
                </div>
            `;
        }

        card.addEventListener('click', (e) => {
            e.preventDefault();
            showChapterList(serie.id);
        });

        return card;
    }

    // --- 3. FUNCIÓN PARA MOSTRAR LA LISTA DE CAPÍTULOS ---
    function showChapterList(serieId) {
        const serie = seriesData.find(s => s.id === serieId);
        if (!serie) return;

        modalContent.innerHTML = `<h2>${serie.titulo}</h2><hr>`;
        
        const chapterList = document.createElement('ul');
        chapterList.className = 'chapter-list';

        if (serie.capitulos && serie.capitulos.length > 0) {
            serie.capitulos.forEach(cap => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = `${cap.numero}: ${cap.titulo_cap}`;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openViewer(cap.tipo, cap.url);
                });
                listItem.appendChild(link);
                chapterList.appendChild(listItem);
            });
        } else {
            const noChapters = document.createElement('p');
            noChapters.textContent = 'Aún no hay capítulos disponibles para esta serie.';
            chapterList.appendChild(noChapters);
        }

        modalContent.appendChild(chapterList);
        modal.style.display = 'block';
    }

    // --- 4. FUNCIÓN PARA ABRIR EL VISOR ---
    function openViewer(type, url) {
        if (type === 'pdf') {
            modalContent.innerHTML = `<iframe src="${url}" width="100%" height="600px" style="border:none;"></iframe>`;
        } else if (type === 'video') {
            modalContent.innerHTML = `<video controls autoplay width="100%"><source src="${url}" type="video/mp4">Tu navegador no soporta videos.</video>`;
        }
    }

    // --- 5. FUNCIÓN PRINCIPAL PARA CARGAR EL CONTENIDO ---
    async function loadContent() {
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            seriesData = data.series;

            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';

            seriesData.forEach(serie => {
                // AQUÍ ESTÁ LA LÓGICA CORREGIDA
                if (serie.destacado) {
                    // Si es destacada, crea una tarjeta tipo 'hero'
                    const card = createSeriesCard(serie, 'hero');
                    featuredCarousel.appendChild(card);
                } else {
                    // Si no, crea una tarjeta normal tipo 'grid'
                    const card = createSeriesCard(serie, 'grid');
                    popularSeriesGrid.appendChild(card);
                }
            });

            loader.style.display = 'none';
            appContent.style.display = 'block';

        } catch (error) {
            console.error("No se pudo cargar el contenido:", error);
            loader.innerHTML = '<p>Error al cargar el contenido. Intenta refrescar la página.</p>';
        }
    }

    // --- 6. LÓGICA PARA EL BOTÓN DE CAMBIO DE TEMA ---
    themeToggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggleButton.textContent = '🌙'; // Cambia el icono a luna
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggleButton.textContent = '☀️'; // Cambia el icono a sol
        }
    });

    // --- 7. EVENTOS PARA CERRAR EL MODAL ---
    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
        modalContent.innerHTML = '';
    });
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
            modalContent.innerHTML = '';
        }
    });

    // --- 8. INICIAR LA CARGA ---
    loadContent();
});
