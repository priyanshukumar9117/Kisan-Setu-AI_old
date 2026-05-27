/* Global State Management */
const appState = {
    language: 'en',
    mode: 'text',
    userId: null,
    isLoading: false,
    preferences: {}
};

/* Initialize App */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupNavigation();
    setupPageSpecificListeners();
});

function initializeApp() {
    // Load user preferences from localStorage
    const savedLanguage = localStorage.getItem('kisan_language') || 'en';
    appState.language = savedLanguage;

    // Get userId from HTML data attribute if on authenticated page
    const userIdElement = document.querySelector('[data-user-id]');
    if (userIdElement) {
        appState.userId = userIdElement.getAttribute('data-user-id');
        loadUserPreferences();
    }

    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const navItems = document.querySelector('.nav-items');
            navItems?.classList.toggle('show');
        });
    }
}

/* Navigation Setup */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('.nav-items')?.classList.remove('show');
        });
    });
}

/* Page-Specific Setup */
function setupPageSpecificListeners() {
    const page = document.body.getAttribute('data-page');
    
    switch(page) {
        case 'chat':
            setupChatPage();
            break;
        case 'dashboard':
            setupDashboardPage();
            break;
        case 'profile':
            setupProfilePage();
            break;
        case 'history':
            setupHistoryPage();
            break;
        case 'calendar':
            setupCalendarPage();
            break;
        case 'pest-guide':
            setupPestGuidePage();
            break;
    }
}

/* ===== CHAT PAGE ===== */
function setupChatPage() {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = chatForm?.querySelector('button[type="submit"]');
    const voiceBtn = document.getElementById('voiceButton');
    const langButtons = document.querySelectorAll('.lang-btn');

    // Language toggle
    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            langButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.language = e.target.getAttribute('data-lang');
            localStorage.setItem('kisan_language', appState.language);
        });
    });

    // Voice input
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }

    // Send message
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = messageInput?.value.trim();
            if (message) {
                sendMessage(message);
                messageInput.value = '';
            }
        });

        messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Load chat history on page load
    loadChatMessages();
}

async function sendMessage(text) {
    // Display user message
    displayMessage(text, 'user');

    if (!appState.userId) {
        displayMessage('Please log in to use the chat feature.', 'assistant');
        return;
    }

    try {
        appState.isLoading = true;
        showLoadingIndicator();

        const response = await fetch('/query/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                text: text,
                user_id: appState.userId,
                language: appState.language
            })
        });

        const data = await response.json();
        appState.isLoading = false;
        hideLoadingIndicator();

        if (data.status === 'success') {
            displayMessage(data.response_text, 'assistant');

            // Save to history
            saveChatToHistory(text, data.response_text);

            // Play audio if TTS is enabled
            if (appState.preferences.tts_enabled && data.audio_file) {
                playAudio(data.audio_file);
            }
        } else {
            displayMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    } catch (error) {
        console.error('Chat error:', error);
        appState.isLoading = false;
        hideLoadingIndicator();
        displayMessage('Connection error. Please check your internet and try again.', 'assistant');
    }
}

function displayMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Voice input not supported in your browser. Please update your browser.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.language = appState.language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        showToast('Listening...');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = transcript;
            const form = messageInput.closest('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    };

    recognition.onerror = (event) => {
        showToast(`Error: ${event.error}`);
    };

    recognition.start();
}

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(err => console.error('Error playing audio:', err));
}

function loadChatMessages() {
    // This can be populated from the backend or local storage
}

async function saveChatToHistory(query, response) {
    if (!appState.userId) return;

    try {
        await fetch('/web/api/save-chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                query: query,
                response: response,
                language: appState.language
            })
        });
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

/* ===== DASHBOARD PAGE ===== */
function setupDashboardPage() {
    loadWeatherData();
    loadMarketPrices();
    loadCropRecommendations();
}

async function loadWeatherData() {
    try {
        // Using Open-Meteo free weather API (no key required)
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.5941&longitude=85.1376&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Kolkata');
        const data = await response.json();
        
        if (data.current) {
            const weather = data.current;
            const weatherCard = document.querySelector('.weather-card');
            if (weatherCard) {
                weatherCard.innerHTML = `
                    <div class="card-header">
                        <div class="card-icon">☀️</div>
                        <div>
                            <h3 class="card-title">Weather</h3>
                            <p class="card-text">Patna, Bihar</p>
                        </div>
                    </div>
                    <div class="temp-display">
                        <span class="stat-value">${Math.round(weather.temperature_2m)}°C</span>
                    </div>
                    <p class="card-text">Humidity: ${weather.relative_humidity_2m}%</p>
                    <p class="card-text">Wind: ${weather.wind_speed_10m} km/h</p>
                `;
            }
        }
    } catch (error) {
        console.error('Weather API error:', error);
    }
}

async function loadMarketPrices() {
    try {
        const prices = {
            'Rice': { price: 24, unit: '/kg', change: '+2%' },
            'Wheat': { price: 22, unit: '/kg', change: '-1%' },
            'Mustard': { price: 36, unit: '/kg', change: '+3%' },
            'Lentil': { price: 45, unit: '/kg', change: '+1%' },
            'Cotton': { price: 52, unit: '/kg', change: '-2%' }
        };

        const marketContainer = document.querySelector('.market-prices');
        if (marketContainer) {
            let html = '<div class="feature-grid">';
            for (const [crop, data] of Object.entries(prices)) {
                html += `
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon">📊</div>
                            <div>
                                <h3 class="card-title">${crop}</h3>
                                <p class="card-text">${data.change}</p>
                            </div>
                        </div>
                        <div class="stat-value">₹${data.price} ${data.unit}</div>
                    </div>
                `;
            }
            html += '</div>';
            marketContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Market prices error:', error);
    }
}

async function loadCropRecommendations() {
    const recommendations = {
        'Maize': { season: 'Good', water: 'Moderate', yield: '45-50 qtls/acre' },
        'Wheat': { season: 'Ideal', water: 'Low', yield: '35-40 qtls/acre' },
        'Pulses': { season: 'Good', water: 'Low', yield: '15-20 qtls/acre' }
    };

    const cropContainer = document.querySelector('.crop-recommendations');
    if (cropContainer) {
        let html = '<div class="feature-grid">';
        for (const [crop, data] of Object.entries(recommendations)) {
            html += `
                <div class="card">
                    <h3 class="card-title">${crop}</h3>
                    <p><strong>Season:</strong> ${data.season}</p>
                    <p><strong>Water:</strong> ${data.water}</p>
                    <p><strong>Expected Yield:</strong> ${data.yield}</p>
                </div>
            `;
        }
        html += '</div>';
        cropContainer.innerHTML = html;
    }
}

/* ===== PROFILE PAGE ===== */
function setupProfilePage() {
    const saveBtn = document.querySelector('.save-preferences-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveUserPreferences);
    }

    loadUserPreferences();
}

async function loadUserPreferences() {
    if (!appState.userId) return;

    try {
        const response = await fetch('/web/api/get-preferences/', {
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        const data = await response.json();
        appState.preferences = data;

        // Update UI
        const langSelect = document.querySelector('select[name="language"]');
        const modeSelect = document.querySelector('select[name="mode"]');
        const ttsToggle = document.querySelector('input[name="tts_enabled"]');

        if (langSelect) langSelect.value = data.language;
        if (modeSelect) modeSelect.value = data.mode;
        if (ttsToggle) ttsToggle.checked = data.tts_enabled;
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

async function saveUserPreferences() {
    const langSelect = document.querySelector('select[name="language"]');
    const modeSelect = document.querySelector('select[name="mode"]');
    const ttsToggle = document.querySelector('input[name="tts_enabled"]');

    try {
        const response = await fetch('/web/api/save-preferences/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                language: langSelect?.value || 'en',
                mode: modeSelect?.value || 'text',
                tts_enabled: ttsToggle?.checked || false
            })
        });

        const data = await response.json();
        if (data.status === 'success') {
            showToast('Preferences saved successfully!');
            loadUserPreferences();
        }
    } catch (error) {
        console.error('Error saving preferences:', error);
        showToast('Failed to save preferences');
    }
}

/* ===== HISTORY PAGE ===== */
function setupHistoryPage() {
    loadChatHistory();
}

async function loadChatHistory() {
    const historyContainer = document.querySelector('.history-list');
    if (!historyContainer) return;

    try {
        historyContainer.innerHTML = '<p>Loading chat history...</p>';
        // Fetch from backend or local storage
        // This is a placeholder
        historyContainer.innerHTML = '<p>Your chat history will appear here.</p>';
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

/* ===== CALENDAR PAGE ===== */
function setupCalendarPage() {
    generateFarmingCalendar();
}

function generateFarmingCalendar() {
    const calendarContainer = document.querySelector('.calendar-grid');
    if (!calendarContainer) return;

    const events = {
        5: 'Sowing - Wheat',
        15: 'Irrigation',
        22: 'Fertilizer - NPK',
        28: 'Sowing - Pulses'
    };

    let html = '';
    for (let i = 1; i <= 30; i++) {
        const hasEvent = events[i];
        html += `
            <div class="calendar-day ${hasEvent ? 'event' : ''}" title="${hasEvent || ''}">
                ${i}
            </div>
        `;
    }
    calendarContainer.innerHTML = html;
}

/* ===== PEST GUIDE PAGE ===== */
function setupPestGuidePage() {
    // Pest guide content is static, setup filter/search if needed
}

/* ===== UTILITY FUNCTIONS ===== */
function showLoadingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message assistant';
        loadingDiv.innerHTML = '<div class="chat-bubble"><div class="spinner"></div></div>';
        loadingDiv.id = 'loading-indicator';
        messagesContainer.appendChild(loadingDiv);
    }
}

function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loading-indicator');
    loadingDiv?.remove();
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
