export const AuthView = () => `
    <section class="auth-section">
        <div class="container">
            <div class="auth-card">
                <div class="auth-header">
                    <div class="auth-logo">
                        <i data-lucide="sprout"></i>
                    </div>
                    <h2>Welcome to Kisan_Setu AI</h2>
                    <p>Sign in to save your farm profile, chat history, and get personalized advice</p>
                </div>

                <div class="auth-tabs">
                    <button class="auth-tab active" id="login-tab" onclick="window.switchAuthTab('login')">Login</button>
                    <button class="auth-tab" id="register-tab" onclick="window.switchAuthTab('register')">Register</button>
                </div>

                <!-- Login Form -->
                <form id="login-form" class="auth-form" onsubmit="return false;">
                    <div class="form-group">
                        <label for="login-username">
                            <i data-lucide="user" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                            Username
                        </label>
                        <input type="text" id="login-username" placeholder="Enter your username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="login-password">
                            <i data-lucide="lock" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                            Password
                        </label>
                        <input type="password" id="login-password" placeholder="Enter your password" required autocomplete="current-password">
                    </div>
                    <div id="login-error" class="auth-error" style="display:none;"></div>
                    <button type="submit" class="btn btn-primary auth-submit" id="login-submit-btn">
                        Sign In
                    </button>
                </form>

                <!-- Register Form -->
                <form id="register-form" class="auth-form" style="display:none;" onsubmit="return false;">
                    <div class="form-group">
                        <label for="register-name">
                            <i data-lucide="user-check" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                            Full Name
                        </label>
                        <input type="text" id="register-name" placeholder="Enter your full name" required>
                    </div>
                    <div class="form-group">
                        <label for="register-username">
                            <i data-lucide="at-sign" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                            Username
                        </label>
                        <input type="text" id="register-username" placeholder="Choose a username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="register-password">
                            <i data-lucide="lock" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i>
                            Password
                        </label>
                        <input type="password" id="register-password" placeholder="Choose a password (min 4 chars)" required autocomplete="new-password">
                    </div>
                    <div id="register-error" class="auth-error" style="display:none;"></div>
                    <div id="register-success" class="auth-success" style="display:none;"></div>
                    <button type="submit" class="btn btn-primary auth-submit" id="register-submit-btn">
                        Create Account
                    </button>
                </form>

                <div class="auth-footer">
                    <button class="btn btn-outline guest-btn" onclick="window.continueAsGuest()">
                        Continue as Guest
                    </button>
                    <p class="auth-note">Guest mode has limited features</p>
                </div>
            </div>
        </div>
    </section>

    <style>
        .auth-section {
            min-height: calc(100vh - 80px);
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f8f9f5 0%, #e8eee4 50%, #f0f4ec 100%);
            padding: 40px 20px;
        }
        .auth-card {
            width: 100%;
            max-width: 460px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: var(--radius-lg);
            box-shadow: 0 20px 60px rgba(45, 90, 39, 0.12), 0 4px 20px rgba(0,0,0,0.06);
            padding: 40px 36px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(45, 90, 39, 0.08);
            animation: slideUp 0.5s ease;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .auth-header {
            text-align: center;
            margin-bottom: 28px;
        }
        .auth-logo {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            display: grid;
            place-items: center;
            margin: 0 auto 16px;
            color: white;
            box-shadow: 0 12px 32px rgba(45, 90, 39, 0.25);
        }
        .auth-logo i { width: 32px; height: 32px; }
        .auth-header h2 {
            font-size: 1.6rem;
            color: var(--primary-dark);
            margin-bottom: 8px;
        }
        .auth-header p {
            color: var(--text-muted);
            font-size: 0.92rem;
            line-height: 1.5;
        }
        .auth-tabs {
            display: flex;
            gap: 0;
            margin-bottom: 24px;
            background: rgba(45, 90, 39, 0.06);
            border-radius: var(--radius-md);
            padding: 4px;
        }
        .auth-tab {
            flex: 1;
            padding: 12px;
            border-radius: calc(var(--radius-md) - 2px);
            background: transparent;
            color: var(--text-muted);
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.25s ease;
        }
        .auth-tab.active {
            background: white;
            color: var(--primary-dark);
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .form-group label {
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--primary-dark);
            display: flex;
            align-items: center;
        }
        .form-group input {
            padding: 14px 16px;
            border-radius: var(--radius-md);
            border: 1.5px solid rgba(45, 90, 39, 0.15);
            font-size: 1rem;
            color: var(--text-main);
            background: rgba(248, 249, 245, 0.8);
            outline: none;
            transition: all 0.2s ease;
            font-family: inherit;
        }
        .form-group input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(45, 90, 39, 0.08);
            background: white;
        }
        .form-group input::placeholder {
            color: #aab5a7;
        }
        .auth-error {
            padding: 10px 14px;
            border-radius: var(--radius-sm);
            background: rgba(239, 68, 68, 0.08);
            color: var(--error);
            font-size: 0.88rem;
            border: 1px solid rgba(239, 68, 68, 0.15);
        }
        .auth-success {
            padding: 10px 14px;
            border-radius: var(--radius-sm);
            background: rgba(16, 185, 129, 0.08);
            color: var(--success);
            font-size: 0.88rem;
            border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .auth-submit {
            width: 100%;
            padding: 15px;
            font-size: 1rem;
            margin-top: 4px;
            border-radius: var(--radius-md);
        }
        .auth-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .auth-footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid rgba(45, 90, 39, 0.08);
            text-align: center;
        }
        .guest-btn {
            width: 100%;
            padding: 12px;
            font-size: 0.95rem;
        }
        .auth-note {
            margin-top: 10px;
            font-size: 0.82rem;
            color: var(--text-muted);
        }
        @media (max-width: 520px) {
            .auth-card {
                padding: 28px 20px;
            }
            .auth-header h2 {
                font-size: 1.35rem;
            }
        }
    </style>
`;
