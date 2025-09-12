document.addEventListener('DOMContentLoaded', () => {

    console.log("Script iniciado. Intentando cargar contenido...");

    // =================================================================
    // 1. SELECTORES BÁSICOS
    // =================================================================
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const readerView = document.getElementById('vertical-reader');
    const interactionView = document.getElementById('chapter-interaction-section');

    // =================================================================
    // 2. FUNCIÓN PARA CARGAR EL CONTENIDO (SIMPLIFICADA)
    // =================================================================
    function loadContent() {
        // Por ahora, solo vamos a simular que el contenido se ha cargado.
        // Esto es para asegurarnos de que la página aparece.
        
        console.log("Función loadContent() ejecutada.");

        // Ocultamos el loader y mostramos el contenido de la app.
        loader.style.display = 'none';
        appContent.style.display = 'block';

        console.log("Loader oculto, contenido mostrado.");
    }

    // =================================================================
    // 3. VIGILANTES DE CLICS Y ENVÍOS (LOS QUE YA PROBAMOS)
    // =================================================================
    document.addEventListener('click', (e) => {
        if (e.target.matches('#chapter-reaction-btn') || e.target.closest('#chapter-reaction-btn')) {
            alert("¡CLIC EN EL CORAZÓN DETECTADO!");
        }
    });

    document.addEventListener('submit', (e) => {
        if (e.target.matches('#add-comment-form')) {
            e.preventDefault();
            alert("¡PUBLICAR COMENTARIO DETECTADO!");
        }
    });

    // =================================================================
    // 4. EJECUCIÓN INICIAL
    // =================================================================
    // Llamamos a la función para que la página cargue.
    loadContent();

});
