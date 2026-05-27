export const AboutView = () => `
    <div class="container" style="padding: 60px 20px;">
        <div style="max-width: 800px; margin: 0 auto; text-align: center;">
            <h1 style="font-size: 3rem; margin-bottom: 20px; color: var(--primary);">About Kisan_Setu AI</h1>
            <p style="font-size: 1.25rem; color: var(--text-muted); margin-bottom: 40px;">
                Connecting farmers with cutting-edge AI technology to solve real-world agricultural challenges.
            </p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; align-items: center;">
            <div>
                <h2 style="margin-bottom: 20px;">Our Mission</h2>
                <p style="margin-bottom: 20px;">Our mission is to bridge the information gap for small-scale farmers in Bihar. By providing instant, accurate, and easy-to-understand guidance on crops, weather, and market prices, we aim to increase farm productivity and farmer income.</p>
                <h2 style="margin-bottom: 20px;">Our Vision</h2>
                <p>We envision a future where every farmer has a digital expert in their pocket, ensuring food security and sustainable agricultural practices across the nation.</p>
            </div>
            <div style="background: var(--accent-light); padding: 40px; border-radius: var(--radius-lg);">
                <h3 style="margin-bottom: 20px; color: var(--primary);">The Team</h3>
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/assets/priyanshu.png" alt="Priyanshu Kumar" style="width: 50px;f height: 50px; border-radius: 50%; object-fit: cover;" />
                        <div>
                            <div style="font-weight: 600;">Priyanshu Kumar</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">NLP Engine & Backend integration</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/assets/chhotu.png" alt="Chhotu Kumar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />
                        <div>
                            <div style="font-weight: 600;">Chhotu Kumar</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Agricultural Knowledge Base & Data</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/assets/badshah.png" alt="Badshah Kumar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />
                        <div>
                            <div style="font-weight: 600;">Badshah Kumar</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">UI/UX Designer</div>
                        </div>    
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/assets/aditya.png" alt="Aditya Prakash" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />
                        <div>
                            <div style="font-weight: 600;">Aditya Prakash</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Multilingual Voice Interface</div>
                        </div>    
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
