// Espera a que todo el contenido del DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. OBTENER REFERENCIAS A ELEMENTOS DEL HTML ---
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const modal = document.getElementById('viewer-modal');
    const modalContent = document.getElementById('viewer-content');
    const closeModalButton = document.querySelector('.close-button');

    let seriesData = []; // Variable para guardar los datos de las series

    // --- 2. FUNCIÓN PARA CREAR LA TARJETA DE UNA SERIE ---
    function createSeriesCard(serie) {
        const card = document.createElement('a');
        // Usamos data-id para identificar la serie al hacer clic
        card.dataset.id = serie.id; 
        card.className = 'series-card';
        card.href = '#'; // Evitamos que la página recargue

        card.innerHTML = `
            <img src="${serie.portada}" alt="${serie.titulo}">
            <div class="series-card-info">
                <h3>${serie.titulo}</h3>
                <p>${serie.categoria}</p>
            </div>
        `;

        // AÑADIMOS EL EVENTO DE CLIC PARA MOSTRAR CAPÍTULOS
        card.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenimos la navegación
            showChapterList(serie.id);
        });

        return card;
    }

    // --- 3. FUNCIÓN PARA MOSTRAR LA LISTA DE CAPÍTULOS EN EL MODAL ---
    function showChapterList(serieId) {
        const serie = seriesData.find(s => s.id === serieId);
        if (!serie) return;

        modalContent.innerHTML = `<h2>${serie.titulo}</h2><hr>`;
        
        const chapterList = document.createElement('ul');
        chapterList.className = 'chapter-list';

        if (serie.capitulos.length > 0) {
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
        modal.style.display = 'block'; // Mostramos el modal
    }

    // --- 4. FUNCIÓN PARA ABRIR EL VISOR DE PDF O VIDEO ---
    function openViewer(type, url) {
        if (type === 'pdf') {
            // Usamos un iframe para mostrar el PDF directamente
            modalContent.innerHTML = `<iframe src="${url}" width="100%" height="600px"></iframe>`;
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
            seriesData = data.series; // Guardamos los datos

            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';

            seriesData.forEach(serie => {
                const card = createSeriesCard(serie);
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
            loader.innerHTML = '<p>Error al cargar el contenido. Intenta refrescar la página.</p>';
        }
    }

    // --- 6. EVENTOS PARA CERRAR EL MODAL ---
    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
        modalContent.innerHTML = ''; // Limpiamos el contenido
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
            modalContent.innerHTML = ''; // Limpiamos el contenido
        }
    });

    // --- 7. INICIAR LA CARGA ---
    loadContent();
});
