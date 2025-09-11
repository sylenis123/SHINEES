// Espera a que todo el contenido del DOM (la estructura HTML) esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. OBTENER REFERENCIAS A ELEMENTOS DEL HTML ---
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');

    // --- 2. FUNCIÓN PARA CREAR LA TARJETA DE UNA SERIE ---
    // Esta función crea el HTML para una tarjeta de serie individual.
    // Así no repetimos código.
    function createSeriesCard(serie) {
        // Creamos un elemento 'a' (enlace) que será la tarjeta
        const card = document.createElement('a');
        card.href = `#serie/${serie.id}`; // Enlace único para cada serie
        card.className = 'series-card';

        // Creamos la imagen de portada
        const img = document.createElement('img');
        img.src = serie.portada;
        img.alt = serie.titulo;

        // Creamos el contenedor para la información (título y categoría)
        const info = document.createElement('div');
        info.className = 'series-card-info';

        // Creamos el título
        const title = document.createElement('h3');
        title.textContent = serie.titulo;

        // Creamos el párrafo para la categoría
        const category = document.createElement('p');
        category.textContent = serie.categoria;

        // Juntamos todo:
        info.appendChild(title);
        info.appendChild(category);
        card.appendChild(img);
        card.appendChild(info);

        // Devolvemos la tarjeta completa
        return card;
    }

    // --- 3. FUNCIÓN PRINCIPAL PARA CARGAR Y MOSTRAR EL CONTENIDO ---
    async function loadContent() {
        try {
            // Hacemos una petición para obtener el archivo database.json
            const response = await fetch('database.json');
            // Si la petición falla (ej: archivo no encontrado), lanzamos un error
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Convertimos la respuesta a formato JSON
            const data = await response.json();

            // Limpiamos los contenedores por si acaso
            featuredCarousel.innerHTML = '';
            popularSeriesGrid.innerHTML = '';

            // Recorremos cada serie en nuestra base de datos
            data.series.forEach(serie => {
                const card = createSeriesCard(serie);
                
                // Si la serie es 'destacada', la añadimos al carrusel
                if (serie.destacado) {
                    featuredCarousel.appendChild(card);
                } else {
                    // Si no, la añadimos a la parrilla de series populares
                    popularSeriesGrid.appendChild(card);
                }
            });

            // --- 4. OCULTAR EL LOADER Y MOSTRAR EL CONTENIDO ---
            // Una vez que todo el contenido ha sido creado...
            loader.style.display = 'none'; // Ocultamos el loader
            appContent.style.display = 'block'; // Mostramos el contenido de la app

        } catch (error) {
            // Si algo falla (ej: el JSON está mal escrito o no se encuentra),
            // lo mostramos en la consola para poder depurarlo.
            console.error("No se pudo cargar el contenido:", error);
            // Podríamos mostrar un mensaje de error al usuario aquí
            loader.innerHTML = '<p>Error al cargar el contenido. Intenta refrescar la página.</p>';
        }
    }

    // --- 5. INICIAR LA CARGA DEL CONTENIDO ---
    // Llamamos a la función principal para que todo comience.
    loadContent();

});
