export const WeatherView = () => `
    <section class="weather-section">
        <div class="container">
            <div class="weather-header-card">
                <div class="weather-title-row">
                    <div class="weather-icon-box">
                        <i data-lucide="cloud-sun"></i>
                    </div>
                    <div>
                        <h2>Weather & Farming Advisory</h2>
                        <p>Real-time weather data with AI-powered farming recommendations</p>
                    </div>
                </div>
                <div class="weather-controls">
                    <select id="weather-district-select" class="weather-select">
                        <option value="">Select District</option>
                        <option value="Araria">Araria</option>
                        <option value="Arwal">Arwal</option>
                        <option value="Aurangabad">Aurangabad</option>
                        <option value="Banka">Banka</option>
                        <option value="Begusarai">Begusarai</option>
                        <option value="Bhagalpur">Bhagalpur</option>
                        <option value="Bhojpur">Bhojpur</option>
                        <option value="Buxar">Buxar</option>
                        <option value="Darbhanga">Darbhanga</option>
                        <option value="East Champaran">East Champaran</option>
                        <option value="Gaya">Gaya</option>
                        <option value="Gopalganj">Gopalganj</option>
                        <option value="Jamui">Jamui</option>
                        <option value="Jehanabad">Jehanabad</option>
                        <option value="Kaimur">Kaimur</option>
                        <option value="Katihar">Katihar</option>
                        <option value="Khagaria">Khagaria</option>
                        <option value="Kishanganj">Kishanganj</option>
                        <option value="Lakhisarai">Lakhisarai</option>
                        <option value="Madhepura">Madhepura</option>
                        <option value="Madhubani">Madhubani</option>
                        <option value="Munger">Munger</option>
                        <option value="Muzaffarpur">Muzaffarpur</option>
                        <option value="Nalanda">Nalanda</option>
                        <option value="Nawada">Nawada</option>
                        <option value="Patna">Patna</option>
                        <option value="Purnia">Purnia</option>
                        <option value="Rohtas">Rohtas</option>
                        <option value="Saharsa">Saharsa</option>
                        <option value="Samastipur">Samastipur</option>
                        <option value="Saran">Saran</option>
                        <option value="Sheikhpura">Sheikhpura</option>
                        <option value="Sheohar">Sheohar</option>
                        <option value="Sitamarhi">Sitamarhi</option>
                        <option value="Siwan">Siwan</option>
                        <option value="Supaul">Supaul</option>
                        <option value="Vaishali">Vaishali</option>
                        <option value="West Champaran">West Champaran</option>
                    </select>
                    <button class="btn btn-primary" id="fetch-weather-btn">
                        <i data-lucide="refresh-cw" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                        Get Weather
                    </button>
                </div>
            </div>

            <div id="weather-loading" class="weather-loading" style="display:none;">
                <div class="loading-spinner"></div>
                <p>Fetching weather data & generating advisory...</p>
            </div>

            <div id="weather-error" class="weather-error" style="display:none;"></div>

            <div id="weather-content" style="display:none;">
                <div class="weather-grid">
                    <div class="current-weather-card">
                        <h3 id="current-district-name">--</h3>
                        <div class="current-temp-row">
                            <span class="current-weather-emoji" id="current-emoji">☀️</span>
                            <span class="current-temp" id="current-temp">--°C</span>
                        </div>
                        <span class="current-desc" id="current-desc">--</span>
                        <div class="weather-stats">
                            <div class="weather-stat">
                                <span class="stat-icon">💧</span>
                                <div><span class="stat-val" id="current-humidity">--%</span><span class="stat-label">Humidity</span></div>
                            </div>
                            <div class="weather-stat">
                                <span class="stat-icon">💨</span>
                                <div><span class="stat-val" id="current-wind">-- km/h</span><span class="stat-label">Wind</span></div>
                            </div>
                        </div>
                    </div>

                    <div class="forecast-card">
                        <h3>7-Day Forecast</h3>
                        <div class="forecast-list" id="forecast-list">
                            <!-- Filled by JS -->
                        </div>
                    </div>
                </div>

                <div class="advisory-card">
                    <div class="advisory-header">
                        <div class="advisory-icon">
                            <i data-lucide="bot"></i>
                        </div>
                        <div>
                            <h3>AI Farming Advisory</h3>
                            <p>Personalized recommendations based on current weather</p>
                        </div>
                    </div>
                    <div class="advisory-content" id="advisory-content">
                        <!-- Filled by JS -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <style>
        .weather-section {
            padding: 40px 0 80px;
            min-height: calc(100vh - 80px);
            background: linear-gradient(180deg, #f8f9f5 0%, #e4ecdf 100%);
        }
        .weather-header-card {
            background: rgba(255,255,255,0.96);
            border-radius: var(--radius-lg);
            padding: 28px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
            box-shadow: 0 8px 32px rgba(45,90,39,0.08);
            border: 1px solid rgba(45,90,39,0.08);
            margin-bottom: 28px;
        }
        .weather-title-row {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .weather-icon-box {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: linear-gradient(135deg, #4FACFE, #00D2FF);
            display: grid;
            place-items: center;
            color: white;
            box-shadow: 0 8px 24px rgba(79,172,254,0.3);
        }
        .weather-icon-box i { width: 24px; height: 24px; }
        .weather-title-row h2 { color: var(--primary-dark); margin-bottom: 4px; }
        .weather-title-row p { color: var(--text-muted); font-size: 0.9rem; }
        .weather-controls {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .weather-select {
            padding: 12px 16px;
            border-radius: var(--radius-md);
            border: 1.5px solid rgba(45,90,39,0.15);
            font-size: 0.95rem;
            min-width: 200px;
            background: white;
            outline: none;
            font-family: inherit;
            color: var(--text-main);
        }
        .weather-select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(45,90,39,0.08);
        }
        .weather-loading {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-muted);
        }
        .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(45,90,39,0.1);
            border-top-color: var(--primary);
            border-radius: 50%;
            margin: 0 auto 16px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .weather-error {
            padding: 16px 20px;
            border-radius: var(--radius-md);
            background: rgba(239,68,68,0.08);
            color: var(--error);
            border: 1px solid rgba(239,68,68,0.15);
            margin-bottom: 20px;
        }
        .weather-grid {
            display: grid;
            grid-template-columns: 340px 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }
        .current-weather-card {
            background: linear-gradient(135deg, #2D5A27, #4A7C44);
            border-radius: var(--radius-lg);
            padding: 32px 28px;
            color: white;
            display: flex;
            flex-direction: column;
            gap: 8px;
            box-shadow: 0 16px 48px rgba(45,90,39,0.2);
        }
        .current-weather-card h3 {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .current-temp-row {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .current-weather-emoji { font-size: 3.5rem; }
        .current-temp { font-size: 3.5rem; font-weight: 800; }
        .current-desc {
            font-size: 1.1rem;
            opacity: 0.85;
        }
        .weather-stats {
            display: flex;
            gap: 20px;
            margin-top: 12px;
        }
        .weather-stat {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.15);
            padding: 10px 14px;
            border-radius: var(--radius-md);
            flex: 1;
        }
        .stat-icon { font-size: 1.2rem; }
        .stat-val { font-weight: 700; font-size: 1rem; display: block; }
        .stat-label { font-size: 0.78rem; opacity: 0.8; }
        .forecast-card {
            background: rgba(255,255,255,0.96);
            border-radius: var(--radius-lg);
            padding: 24px;
            border: 1px solid rgba(45,90,39,0.08);
            box-shadow: 0 8px 24px rgba(45,90,39,0.06);
        }
        .forecast-card h3 {
            color: var(--primary-dark);
            margin-bottom: 16px;
        }
        .forecast-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .forecast-item {
            display: grid;
            grid-template-columns: 100px 40px 1fr 80px 80px;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border-radius: var(--radius-sm);
            background: rgba(45,90,39,0.03);
            transition: background 0.2s;
        }
        .forecast-item:hover { background: rgba(45,90,39,0.07); }
        .forecast-day { font-weight: 600; font-size: 0.9rem; color: var(--primary-dark); }
        .forecast-emoji { font-size: 1.3rem; text-align: center; }
        .forecast-desc { font-size: 0.88rem; color: var(--text-muted); }
        .forecast-temp { font-size: 0.9rem; font-weight: 600; text-align: right; }
        .forecast-rain { font-size: 0.85rem; color: #4FACFE; text-align: right; }
        .advisory-card {
            background: rgba(255,255,255,0.96);
            border-radius: var(--radius-lg);
            padding: 28px 32px;
            border: 1px solid rgba(45,90,39,0.08);
            box-shadow: 0 8px 24px rgba(45,90,39,0.06);
        }
        .advisory-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 20px;
        }
        .advisory-icon {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--accent), #c4884a);
            display: grid;
            place-items: center;
            color: white;
        }
        .advisory-icon i { width: 22px; height: 22px; }
        .advisory-header h3 { color: var(--primary-dark); margin-bottom: 2px; }
        .advisory-header p { color: var(--text-muted); font-size: 0.88rem; }
        .advisory-content {
            line-height: 1.7;
            color: var(--text-main);
            font-size: 0.95rem;
        }
        .advisory-content p { margin-bottom: 8px; }
        .advisory-content ul, .advisory-content ol {
            margin: 8px 0 8px 20px;
        }
        .advisory-content li { margin-bottom: 4px; }
        .advisory-content strong { color: var(--primary-dark); }
        @media (max-width: 820px) {
            .weather-grid {
                grid-template-columns: 1fr;
            }
            .weather-header-card {
                flex-direction: column;
                align-items: stretch;
            }
            .weather-controls {
                flex-direction: column;
            }
            .weather-select { width: 100%; }
            .forecast-item {
                grid-template-columns: 80px 30px 1fr 60px 60px;
                padding: 8px 10px;
            }
        }
        @media (max-width: 560px) {
            .forecast-item {
                grid-template-columns: 60px 28px 1fr;
                gap: 6px;
            }
            .forecast-temp, .forecast-rain {
                display: none;
            }
        }
    </style>
`;
