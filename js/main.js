let siteData = null;

document.addEventListener('DOMContentLoaded', function() {
    loadContentData();    
    setupSearch();
});

async function loadContentData() {
    try {
        const [contentResponse, linksResponse] = await Promise.all([
            fetch('data/content.json'),
            fetch('data/contentlinks.json')
        ]);
        
        siteData = await contentResponse.json();
        const linksData = await linksResponse.json();
        
        window.contentLinks = linksData;
        
        loadSiteNews();
        loadFeaturedGames();
        loadLatestSubmissions();
        
        console.log('✅ Content data and links loaded successfully');
    } catch (error) {
        console.error('❌ Error loading content data:', error);
    }
}

function loadSiteNews() {
    if (!siteData || !siteData.siteNews) return;
    
    const newsContainer = document.querySelector('#leftcol .featurefix.dotted');
    if (newsContainer) {
        newsContainer.innerHTML = '';
        
        siteData.siteNews.forEach(news => {
            const newsItem = document.createElement('div');
            newsItem.innerHTML = `
                <a href="${news.url}" class="feature">
                    <img src="${news.thumbnail || 'https://via.placeholder.com/46x46/333/fff?text=Tom'}" height="46" width="46" alt="icon">
                    <span class="fout">
                        <span class="fmid">
                            <span class="fin">
                                <em class="gray"><strong>${news.author}</strong> sez:</em>
                                <span class="fblurb">"${news.title}"</span>
                            </span>
                        </span>
                    </span>
                </a>
            `;
            newsContainer.appendChild(newsItem);
        });
    }
}

function loadFeaturedMovies() {
    if (!siteData || !siteData.featuredMovies) return;
    
    const moviesContainer = document.querySelector('#rightcol .featurefix');
    if (moviesContainer) {
        const moviesSection = moviesContainer.parentElement.parentElement.parentElement;
        const moviesFeaturefix = moviesSection.querySelector('.featurefix');
        
        if (moviesFeaturefix) {
            moviesFeaturefix.innerHTML = '';
            
            siteData.featuredMovies.forEach(movie => {
                const movieItem = document.createElement('div');
                movieItem.innerHTML = `
                    <a href="${movie.url}" class="feature" title="Suitable For ${movie.rating}">
                        <img src="${movie.thumbnail}" height="46" width="46" alt="icon">
                        <span class="fout">
                            <span class="fmid">
                                <span class="fin"><span class="ftitle">${movie.title}</span>${movie.description}</span>
                            </span>
                        </span>
                    </a>
                `;
                moviesFeaturefix.appendChild(movieItem);
            });
        }
    }
}

function loadFeaturedGames() {
    if (!siteData || !siteData.featuredGames) return;
    
    const gamesHeading = Array.from(document.querySelectorAll('h2')).find(h2 => 
        h2.textContent.includes('Featured Games')
    );
    
    if (gamesHeading) {
        const gamesBox = gamesHeading.closest('.box');
        const gamesFeaturefix = gamesBox.querySelector('.featurefix');
        
        if (gamesFeaturefix) {
            gamesFeaturefix.innerHTML = '';
            
            siteData.featuredGames.forEach(game => {
                let portalPath = 'portal.html';
                if (window.contentLinks && window.contentLinks.games[game.id]) {
                    const gameLinks = window.contentLinks.games[game.id];
                    if (gameLinks.type === 'unity') {
                        portalPath = 'uportal.html';
                    }
                }
                
                const gameItem = document.createElement('div');
                gameItem.className = 'game-item';
                gameItem.innerHTML = `
                    <a href="${portalPath}?id=${game.id}" class="feature" title="Suitable For ${game.rating || 'Everyone'}">
                        <img src="${game.thumbnail || 'assets/thumbs/antilgoc.png'}" height="80" width="80" alt="icon">
                        <span class="fout">
                            <span class="fmid">
                                <span class="fin"><span class="ftitle">${game.title}</span>${(game.shortdescription || '').replace(/\n/g, '<br>')}</span>
                            </span>
                        </span>
                    </a>
                `;
                gamesFeaturefix.appendChild(gameItem);
            });
        }
    }
}

function loadLatestSubmissions() {
    if (!siteData || !siteData.latestSubmissions) return;
    
    const submissionsContainer = document.querySelector('.entries');
    if (submissionsContainer) {
        submissionsContainer.innerHTML = '';
        
        siteData.latestSubmissions.forEach(submission => {
            let portalPath = 'portal.html';
            if (window.contentLinks && window.contentLinks.games[submission.id]) {
                const gameLinks = window.contentLinks.games[submission.id];
                if (gameLinks.type === 'unity') {
                    portalPath = 'uportal.html';
                }
            }
            
            const submissionItem = document.createElement('li');
            submissionItem.className = submission.type;
            submissionItem.innerHTML = `
                <a href="${portalPath}?id=${submission.id}" title="Suitable For ${submission.rating || 'Everyone'}" class="${submission.score || 'awesome'}">${submission.title}</a>
            `;
            submissionItem.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `${portalPath}?id=${submission.id}`;
            });
            submissionsContainer.appendChild(submissionItem);
        });
    }
}

function setupSearch() {
    const searchForm = document.getElementById('search');
    const searchInput = document.getElementById('topsearch_terms');
    const searchType = document.getElementById('topsearch_type');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const query = searchInput.value.trim();
            const type = searchType.value;
            
            if (query) {
                performSearch(query, type);
            }
        });
    }
}

function performSearch(query, type = 'title') {
    if (!siteData) return;
    
    const results = [];
    const searchQuery = query.toLowerCase();
    
    const allContent = [
        ...(siteData.featuredMovies || []).map(item => ({ ...item, contentType: 'movie' })),
        ...(siteData.featuredGames || []).map(item => ({ ...item, contentType: 'game' })),
        ...(siteData.featuredMusic || []).map(item => ({ ...item, contentType: 'music' })),
        ...(siteData.featuredArt || []).map(item => ({ ...item, contentType: 'art' }))
    ];
    
    allContent.forEach(item => {
        let match = false;
        
        if (type === 'title' && item.title.toLowerCase().includes(searchQuery)) {
            match = true;
        } else if (type === 'author' && item.author && item.author.toLowerCase().includes(searchQuery)) {
            match = true;
        }
        
        if (match) {
            results.push({
                id: item.id,
                title: item.title,
                author: item.author || 'Unknown',
                url: item.url,
                contentType: item.contentType
            });
        }
    });
    
    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    let resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'searchResults';
        resultsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #25272d;
            border: 1px solid #40444c;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
        `;
        document.getElementById('search').appendChild(resultsContainer);
    }
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `<div style="padding: 10px; color: #ccc;">No results found for "${query}"</div>`;
        return;
    }
    
    resultsContainer.innerHTML = '';
    
    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.style.cssText = `
            padding: 8px;
            border-bottom: 1px solid #40444c;
            cursor: pointer;
        `;
        resultItem.innerHTML = `
            <div style="color: #fff; font-weight: bold;">${result.title}</div>
            <div style="color: #ccc; font-size: 0.9em;">by ${result.author} (${result.contentType})</div>
        `;
        
        resultItem.addEventListener('click', () => {
            if (result.contentType === 'game') {
                let portalPath = 'portal.html';
                if (window.contentLinks && window.contentLinks.games[result.id]) {
                    const gameLinks = window.contentLinks.games[result.id];
                    if (gameLinks.type === 'unity') {
                        portalPath = 'uportal.html';
                    }
                }
                window.location.href = `${portalPath}?id=${result.id}`;
            } else {
                window.location.href = result.url;
            }
        });
        
        resultItem.addEventListener('mouseenter', () => {
            resultItem.style.backgroundColor = '#2a2c32';
        });
        
        resultItem.addEventListener('mouseleave', () => {
            resultItem.style.backgroundColor = 'transparent';
        });
        
        resultsContainer.appendChild(resultItem);
    });
}

document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('searchResults');
    const searchForm = document.getElementById('search');
    
    if (searchResults && !searchForm.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('topsearch_terms');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('focus', function() {
            if (searchResults.children.length > 0) {
                searchResults.style.display = 'block';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const leftCol = document.getElementById('leftcol');
    const rightCol = document.getElementById('rightcol');
    
    if (leftCol && rightCol) {
        requestAnimationFrame(function() {
            leftCol.style.position = 'relative';
            rightCol.style.position = 'relative';
        });
    }
    
    const images = document.querySelectorAll('img');
    images.forEach(function(img) {
        img.loading = 'lazy';
    });
});