document.addEventListener('DOMContentLoaded', () => {

    const mainView = document.getElementById('main-view');
    const detailView = document.getElementById('series-detail-view');
    const readerView = document.getElementById('vertical-reader');
    const featuredCarousel = document.getElementById('featured-carousel');
    const popularSeriesGrid = document.getElementById('popular-series');
    const loader = document.getElementById('loader');
    const appContent = document.getElementById('app-content');
    const themeToggleButton = document.getElementById('theme-toggle');

    const GITHUB_USER = 'sylenis123';
    const GITHUB_REPO = 'SHINEES';
    const BASE_CONTENT_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/contenido/`;
    let seriesData = [];

    function navigateTo(view ) {
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
        if (chapter.path && chapter.total_paginas > 0) {
            for (let i = 1; i <= chapter.total_paginas; i++) {
                const pageNumber = i.toString().padStart(2, '0');
                // La URL simple y correcta, asumiendo que no hay espacios en los nombres de las carpetas
              const imageUrl = `${BASE_CONTENT_URL}${chapter.path}/${i}_${pageNumber}.${chapter.formato}`;
                const img = document.createElement('img');
                img.src = imageUrl;
                readerContent.appendChild(img);
            }
        } else {
            readerContent.innerHTML = '<p style="color:white; text-align:center; margin-top: 50px;">Este capítulo no tiene páginas.</p>';
        }
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
                link.addEventListener('click', (e) => { e.preventDefault(); if (cap.tipo === 'vertical-reader') { openVerticalReader(cap); } else { alert('Este tipo de capítulo no es compatible.'); } });
                listItem.appendChild(link);
                chapterList.appendChild(listItem);
            });
        } else {
            chapterList.innerHTML = '<li><p>Aún no hay capítulos disponibles.</p></li>';
        }
        detailView.querySelector('.back-button').addEventListener('click', () => navigateTo('main'));
    }

    function showDetailPage(serieId) { const serie = seriesData.find(s => s.id === serieId); if (!serie) return; buildDetailPage(serie); navigateTo('detail'); }
    function createSeriesCard(serie, type = 'grid') { const card = document.createElement('a'); card.href = '#'; if (type === 'hero') { card.className = 'hero-card'; card.innerHTML = `<img src="${serie.portada}" class="hero-card-background" alt=""><img src="${serie.portada}" class="hero-card-cover" alt="${serie.titulo}"><div class="hero-card-info"><h3>${serie.titulo}</h3><p>${serie.categoria}</p></div>`; } else { card.className = 'series-card'; card.innerHTML = `<img src="${serie.portada}" alt="${serie.titulo}"><div class="series-card-info"><h3>${serie.titulo}</h3><p>${serie.categoria}</p></div>`; } card.addEventListener('click', (e) => { e.preventDefault(); showDetailPage(serie.id); }); return card; }
    
    async function loadContent() { 
        try { 
            const response = await fetch('database.json'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); 
            const data = await response.json(); 
            seriesData = data.series; 
            featuredCarousel.innerHTML = ''; 
            popularSeriesGrid.innerHTML = ''; 
            seriesData.forEach(serie => { const cardType = serie.destacado ? 'hero' : 'grid'; const card = createSeriesCard(serie, cardType); if (serie.destacado) { featuredCarousel.appendChild(card); } else { popularSeriesGrid.appendChild(card); } }); 
            loader.style.display = 'none'; 
            appContent.style.display = 'block'; 
        } catch (error) { 
            console.error("No se pudo cargar el contenido:", error); 
            loader.innerHTML = '<p>Error al cargar el contenido. Revisa el archivo database.json y la consola.</p>'; 
        } 
    }
    
    readerView.querySelector('.reader-close-button').addEventListener('click', () => {
        const bottomNav = document.querySelector('.bottom-nav');
        bottomNav.classList.remove('hidden');
        navigateTo('detail');
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
