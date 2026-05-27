// features.js — Auth, Profile, Weather, Mandi, Disease logic
const API = 'http://localhost:8000';

// ── Auth ──
window.switchAuthTab = function(tab) {
    document.getElementById('login-form').style.display = tab === 'login' ? 'flex' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
    document.getElementById('login-tab').classList.toggle('active', tab === 'login');
    document.getElementById('register-tab').classList.toggle('active', tab === 'register');
};

window.continueAsGuest = function() {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('kisan_user', JSON.stringify({ user_id: guestId, username: '', name: 'Guest', isGuest: true }));
    window.navigateTo('chat');
};

export function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('kisan_user')); } catch { return null; }
}

export function attachAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (loginForm) {
        document.getElementById('login-submit-btn').onclick = async () => {
            const u = document.getElementById('login-username').value.trim();
            const p = document.getElementById('login-password').value;
            const errEl = document.getElementById('login-error');
            errEl.style.display = 'none';
            if (!u || !p) { errEl.textContent = 'Fill all fields'; errEl.style.display = 'block'; return; }
            try {
                const res = await fetch(`${API}/api/login/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
                const data = await res.json();
                if (data.status === 'success') {
                    localStorage.setItem('kisan_user', JSON.stringify({ user_id: data.user_id, username: data.username, name: data.name, isGuest: false }));
                    window.navigateTo('chat');
                } else { errEl.textContent = data.error || 'Login failed'; errEl.style.display = 'block'; }
            } catch { errEl.textContent = 'Connection error'; errEl.style.display = 'block'; }
        };
    }
    if (registerForm) {
        document.getElementById('register-submit-btn').onclick = async () => {
            const name = document.getElementById('register-name').value.trim();
            const u = document.getElementById('register-username').value.trim();
            const p = document.getElementById('register-password').value;
            const errEl = document.getElementById('register-error');
            const sucEl = document.getElementById('register-success');
            errEl.style.display = 'none'; sucEl.style.display = 'none';
            if (!u || !p) { errEl.textContent = 'Fill all fields'; errEl.style.display = 'block'; return; }
            try {
                const res = await fetch(`${API}/api/register/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p, name: name }) });
                const data = await res.json();
                if (data.status === 'success') {
                    sucEl.textContent = 'Account created! You can now login.'; sucEl.style.display = 'block';
                    setTimeout(() => window.switchAuthTab('login'), 1500);
                } else { errEl.textContent = data.error || 'Registration failed'; errEl.style.display = 'block'; }
            } catch { errEl.textContent = 'Connection error'; errEl.style.display = 'block'; }
        };
    }
}

// ── Profile ──
let _cachedProfile = null;

export async function attachProfileListeners(userId) {
    if (!userId) return;

    const displayCard = document.getElementById('profile-display');
    const formContainer = document.getElementById('profile-form-container');
    const editBtn = document.getElementById('profile-edit-btn');
    const cancelBtn = document.getElementById('profile-cancel-btn');

    // Load existing profile
    try {
        const res = await fetch(`${API}/api/farm-profile/?user_id=${userId}`);
        const data = await res.json();
        if (data.profile && hasProfileData(data.profile)) {
            _cachedProfile = data.profile;
            showProfileDisplay(data.profile);
            showDisplayMode();
        } else {
            showFormMode(false);
        }
    } catch (e) {
        console.error('Load profile error:', e);
        showFormMode(false);
    }

    // Edit button - switch to form mode
    if (editBtn) {
        editBtn.onclick = () => {
            if (_cachedProfile) fillFormFromProfile(_cachedProfile);
            showFormMode(true);
        };
    }

    // Cancel button - switch back to display mode
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            if (_cachedProfile && hasProfileData(_cachedProfile)) {
                showDisplayMode();
            }
        };
    }

    // Save handler
    const saveBtn = document.getElementById('profile-save-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const crops = [];
            document.querySelectorAll('#crop-checkboxes input:checked').forEach(cb => crops.push(cb.value));
            const body = {
                user_id: userId,
                farmer_name: document.getElementById('farmer-name')?.value || '',
                district: document.getElementById('farm-district')?.value || '',
                village: document.getElementById('farm-village')?.value || '',
                farm_size: parseFloat(document.getElementById('farm-size')?.value) || null,
                primary_crops: crops,
                soil_type: document.getElementById('soil-type')?.value || '',
                irrigation_source: document.getElementById('irrigation-source')?.value || '',
            };
            const msgEl = document.getElementById('profile-message');
            try {
                const res = await fetch(`${API}/api/farm-profile/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                const data = await res.json();
                if (data.status === 'success') {
                    _cachedProfile = data.profile;
                    msgEl.textContent = '✅ Profile saved successfully!'; msgEl.className = 'profile-message success'; msgEl.style.display = 'block';
                    setTimeout(() => {
                        msgEl.style.display = 'none';
                        showProfileDisplay(data.profile);
                        showDisplayMode();
                    }, 1200);
                }
            } catch { msgEl.textContent = '❌ Failed to save profile'; msgEl.className = 'profile-message error'; msgEl.style.display = 'block'; }
        };
    }

    function showDisplayMode() {
        if (displayCard) displayCard.style.display = 'block';
        if (formContainer) formContainer.style.display = 'none';
    }

    function showFormMode(isEditing) {
        if (displayCard) displayCard.style.display = 'none';
        if (formContainer) formContainer.style.display = 'block';
        const cancelBtnEl = document.getElementById('profile-cancel-btn');
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        if (cancelBtnEl) cancelBtnEl.style.display = isEditing ? 'inline-flex' : 'none';
        if (formTitle) formTitle.textContent = isEditing ? 'Edit Farm Profile' : 'My Farm Profile';
        if (formSubtitle) formSubtitle.textContent = isEditing ? 'Update your farm details below' : 'Help us give you personalized farming advice';
    }
}

function hasProfileData(p) {
    return p && (p.farmer_name || p.district || p.village || p.farm_size || (p.primary_crops && p.primary_crops.length) || p.soil_type || p.irrigation_source);
}

function fillFormFromProfile(p) {
    const el = (id) => document.getElementById(id);
    if (el('farmer-name')) el('farmer-name').value = p.farmer_name || '';
    if (el('farm-district')) el('farm-district').value = p.district || '';
    if (el('farm-village')) el('farm-village').value = p.village || '';
    if (el('farm-size')) el('farm-size').value = p.farm_size || '';
    if (el('soil-type')) el('soil-type').value = p.soil_type || '';
    if (el('irrigation-source')) el('irrigation-source').value = p.irrigation_source || '';
    if (p.primary_crops && Array.isArray(p.primary_crops)) {
        document.querySelectorAll('#crop-checkboxes input[type=checkbox]').forEach(cb => {
            cb.checked = p.primary_crops.includes(cb.value);
        });
    }
}

function showProfileDisplay(p) {
    const grid = document.getElementById('profile-details-grid');
    if (!grid) return;

    const soilLabels = { alluvial: 'Alluvial (जलोढ़)', clay: 'Clay (चिकनी मिट्टी)', sandy: 'Sandy (बालू मिट्टी)', loamy: 'Loamy (दोमट)', red: 'Red (लाल मिट्टी)', black: 'Black (काली मिट्टी)' };
    const irrigationLabels = { canal: 'Canal (नहर)', tubewell: 'Tube Well (बोरिंग)', pond: 'Pond (तालाब)', rainfed: 'Rainfed (वर्षा आधारित)', river: 'River (नदी)', well: 'Open Well (कुआं)' };

    const items = [
        { icon: '👨‍🌾', label: 'Farmer Name', value: p.farmer_name },
        { icon: '📍', label: 'District', value: p.district },
        { icon: '🏠', label: 'Village', value: p.village },
        { icon: '📐', label: 'Farm Size', value: p.farm_size ? `${p.farm_size} Bigha` : '' },
        { icon: '🏔️', label: 'Soil Type', value: soilLabels[p.soil_type] || p.soil_type },
        { icon: '💧', label: 'Irrigation', value: irrigationLabels[p.irrigation_source] || p.irrigation_source },
    ].filter(item => item.value);

    const cropEmojiMap = { Rice: '🌾', Wheat: '🌾', Maize: '🌽', Pulses: '🫘', Sugarcane: '🎍', Potato: '🥔', Onion: '🧅', Tomato: '🍅', Vegetables: '🥬', Mustard: '🌻', Banana: '🍌', Mango: '🥭' };
    const crops = p.primary_crops || [];

    let html = items.map(item => `
        <div class="profile-detail-item">
            <span class="profile-detail-label">${item.icon} ${item.label}</span>
            <span class="profile-detail-value">${item.value}</span>
        </div>
    `).join('');

    if (crops.length > 0) {
        html += `
            <div class="profile-detail-item full-width">
                <span class="profile-detail-label">🌾 Primary Crops</span>
                <span class="profile-detail-value">
                    ${crops.map(c => `<span class="crop-tag">${cropEmojiMap[c] || '🌱'} ${c}</span>`).join('')}
                </span>
            </div>
        `;
    }

    grid.innerHTML = html;
}

// ── Weather ──
export function attachWeatherListeners(userId) {
    const btn = document.getElementById('fetch-weather-btn');
    if (!btn) return;
    btn.onclick = () => fetchWeather(userId);
    // Auto-load if profile has district
    const stored = getStoredUser();
    if (stored && !stored.isGuest) {
        fetch(`${API}/api/farm-profile/?user_id=${userId}`).then(r=>r.json()).then(data => {
            if (data.profile?.district) {
                document.getElementById('weather-district-select').value = data.profile.district;
                fetchWeather(userId);
            }
        }).catch(()=>{});
    }
}

async function fetchWeather(userId) {
    const district = document.getElementById('weather-district-select')?.value;
    if (!district) { alert('Please select a district'); return; }
    const loading = document.getElementById('weather-loading');
    const content = document.getElementById('weather-content');
    const errEl = document.getElementById('weather-error');
    loading.style.display = 'block'; content.style.display = 'none'; errEl.style.display = 'none';
    try {
        const res = await fetch(`${API}/api/weather/?district=${encodeURIComponent(district)}&user_id=${userId || ''}`);
        const data = await res.json();
        loading.style.display = 'none';
        if (data.error) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
        renderWeather(data); content.style.display = 'block';
    } catch { loading.style.display = 'none'; errEl.textContent = 'Failed to fetch weather'; errEl.style.display = 'block'; }
}

function getWeatherEmoji(code) {
    if (code <= 1) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫️';
    if (code <= 55) return '🌦️'; if (code <= 65) return '🌧️'; if (code <= 75) return '❄️';
    if (code <= 82) return '🌧️'; return '⛈️';
}

function renderWeather(data) {
    const w = data.weather;
    document.getElementById('current-district-name').textContent = w.district;
    document.getElementById('current-temp').textContent = `${w.current.temperature}°C`;
    document.getElementById('current-desc').textContent = w.current.description || '';
    document.getElementById('current-humidity').textContent = `${w.current.humidity || '--'}%`;
    document.getElementById('current-wind').textContent = `${w.current.windspeed || '--'} km/h`;
    document.getElementById('current-emoji').textContent = getWeatherEmoji(w.current.weathercode);
    const list = document.getElementById('forecast-list');
    list.innerHTML = w.forecast.map(d => {
        const date = new Date(d.date); const day = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
        return `<div class="forecast-item"><span class="forecast-day">${day}</span><span class="forecast-emoji">${getWeatherEmoji(d.weathercode)}</span><span class="forecast-desc">${d.description||''}</span><span class="forecast-temp">${d.temp_min}°–${d.temp_max}°</span><span class="forecast-rain">💧${d.precipitation||0}mm</span></div>`;
    }).join('');
    const advisory = document.getElementById('advisory-content');
    advisory.innerHTML = window.marked ? window.marked.parse(data.advisory || '') : data.advisory || '';
}

// ── Mandi ──
export function attachMandiListeners() {
    const btn = document.getElementById('fetch-mandi-btn');
    if (!btn) return;
    btn.onclick = fetchMandi;
    fetchMandi(); // auto-load
}

async function fetchMandi() {
    const commodity = document.getElementById('mandi-commodity-select')?.value || '';
    const district = document.getElementById('mandi-district-select')?.value || '';
    const loading = document.getElementById('mandi-loading');
    const content = document.getElementById('mandi-content');
    const errEl = document.getElementById('mandi-error');
    loading.style.display = 'block'; content.style.display = 'none'; errEl.style.display = 'none';
    try {
        const res = await fetch(`${API}/api/mandi-prices/?commodity=${encodeURIComponent(commodity)}&district=${encodeURIComponent(district)}`);
        const data = await res.json();
        loading.style.display = 'none';
        if (data.error && !data.records?.length) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
        renderMandi(data); content.style.display = 'block';
    } catch { loading.style.display = 'none'; errEl.textContent = 'Failed to fetch mandi prices'; errEl.style.display = 'block'; }
}

function renderMandi(data) {
    const records = data.records || [];
    document.getElementById('mandi-meta').textContent = `${records.length} records`;
    const stats = document.getElementById('mandi-stats-row');
    if (records.length > 0) {
        const prices = records.map(r => parseInt(r.modal_price)).filter(p => !isNaN(p));
        const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
        const max = prices.length ? Math.max(...prices) : 0;
        const commodities = new Set(records.map(r => r.commodity));
        stats.innerHTML = `
            <div class="mandi-stat-card"><div class="mandi-stat-value">${records.length}</div><div class="mandi-stat-label">Total Records</div></div>
            <div class="mandi-stat-card"><div class="mandi-stat-value">${commodities.size}</div><div class="mandi-stat-label">Commodities</div></div>
            <div class="mandi-stat-card"><div class="mandi-stat-value">₹${avg}</div><div class="mandi-stat-label">Avg Modal Price</div></div>
            <div class="mandi-stat-card"><div class="mandi-stat-value">₹${max}</div><div class="mandi-stat-label">Highest Price</div></div>`;
    }
    const tbody = document.getElementById('mandi-table-body');
    tbody.innerHTML = records.map(r => `<tr><td>${r.commodity}</td><td>${r.variety||'-'}</td><td>${r.market||'-'}</td><td>${r.district}</td><td class="price-cell">₹${r.min_price}</td><td class="price-cell">₹${r.max_price}</td><td><span class="modal-price">₹${r.modal_price}</span></td><td>${r.arrival_date||'-'}</td></tr>`).join('');
    const note = document.getElementById('mandi-note');
    const noteText = document.getElementById('mandi-note-text');
    if (data.note) { noteText.textContent = data.note; note.style.display = 'block'; } else { note.style.display = 'none'; }
}

// ── Disease Detection ──
export function attachDiseaseListener(userId, appendMsgFn, removeMsgFn) {
    const input = document.getElementById('disease-image-input');
    if (!input) return;
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const user = getStoredUser();
        const uid = user?.user_id || userId;

        // Read current language and voice mode from chat controls
        const langToggle = document.getElementById('lang-toggle');
        const voiceModeToggle = document.getElementById('voice-mode-toggle');
        const currentLang = langToggle ? langToggle.value : 'en';
        const currentMode = voiceModeToggle && voiceModeToggle.checked ? 'voice' : 'text';

        console.log('[Disease Detection] Sending with language:', currentLang, 'mode:', currentMode);

        const typingId = appendMsgFn('🔬 Analyzing crop image...', 'ai', true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('user_id', uid);
        formData.append('provider', 'gemini');
        formData.append('language', currentLang);
        formData.append('mode', currentMode);
        try {
            const res = await fetch(`${API}/api/detect-disease/`, { method: 'POST', body: formData });
            const data = await res.json();
            removeMsgFn(typingId);
            if (data.status === 'success') {
                const imgUrl = data.image_url || '';
                let html = '';
                if (imgUrl) html += `<img src="${imgUrl}" class="disease-image-preview" alt="Uploaded crop image">`;
                html += `<div class="disease-header"><span class="disease-name">🌿 ${data.disease}</span><span class="disease-confidence">${data.confidence}% confidence</span></div>`;
                if (data.treatment) html += `<div>${window.marked ? window.marked.parse(data.treatment) : data.treatment}</div>`;
                // Pass audio_url if voice mode generated audio
                const audioUrl = data.audio_url || null;
                appendMsgFn(html, 'ai', false, audioUrl, true);
            } else {
                appendMsgFn('❌ Disease detection failed: ' + (data.error || 'Unknown error'), 'ai');
            }
        } catch { removeMsgFn(typingId); appendMsgFn('Connection error during disease detection.', 'ai'); }
        input.value = '';
    };
}

// ── Chat History (server-side) ──
export async function loadServerChatHistory(userId, appendMsgFn) {
    if (!userId) return;
    try {
        const res = await fetch(`${API}/api/chat-history/?user_id=${userId}&limit=100`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
            const chatEl = document.getElementById('chat-messages');
            if (chatEl) chatEl.innerHTML = '';
            data.messages.forEach(msg => appendMsgFn(msg.content, msg.role === 'user' ? 'user' : 'ai', false, msg.audio_url || null));
        }
    } catch (e) { console.error('Load chat history error:', e); }
}

export async function clearServerChatHistory(userId) {
    try { await fetch(`${API}/api/clear-chat/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) }); } catch {}
}
