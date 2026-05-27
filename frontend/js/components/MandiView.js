export const MandiView = () => `
    <section class="mandi-section">
        <div class="container">
            <div class="mandi-header-card">
                <div class="mandi-title-row">
                    <div class="mandi-icon-box">
                        <i data-lucide="indian-rupee"></i>
                    </div>
                    <div>
                        <h2>Live Mandi Prices</h2>
                        <p>Real-time agricultural commodity prices from Bihar markets</p>
                    </div>
                </div>
                <div class="mandi-controls">
                    <select id="mandi-commodity-select" class="mandi-select">
                        <option value="">All Commodities</option>
                        <option value="Rice">Rice</option>
                        <option value="Wheat">Wheat</option>
                        <option value="Maize">Maize</option>
                        <option value="Paddy(Dhan)(Common)">Paddy</option>
                        <option value="Onion">Onion</option>
                        <option value="Potato">Potato</option>
                        <option value="Tomato">Tomato</option>
                        <option value="Arhar (Tur/Red Gram)(Whole)">Arhar/Tur Dal</option>
                        <option value="Gram Dal(Chana Dal)">Chana Dal</option>
                        <option value="Masoor Dal">Masoor Dal</option>
                        <option value="Cauliflower">Cauliflower</option>
                        <option value="Banana">Banana</option>
                        <option value="Mango">Mango</option>
                        <option value="Mustard">Mustard</option>
                        <option value="Sugarcane">Sugarcane</option>
                    </select>
                    <select id="mandi-district-select" class="mandi-select">
                        <option value="">All Districts</option>
                        <option value="Patna">Patna</option>
                        <option value="Gaya">Gaya</option>
                        <option value="Muzaffarpur">Muzaffarpur</option>
                        <option value="Bhagalpur">Bhagalpur</option>
                        <option value="Darbhanga">Darbhanga</option>
                        <option value="Nalanda">Nalanda</option>
                        <option value="Vaishali">Vaishali</option>
                        <option value="Begusarai">Begusarai</option>
                        <option value="Samastipur">Samastipur</option>
                        <option value="Purnia">Purnia</option>
                        <option value="Munger">Munger</option>
                        <option value="Rohtas">Rohtas</option>
                        <option value="Saran">Saran</option>
                        <option value="Siwan">Siwan</option>
                        <option value="Gopalganj">Gopalganj</option>
                    </select>
                    <button class="btn btn-primary" id="fetch-mandi-btn">
                        <i data-lucide="refresh-cw" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                        Fetch Prices
                    </button>
                </div>
            </div>

            <div id="mandi-loading" class="mandi-loading" style="display:none;">
                <div class="loading-spinner"></div>
                <p>Fetching latest market prices...</p>
            </div>

            <div id="mandi-error" class="mandi-error-box" style="display:none;"></div>

            <div id="mandi-content" style="display:none;">
                <div class="mandi-stats-row" id="mandi-stats-row">
                    <!-- Filled by JS -->
                </div>

                <div class="mandi-table-card">
                    <div class="mandi-table-header">
                        <h3>Price List</h3>
                        <span class="mandi-meta" id="mandi-meta">-- records</span>
                    </div>
                    <div class="mandi-table-wrapper">
                        <table class="mandi-table">
                            <thead>
                                <tr>
                                    <th>Commodity</th>
                                    <th>Variety</th>
                                    <th>Market</th>
                                    <th>District</th>
                                    <th>Min Price (₹/Q)</th>
                                    <th>Max Price (₹/Q)</th>
                                    <th>Modal Price (₹/Q)</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody id="mandi-table-body">
                                <!-- Filled by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="mandi-note" id="mandi-note" style="display:none;">
                    <i data-lucide="info" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                    <span id="mandi-note-text"></span>
                </div>
            </div>
        </div>
    </section>

    <style>
        .mandi-section {
            padding: 40px 0 80px;
            min-height: calc(100vh - 80px);
            background: linear-gradient(180deg, #f8f9f5 0%, #eef3eb 100%);
        }
        .mandi-header-card {
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
            margin-bottom: 24px;
        }
        .mandi-title-row {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .mandi-icon-box {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: linear-gradient(135deg, #F59E0B, #D97706);
            display: grid;
            place-items: center;
            color: white;
            box-shadow: 0 8px 24px rgba(245,158,11,0.3);
        }
        .mandi-icon-box i { width: 24px; height: 24px; }
        .mandi-title-row h2 { color: var(--primary-dark); margin-bottom: 4px; }
        .mandi-title-row p { color: var(--text-muted); font-size: 0.9rem; }
        .mandi-controls {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }
        .mandi-select {
            padding: 12px 16px;
            border-radius: var(--radius-md);
            border: 1.5px solid rgba(45,90,39,0.15);
            font-size: 0.93rem;
            min-width: 170px;
            background: white;
            outline: none;
            font-family: inherit;
            color: var(--text-main);
        }
        .mandi-select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(45,90,39,0.08);
        }
        .mandi-loading {
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
        .mandi-error-box {
            padding: 16px 20px;
            border-radius: var(--radius-md);
            background: rgba(239,68,68,0.08);
            color: var(--error);
            border: 1px solid rgba(239,68,68,0.15);
            margin-bottom: 20px;
        }
        .mandi-stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .mandi-stat-card {
            background: rgba(255,255,255,0.96);
            border-radius: var(--radius-md);
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(45,90,39,0.08);
            box-shadow: 0 4px 16px rgba(45,90,39,0.05);
        }
        .mandi-stat-value {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--primary-dark);
        }
        .mandi-stat-label {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 4px;
        }
        .mandi-table-card {
            background: rgba(255,255,255,0.96);
            border-radius: var(--radius-lg);
            overflow: hidden;
            border: 1px solid rgba(45,90,39,0.08);
            box-shadow: 0 8px 24px rgba(45,90,39,0.06);
        }
        .mandi-table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid rgba(45,90,39,0.08);
        }
        .mandi-table-header h3 { color: var(--primary-dark); }
        .mandi-meta {
            font-size: 0.85rem;
            color: var(--text-muted);
            background: rgba(45,90,39,0.06);
            padding: 4px 12px;
            border-radius: var(--radius-full);
        }
        .mandi-table-wrapper {
            overflow-x: auto;
        }
        .mandi-table {
            width: 100%;
            border-collapse: collapse;
        }
        .mandi-table th {
            background: rgba(45,90,39,0.06);
            padding: 14px 16px;
            text-align: left;
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--primary-dark);
            white-space: nowrap;
            border-bottom: 2px solid rgba(45,90,39,0.1);
        }
        .mandi-table td {
            padding: 12px 16px;
            font-size: 0.92rem;
            color: var(--text-main);
            border-bottom: 1px solid rgba(45,90,39,0.06);
        }
        .mandi-table tr:hover td {
            background: rgba(45,90,39,0.03);
        }
        .mandi-table .price-cell {
            font-weight: 700;
            color: var(--primary-dark);
        }
        .mandi-table .modal-price {
            background: rgba(45,90,39,0.08);
            padding: 4px 10px;
            border-radius: var(--radius-full);
            font-weight: 700;
            color: var(--primary);
        }
        .mandi-note {
            margin-top: 16px;
            padding: 12px 16px;
            border-radius: var(--radius-md);
            background: rgba(245,158,11,0.08);
            color: #92400E;
            font-size: 0.88rem;
            border: 1px solid rgba(245,158,11,0.15);
        }
        @media (max-width: 820px) {
            .mandi-header-card {
                flex-direction: column;
                align-items: stretch;
            }
            .mandi-controls {
                flex-direction: column;
            }
            .mandi-select { width: 100%; }
        }
    </style>
`;
