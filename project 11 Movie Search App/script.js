// API Configuration
const API_KEY = 'd89ea5c4'; // OMDb API key
const API_URL = 'https://www.omdbapi.com/';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const moviesGrid = document.getElementById('moviesGrid');
const trendingMovies = document.getElementById('trendingMovies');
const favoritesGrid = document.getElementById('favoritesGrid');
const loader = document.getElementById('loader');
const error = document.getElementById('error');
const resultsTitle = document.getElementById('resultsTitle');
const emptyFavorites = document.getElementById('emptyFavorites');

// Modal Elements
const modal = document.getElementById('movieModal');
const closeModal = document.getElementById('closeModal');
const modalPoster = document.getElementById('modalPoster');
const modalTitle = document.getElementById('modalTitle');
const modalRating = document.getElementById('modalRating');
const modalGenre = document.getElementById('modalGenre');
const modalReleased = document.getElementById('modalReleased');
const modalRuntime = document.getElementById('modalRuntime');
const modalDirector = document.getElementById('modalDirector');
const modalLanguage = document.getElementById('modalLanguage');
const modalActors = document.getElementById('modalActors');
const modalPlot = document.getElementById('modalPlot');
const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');

// State
let currentMovieId = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Trending movies list (current trending Indian movies)
const trendingList = ['Pushpa 2', 'Animal', 'Jawan', 'Pathaan', 'Gadar 2', 'OMG 2', 'Rocky Aur Rani', 'Bholaa'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
    loadFavorites();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
    modalFavoriteBtn.addEventListener('click', toggleFavoriteFromModal);
}

// Search Movies
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showError('Please enter a movie name');
        return;
    }

    showLoader();
    hideError();
    resultsTitle.textContent = `Search Results for "${query}"`;

    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${query}`);
        const data = await response.json();

        if (data.Response === 'True') {
            displayMovies(data.Search, moviesGrid);
            document.querySelector('.results-section').style.display = 'block';
            document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        } else {
            showError(data.Error || 'Movie not found!');
            moviesGrid.innerHTML = '';
        }
    } catch (err) {
        showError('Failed to fetch movies. Please try again.');
    } finally {
        hideLoader();
    }
}

// Load Trending Movies
async function loadTrendingMovies() {
    const movies = [];
    for (let title of trendingList) {
        try {
            const response = await fetch(`${API_URL}?apikey=${API_KEY}&t=${title}`);
            const data = await response.json();
            if (data.Response === 'True') {
                movies.push(data);
            }
        } catch (err) {
            console.error('Error loading trending:', err);
        }
    }
    displayMovies(movies, trendingMovies);
}

// Display Movies
function displayMovies(movies, container) {
    container.innerHTML = '';
    
    movies.forEach(movie => {
        const isFavorite = favorites.some(fav => fav.imdbID === movie.imdbID);
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/250x350?text=No+Image'}" alt="${movie.Title}">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="movie-meta">
                    <span>${movie.Year}</span>
                    <span class="rating">⭐ ${movie.imdbRating || 'N/A'}</span>
                </div>
                <div class="movie-actions">
                    <button class="btn btn-details" onclick="showMovieDetails('${movie.imdbID}')">🎬 Details</button>
                    <button class="btn btn-favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${movie.imdbID}')">
                        ${isFavorite ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(movieCard);
    });
}

// Show Movie Details
async function showMovieDetails(imdbID) {
    currentMovieId = imdbID;
    showLoader();

    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const movie = await response.json();

        if (movie.Response === 'True') {
            modalPoster.src = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Image';
            modalTitle.textContent = movie.Title;
            modalRating.textContent = movie.imdbRating || 'N/A';
            modalGenre.textContent = movie.Genre;
            modalReleased.textContent = movie.Released;
            modalRuntime.textContent = movie.Runtime;
            modalDirector.textContent = movie.Director;
            modalLanguage.textContent = movie.Language;
            modalActors.textContent = movie.Actors;
            modalPlot.textContent = movie.Plot;

            const isFavorite = favorites.some(fav => fav.imdbID === imdbID);
            modalFavoriteBtn.textContent = isFavorite ? '❤️ Remove from Favorites' : '❤️ Add to Favorites';
            modalFavoriteBtn.classList.toggle('active', isFavorite);

            modal.classList.add('active');
        }
    } catch (err) {
        showError('Failed to load movie details');
    } finally {
        hideLoader();
    }
}

// Toggle Favorite
async function toggleFavorite(imdbID) {
    const index = favorites.findIndex(fav => fav.imdbID === imdbID);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        try {
            const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}`);
            const movie = await response.json();
            if (movie.Response === 'True') {
                favorites.push(movie);
            }
        } catch (err) {
            showError('Failed to add to favorites');
            return;
        }
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites();
    
    // Refresh current view
    if (searchInput.value) {
        handleSearch();
    } else {
        loadTrendingMovies();
    }
}

// Toggle Favorite from Modal
function toggleFavoriteFromModal() {
    toggleFavorite(currentMovieId);
    showMovieDetails(currentMovieId);
}

// Load Favorites
function loadFavorites() {
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '';
        emptyFavorites.classList.add('active');
    } else {
        emptyFavorites.classList.remove('active');
        displayMovies(favorites, favoritesGrid);
    }
}

// Utility Functions
function showLoader() {
    loader.classList.add('active');
}

function hideLoader() {
    loader.classList.remove('active');
}

function showError(message) {
    error.textContent = `❌ ${message}`;
    error.classList.add('active');
}

function hideError() {
    error.classList.remove('active');
}

// Show/Hide Sections
function showSection(sectionName) {
    document.querySelectorAll('.trending-section, .favorites-section, .results-section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    if (sectionName === 'trending') {
        document.querySelector('.trending-section').style.display = 'block';
        loadTrendingMovies();
        document.querySelector('a[href="#trending"]').classList.add('active');
    } else if (sectionName === 'favorites') {
        document.querySelector('.favorites-section').style.display = 'block';
        document.querySelector('a[href="#favorites"]').classList.add('active');
    } else if (sectionName === 'home') {
        document.querySelector('a[href="#home"]').classList.add('active');
    }
}

// Smooth Scroll for Navigation
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href === '#home') {
            showSection('home');
        } else if (href === '#trending') {
            showSection('trending');
        } else if (href === '#favorites') {
            showSection('favorites');
        } else if (href === '#about') {
            alert('About: Movie Explorer - Your gateway to discovering amazing movies!');
        }
    });
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
let isDarkTheme = !document.body.classList.contains('light-theme');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    isDarkTheme = !isDarkTheme;
    themeToggle.textContent = isDarkTheme ? '🌙' : '☀️';
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
});

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '☀️';
    isDarkTheme = false;
}
