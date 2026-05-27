// Kisan_Setu AI - Main Script
import { LandingView } from './components/LandingView.js';
import { ChatView } from './components/ChatView.js';
import { AboutView } from './components/AboutView.js';
import { AuthView } from './components/AuthView.js';
import { ProfileView } from './components/ProfileView.js';
import { WeatherView } from './components/WeatherView.js';
import { MandiView } from './components/MandiView.js';
import { getStoredUser, attachAuthListeners, attachProfileListeners, attachWeatherListeners, attachMandiListeners, attachDiseaseListener, loadServerChatHistory, clearServerChatHistory } from './features.js';

const state = {
    currentView: 'landing',
    user: null,
    recorder: null,
    recognition: null,
    isListening: false,
    interimMessageId: null,
    audioChunks: [],
    currentAudio: null,
    currentAudioId: null,
    playbackRate: 1.0,
    currentTranscript: ''
};

// Initialize user from localStorage or generate guest
function initUser() {
    const stored = getStoredUser();
    if (stored) {
        state.user = { id: stored.user_id, language: 'en', mode: 'text', name: stored.name || '', isGuest: stored.isGuest || false };
    } else {
        state.user = { id: 'guest_' + Math.random().toString(36).substr(2, 9), language: 'en', mode: 'text', name: 'Guest', isGuest: true };
    }
}
initUser();

const appRoot = document.getElementById('app-root');

if (window.marked) {
    window.marked.setOptions({ gfm: true, breaks: true, smartLists: true, smartypants: true, headerIds: false });
}

// Router
function navigateTo(view) {
    // Require auth for protected views
    if (['profile', 'weather', 'mandi'].includes(view) && state.user.isGuest) {
        navigateTo('auth');
        return;
    }
    state.currentView = view;
    render();
    window.scrollTo(0, 0);
}
window.navigateTo = navigateTo;

function render() {
    let content = '';
    switch(state.currentView) {
        case 'landing': content = LandingView(); break;
        case 'chat': content = ChatView(); break;
        case 'about': content = AboutView(); break;
        case 'auth': content = AuthView(); break;
        case 'profile': content = ProfileView(); break;
        case 'weather': content = WeatherView(); break;
        case 'mandi': content = MandiView(); break;
        default: content = LandingView();
    }
    appRoot.innerHTML = content;
    if (window.lucide) window.lucide.createIcons();
    attachListeners();
    updateNavbar();
}

function updateNavbar() {
    const authBtn = document.getElementById('nav-auth-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (!authBtn) return;
    const stored = getStoredUser();
    if (stored && !stored.isGuest) {
        authBtn.textContent = stored.name || stored.username || 'Profile';
        authBtn.onclick = () => navigateTo('profile');
        if (logoutBtn) { logoutBtn.style.display = 'inline-flex'; }
    } else {
        authBtn.textContent = 'Login';
        authBtn.onclick = () => navigateTo('auth');
        if (logoutBtn) { logoutBtn.style.display = 'none'; }
    }
}

window.handleLogout = function() {
    localStorage.removeItem('kisan_user');
    initUser();
    navigateTo('landing');
};

function attachListeners() {
    if (state.currentView === 'auth') {
        attachAuthListeners();
    }
    if (state.currentView === 'profile') {
        initUser();
        attachProfileListeners(state.user.id);
    }
    if (state.currentView === 'weather') {
        attachWeatherListeners(state.user.id);
    }
    if (state.currentView === 'mandi') {
        attachMandiListeners();
    }
    if (state.currentView === 'chat') {
        initUser(); // refresh user
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const langToggle = document.getElementById('lang-toggle');
        const voiceModeToggle = document.getElementById('voice-mode-toggle');
        const voiceInputBtn = document.getElementById('voice-input-btn');
        const voiceStopBtn = document.getElementById('voice-stop-btn');
        const clearChatBtn = document.getElementById('clear-chat-btn');

        if (sendBtn && input) {
            sendBtn.onclick = () => handleSendMessage();
            input.onkeypress = (e) => { if (e.key === 'Enter') handleSendMessage(); };
        }
        if (langToggle) {
            langToggle.value = state.user.language;
            langToggle.onchange = (e) => { state.user.language = e.target.value; appendMessage(`Language changed to ${e.target.options[e.target.selectedIndex].text}`, 'ai', true); };
        }
        if (voiceModeToggle) {
            voiceModeToggle.checked = state.user.mode === 'voice';
            voiceModeToggle.onchange = (e) => { state.user.mode = e.target.checked ? 'voice' : 'text'; appendMessage(`Voice Response ${state.user.mode === 'voice' ? 'Enabled' : 'Disabled'}`, 'ai', true); };
        }
        if (voiceInputBtn) voiceInputBtn.onclick = () => toggleRecording();
        if (voiceStopBtn) voiceStopBtn.onclick = () => stopVoicePlayback();
        if (clearChatBtn) {
            clearChatBtn.onclick = () => {
                if (confirm('Clear all chat history?')) {
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) { chatMessages.innerHTML = ''; appendMessage('Namaste! I am your Kisan_Setu assistant. How can I help you today?', 'ai', true); }
                    clearServerChatHistory(state.user.id);
                    localStorage.removeItem('chat_history_' + state.user.id);
                    stopVoicePlayback();
                }
            };
        }
        // Disease image upload
        attachDiseaseListener(state.user.id, appendMessage, removeMessage);
        // Load server-side chat history
        if (!state.user.isGuest) {
            loadServerChatHistory(state.user.id, appendMessage);
        } else {
            loadLocalChatHistory();
        }
    }
}

// ── Speech Recognition ──
function getSpeechRecognitionLanguage(lang) {
    switch (lang) { case 'hi': return 'hi-IN'; case 'bho': return 'en-IN'; default: return 'en-US'; }
}
function createSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = getSpeechRecognitionLanguage(state.user.language);
    r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    r.onresult = handleSpeechResult; r.onerror = handleSpeechError; r.onend = handleSpeechEnd;
    return r;
}
function toggleRecording() {
    const btn = document.getElementById('voice-input-btn');
    if (state.isListening) { 
        stopRecording(); 
        return; 
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { startLegacyRecorder(); return; }
    state.recognition = createSpeechRecognition();
    if (!state.recognition) { startLegacyRecorder(); return; }
    try { 
        state.recognition.start(); 
        state.isListening = true; 
        btn.classList.add('recording'); 
        btn.style.background = 'var(--error)'; 
        state.interimMessageId = appendMessage('Listening... Speak now.', 'ai', true);
    } catch { 
        appendMessage('Speech recognition not available.', 'ai'); 
        startLegacyRecorder(); 
    }
}
function startLegacyRecorder() {
    const btn = document.getElementById('voice-input-btn');
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        state.recorder = new MediaRecorder(stream); 
        state.audioChunks = [];
        state.recorder.ondataavailable = (e) => state.audioChunks.push(e.data);
        state.recorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            handleVoiceUpload();
        };
        state.recorder.start(); 
        state.isListening = true;
        btn.classList.add('recording'); 
        btn.style.background = 'var(--error)';
        state.interimMessageId = appendMessage('Listening... Click mic again to stop.', 'ai', true);
    }).catch(err => { 
        console.error('Mic error:', err);
        appendMessage('Error: Allow microphone access.', 'ai'); 
        resetVoiceButton(); 
    });
}
function stopRecording() {
    state.isListening = false; 
    resetVoiceButton();
    if (state.recognition) {
        state.recognition.stop();
        // Do NOT remove interim message here, let handleSpeechEnd/Result do it!
    } else if (state.recorder && state.recorder.state === 'recording') {
        state.recorder.stop();
        if (state.interimMessageId) { 
            removeMessage(state.interimMessageId); 
            state.interimMessageId = null; 
        }
    }
}
function resetVoiceButton() {
    const btn = document.getElementById('voice-input-btn');
    if (btn) { btn.classList.remove('recording'); btn.style.background = ''; }
}
function handleSpeechResult(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
    state.currentTranscript = transcript;
    
    if (!event.results[event.results.length - 1].isFinal) {
        if (state.interimMessageId) { const el = document.getElementById(state.interimMessageId)?.querySelector('.msg-text'); if (el) el.textContent = `Listening... ${transcript}`; }
        return;
    }
    
    finishSpeechRecognition(transcript);
}
function handleSpeechError() { appendMessage('Speech recognition error.', 'ai'); stopRecording(); }
function handleSpeechEnd() { 
    if (state.isListening) { 
        state.isListening = false; 
        resetVoiceButton(); 
    }
    if (state.currentTranscript && state.interimMessageId) {
        finishSpeechRecognition(state.currentTranscript);
    } else if (state.interimMessageId) {
        removeMessage(state.interimMessageId);
        state.interimMessageId = null;
    }
}
function finishSpeechRecognition(transcript) {
    state.isListening = false; 
    resetVoiceButton();
    if (state.interimMessageId) { 
        removeMessage(state.interimMessageId); 
        state.interimMessageId = null; 
    }
    if (transcript && transcript.trim() !== '') {
        appendMessage(transcript, 'user'); 
        sendTextQuery(transcript);
    }
    state.currentTranscript = '';
}

// ── API Calls ──
async function sendTextQuery(message) {
    const typingId = appendMessage('Thinking...', 'ai', true);
    try {
        const response = await fetch('http://localhost:8000/query/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.user.id, text: message, language: state.user.language, mode: state.user.mode }) });
        const data = await response.json();
        removeMessage(typingId);
        if (data.status === 'success') appendMessage(data.response_text, 'ai', false, data.audio_url);
        else appendMessage("Sorry, I'm having trouble connecting.", 'ai');
    } catch { removeMessage(typingId); appendMessage('Connection error. Ensure backend is running.', 'ai'); }
}
async function handleVoiceUpload() {
    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('user_id', state.user.id); formData.append('language', state.user.language); formData.append('mode', state.user.mode);
    const typingId = appendMessage('Processing voice...', 'ai', true);
    try {
        const response = await fetch('http://localhost:8000/query/', { method: 'POST', body: formData });
        const data = await response.json();
        removeMessage(typingId);
        if (data.status === 'success') { appendMessage(data.query, 'user'); appendMessage(data.response_text, 'ai', false, data.audio_url); }
        else appendMessage("Sorry, I couldn't understand that audio.", 'ai');
    } catch { removeMessage(typingId); appendMessage('Connection error.', 'ai'); }
    resetVoiceButton();
}
async function handleSendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    appendMessage(message, 'user'); input.value = '';
    await sendTextQuery(message);
}

// ── Audio ──
function stopVoicePlayback() {
    if (state.currentAudio) {
        state.currentAudio.pause(); state.currentAudio.currentTime = 0;
        if (state.currentAudioId) { const btn = document.querySelector(`[data-audio-id="${state.currentAudioId}"] .audio-play-btn`); if (btn) { btn.classList.remove('playing'); btn.innerHTML = '▶'; } }
        state.currentAudio = null; state.currentAudioId = null;
    }
    const stopBtn = document.getElementById('voice-stop-btn');
    if (stopBtn) stopBtn.style.display = 'none';
}
function createAudioControls(audioUrl, messageId) {
    if (!audioUrl) return '';
    const audioId = `audio_${messageId}`;
    return `<div class="audio-controls" data-audio-id="${audioId}"><button class="audio-btn audio-play-btn" onclick="window.playAudioMessage('${audioId}', '${audioUrl}')" title="Play audio">▶</button><div class="progress-container"><span class="time-display"><span class="current-time">0:00</span> / <span class="total-time">0:00</span></span><input type="range" class="seek-slider" min="0" max="100" value="0" step="0.1" oninput="window.seekAudioBySlider('${audioId}', this.value)"></div><div class="speed-control"><button class="speed-btn" data-speed="0.75" onclick="window.changeSpeed('${audioId}', 0.75)">0.75x</button><button class="speed-btn active" data-speed="1.0" onclick="window.changeSpeed('${audioId}', 1.0)">1x</button><button class="speed-btn" data-speed="1.5" onclick="window.changeSpeed('${audioId}', 1.5)">1.5x</button></div><button class="download-btn" onclick="window.downloadAudio('${audioUrl}')" title="Download">⬇</button></div>`;
}
function formatTime(s) { if (isNaN(s)) return '0:00'; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; }

window.playAudioMessage = function(audioId, audioUrl) {
    const controls = document.querySelector(`[data-audio-id="${audioId}"]`);
    const playBtn = controls.querySelector('.audio-play-btn');
    if (state.currentAudioId === audioId && state.currentAudio && !state.currentAudio.paused) {
        state.currentAudio.pause(); playBtn.classList.remove('playing'); playBtn.innerHTML = '▶';
    } else {
        if (state.currentAudioId && state.currentAudioId !== audioId) {
            const prev = document.querySelector(`[data-audio-id="${state.currentAudioId}"] .audio-play-btn`);
            if (state.currentAudio) state.currentAudio.pause();
            if (prev) { prev.classList.remove('playing'); prev.innerHTML = '▶'; }
        }
        if (!state.currentAudio || state.currentAudioId !== audioId) {
            state.currentAudio = new Audio(audioUrl);
            state.currentAudio.playbackRate = state.playbackRate;
            state.currentAudio.onloadedmetadata = () => { const c = document.querySelector(`[data-audio-id="${audioId}"]`); if(c) c.querySelector('.total-time').textContent = formatTime(state.currentAudio.duration); };
            state.currentAudio.ontimeupdate = () => { const c = document.querySelector(`[data-audio-id="${audioId}"]`); if(c && state.currentAudio.duration) { c.querySelector('.seek-slider').value = (state.currentAudio.currentTime/state.currentAudio.duration)*100; c.querySelector('.current-time').textContent = formatTime(state.currentAudio.currentTime); } };
            state.currentAudio.onended = () => { playBtn.classList.remove('playing'); playBtn.innerHTML = '▶'; state.currentAudio = null; };
            state.currentAudio.onerror = () => { playBtn.classList.remove('playing'); playBtn.innerHTML = '▶'; state.currentAudio = null; state.currentAudioId = null; };
        }
        state.currentAudioId = audioId;
        state.currentAudio.play().catch(e => console.error('Audio play error:', e));
        playBtn.classList.add('playing'); playBtn.innerHTML = '⏸';
    }
    const stopBtn = document.getElementById('voice-stop-btn');
    if (stopBtn && state.currentAudio && !state.currentAudio.paused) stopBtn.style.display = 'inline-flex';
};
window.seekAudioBySlider = function(audioId, value) { if (!state.currentAudio || state.currentAudioId !== audioId || !state.currentAudio.duration) return; state.currentAudio.currentTime = (parseFloat(value)/100)*state.currentAudio.duration; };
window.changeSpeed = function(audioId, speed) { if (!state.currentAudio || state.currentAudioId !== audioId) return; state.playbackRate = parseFloat(speed); state.currentAudio.playbackRate = parseFloat(speed); const c = document.querySelector(`[data-audio-id="${audioId}"]`); c.querySelectorAll('.speed-btn').forEach(b=>b.classList.remove('active')); c.querySelector(`.speed-btn[data-speed="${speed}"]`).classList.add('active'); };
window.downloadAudio = function(audioUrl) { const a = document.createElement('a'); a.href = audioUrl; a.download = `kisan_audio_${Date.now()}.mp3`; document.body.appendChild(a); a.click(); document.body.removeChild(a); };

// ── Messages ──
function renderMarkdown(text, sender) {
    if (sender === 'ai' && window.marked) { try { return window.marked.parse(text); } catch {} }
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function appendMessage(text, sender, isTemp = false, audioUrl = null, isHtml = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2,4);
    const msgDiv = document.createElement('div');
    msgDiv.id = id; msgDiv.className = `message message-${sender}`;
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar'; avatarDiv.textContent = sender === 'ai' ? '🤖' : '👤';
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'message-body';
    const textSpan = document.createElement('span');
    textSpan.className = 'msg-text';
    textSpan.innerHTML = isHtml ? text : renderMarkdown(text, sender);
    bodyDiv.appendChild(textSpan);
    if (sender === 'ai' && audioUrl) {
        msgDiv.setAttribute('data-audio-url', audioUrl);
        const aDiv = document.createElement('div');
        aDiv.innerHTML = createAudioControls(audioUrl, id);
        if (aDiv.firstElementChild) bodyDiv.appendChild(aDiv.firstElementChild);
    }
    const metaSpan = document.createElement('span');
    metaSpan.className = 'msg-meta';
    metaSpan.innerHTML = sender === 'ai' ? `AI • <span class="msg-time">Now</span>` : `You • <span class="msg-time">Now</span>`;
    bodyDiv.appendChild(metaSpan);
    msgDiv.appendChild(avatarDiv); msgDiv.appendChild(bodyDiv);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (!isTemp) saveLocalChatHistory();
    return id;
}
function removeMessage(id) { const el = document.getElementById(id); if (el) el.remove(); }

// ── Local chat history (for guests) ──
function saveLocalChatHistory() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const messages = Array.from(chatMessages.children).map(m => ({
        text: m.querySelector('.msg-text')?.textContent || m.innerText,
        sender: m.classList.contains('message-user') ? 'user' : 'ai',
        audioUrl: m.getAttribute('data-audio-url') || null
    }));
    localStorage.setItem('chat_history_' + state.user.id, JSON.stringify(messages));
}
function loadLocalChatHistory() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    const saved = localStorage.getItem('chat_history_' + state.user.id);
    if (saved) {
        chatMessages.innerHTML = '';
        JSON.parse(saved).forEach(msg => appendMessage(msg.text, msg.sender, false, msg.audioUrl));
    }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => { render(); });
