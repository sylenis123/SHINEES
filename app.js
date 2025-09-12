document.addEventListener('DOMContentLoaded', () => {
    
    console.log("Paso 1: El DOM está cargado. El script empieza a funcionar.");

    // Vigilante de clics para toda la página
    document.addEventListener('click', (e) => {
        
        // ¿Hicimos clic en el botón del corazón o en algo dentro de él?
        if (e.target.matches('#chapter-reaction-btn') || e.target.closest('#chapter-reaction-btn')) {
            alert("¡CLIC EN EL CORAZÓN DETECTADO!");
        }

    });

    // Vigilante de envíos de formulario para toda la página
    document.addEventListener('submit', (e) => {

        // ¿Enviamos el formulario de comentarios?
        if (e.target.matches('#add-comment-form')) {
            e.preventDefault(); // Evita que la página se recargue
            alert("¡PUBLICAR COMENTARIO DETECTADO!");
        }
        
    });

});
