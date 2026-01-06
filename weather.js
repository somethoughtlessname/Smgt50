// === WEATHER.JS ===
// Standalone Weather Module for SMGT50
// Rewritten for simple, reliable data persistence

const WeatherSystem = {
    
    // === CONFIGURATION ===
    config: {
        enabled: true,
        color: 'green',
        city: '',
        state: '',
        latitude: null,
        longitude: null,
        daysToShow: 7,
        iconStyle: 'symbols'
    },
    
    // === STATE ===
    state: {
        weatherData: null,
        showHourly: false,
        availableStates: []
    },
    
    // === INITIALIZATION ===
    initialize() {
        console.log('🌤️ Weather System: Starting...');
        
        // 1. Register with app
        this.registerWithApp();
        
        // 2. Add styles
        this.injectStyles();
        
        // 3. Load saved settings (do this TWICE - once now, once after delay)
        this.loadFromStorage();
        
        // 4. Wait for app.js to load data, then load again
        setTimeout(() => {
            this.loadFromStorage();
            this.refreshDisplays();
            
            // Fetch weather if we have a location
            if (this.config.city && this.config.state) {
                this.fetchWeather();
            }
        }, 250);
        
        console.log('✅ Weather System: Ready');
    },
    
    // === APP REGISTRATION ===
    registerWithApp() {
        if (typeof window.registerSection === 'function') {
            window.registerSection({
                id: 'weather',
                name: 'Weather',
                visible: this.config.enabled,
                locked: false
            });
        }
        
        window.sectionRenderers = window.sectionRenderers || {};
        window.sectionRenderers['weather'] = () => this.renderWeatherCard();
        
        window.settingsRenderers = window.settingsRenderers || {};
        window.settingsRenderers['weather'] = (section, index, total) => 
            this.renderWeatherSettings(section, index, total);
    },
    
    // === STORAGE ===
    saveToStorage() {
        // Ensure window.moduleSettings exists
        if (!window.moduleSettings) {
            window.moduleSettings = {};
        }
        
        // Save weather config
        window.moduleSettings.weather = {
            enabled: this.config.enabled,
            color: this.config.color,
            city: this.config.city,
            state: this.config.state,
            latitude: this.config.latitude,
            longitude: this.config.longitude,
            daysToShow: this.config.daysToShow,
            iconStyle: this.config.iconStyle
        };
        
        console.log('💾 SAVING:', this.config.city, this.config.state);
        
        // Trigger app save
        if (typeof saveData === 'function') {
            saveData();
        }
    },
    
    loadFromStorage() {
        if (window.moduleSettings && window.moduleSettings.weather) {
            const saved = window.moduleSettings.weather;
            
            this.config.enabled = saved.enabled !== undefined ? saved.enabled : true;
            this.config.color = saved.color || 'green';
            this.config.city = saved.city || '';
            this.config.state = saved.state || '';
            this.config.latitude = saved.latitude || null;
            this.config.longitude = saved.longitude || null;
            this.config.daysToShow = saved.daysToShow || 7;
            this.config.iconStyle = saved.iconStyle || 'symbols';
            
            console.log('📖 LOADED:', this.config.city, this.config.state);
        }
    },
    
    // === DISPLAY REFRESH ===
    refreshDisplays() {
        // Refresh settings panel
        if (typeof SettingsSystem !== 'undefined' && SettingsSystem.renderSettings) {
            setTimeout(() => SettingsSystem.renderSettings(), 10);
        }
        
        // Refresh main window
        if (typeof renderJobs === 'function') {
            renderJobs();
        }
    },
    
    // === STYLES ===
    injectStyles() {
        if (document.getElementById('weather-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'weather-styles';
        style.textContent = `
            /* Weather Card */
            .weather-card {
                background: var(--bg2);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                overflow: hidden;
                margin-bottom: var(--gap);
            }

            .weather-header {
                height: var(--h);
                display: flex;
                align-items: center;
                justify-content: center;
                border-bottom: var(--b) solid var(--border);
                font-size: 13px;
                font-weight: 700;
                position: relative;
            }

            .weather-header-indicator {
                position: absolute;
                right: 10px;
                font-size: 9px;
                opacity: 0.5;
            }

            .weather-header.color-red { background: var(--job-color-red); }
            .weather-header.color-orange { background: var(--job-color-orange); }
            .weather-header.color-gold { background: var(--job-color-gold); }
            .weather-header.color-green { background: var(--job-color-green); }
            .weather-header.color-teal { background: var(--job-color-teal); }
            .weather-header.color-blue { background: var(--job-color-blue); }
            .weather-header.color-purple { background: var(--job-color-purple); }
            .weather-header.color-brown { background: var(--job-color-brown); }

            .forecast-row {
                display: flex;
                background: var(--bg3);
            }

            .forecast-row.days-1 { min-height: 120px; }
            .forecast-row.days-2 { min-height: 120px; }
            .forecast-row.days-3 { min-height: 100px; }
            .forecast-row.days-4 { min-height: 90px; }
            .forecast-row.days-5 { min-height: 80px; }
            .forecast-row.days-6 { min-height: 75px; }
            .forecast-row.days-7 { min-height: 70px; }
            .forecast-row.days-8 { min-height: 65px; }
            .forecast-row.days-9 { min-height: 60px; }
            .forecast-row.days-10 { min-height: 58px; }

            .forecast-row.hourly {
                min-height: 70px;
            }

            .day-box {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 8px 4px;
                border-right: var(--b) solid var(--border);
                gap: 4px;
            }

            .day-box:last-child { border-right: none; }

            .forecast-row.days-8 .day-box { padding: 6px 3px; gap: 3px; }
            .forecast-row.days-9 .day-box { padding: 5px 2px; gap: 2px; }
            .forecast-row.days-10 .day-box { padding: 4px 2px; gap: 2px; }

            .day-label {
                font-size: 9px;
                font-weight: 700;
                color: var(--text1);
                text-align: center;
                line-height: 1;
            }

            .forecast-row.days-1 .day-label { font-size: 12px; }
            .forecast-row.days-2 .day-label { font-size: 11px; }
            .forecast-row.days-3 .day-label { font-size: 10px; }
            .forecast-row.days-8 .day-label { font-size: 8px; }
            .forecast-row.days-9 .day-label { font-size: 8px; }
            .forecast-row.days-10 .day-label { font-size: 7px; }

            .weather-icon {
                font-size: 24px;
                line-height: 1;
            }

            .forecast-row.days-1 .weather-icon { font-size: 36px; }
            .forecast-row.days-2 .weather-icon { font-size: 32px; }
            .forecast-row.days-3 .weather-icon { font-size: 28px; }
            .forecast-row.days-4 .weather-icon { font-size: 26px; }
            .forecast-row.days-5 .weather-icon { font-size: 24px; }
            .forecast-row.days-6 .weather-icon { font-size: 22px; }
            .forecast-row.days-7 .weather-icon { font-size: 20px; }
            .forecast-row.days-8 .weather-icon { font-size: 18px; }
            .forecast-row.days-9 .weather-icon { font-size: 17px; }
            .forecast-row.days-10 .weather-icon { font-size: 16px; }

            .weather-icon-text {
                font-size: 8px;
                font-weight: 700;
                text-align: center;
                line-height: 1.1;
            }

            .forecast-row.days-1 .weather-icon-text { font-size: 11px; }
            .forecast-row.days-2 .weather-icon-text { font-size: 10px; }
            .forecast-row.days-3 .weather-icon-text { font-size: 9px; }
            .forecast-row.days-8 .weather-icon-text { font-size: 7px; }
            .forecast-row.days-9 .weather-icon-text { font-size: 6px; }
            .forecast-row.days-10 .weather-icon-text { font-size: 6px; }

            .rain-icon, .snow-icon {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1px;
            }

            .forecast-row.days-8 .rain-icon,
            .forecast-row.days-8 .snow-icon { gap: 0px; }
            .forecast-row.days-9 .rain-icon,
            .forecast-row.days-9 .snow-icon { gap: 0px; }
            .forecast-row.days-10 .rain-icon,
            .forecast-row.days-10 .snow-icon { gap: 0px; }

            .rain-cloud, .snow-cloud {
                font-size: 18px;
                line-height: 1;
            }

            .forecast-row.days-1 .rain-cloud,
            .forecast-row.days-1 .snow-cloud { font-size: 28px; }
            .forecast-row.days-2 .rain-cloud,
            .forecast-row.days-2 .snow-cloud { font-size: 24px; }
            .forecast-row.days-3 .rain-cloud,
            .forecast-row.days-3 .snow-cloud { font-size: 20px; }
            .forecast-row.days-8 .rain-cloud,
            .forecast-row.days-8 .snow-cloud { font-size: 14px; }
            .forecast-row.days-9 .rain-cloud,
            .forecast-row.days-9 .snow-cloud { font-size: 13px; }
            .forecast-row.days-10 .rain-cloud,
            .forecast-row.days-10 .snow-cloud { font-size: 12px; }

            .rain-drops {
                display: flex;
                flex-direction: column;
                gap: 1px;
                margin-top: -2px;
            }

            .forecast-row.days-8 .rain-drops { gap: 0px; margin-top: -1px; }
            .forecast-row.days-9 .rain-drops { gap: 0px; margin-top: -1px; }
            .forecast-row.days-10 .rain-drops { gap: 0px; margin-top: 0px; }

            .rain-drop-row {
                display: flex;
                gap: 3px;
                justify-content: center;
                line-height: 1;
            }

            .forecast-row.days-8 .rain-drop-row { gap: 2px; }
            .forecast-row.days-9 .rain-drop-row { gap: 1px; }
            .forecast-row.days-10 .rain-drop-row { gap: 1px; }

            .rain-drop {
                font-size: 4px;
                line-height: 1;
            }
            
            .forecast-row.days-1 .rain-drop { font-size: 6px; }
            .forecast-row.days-2 .rain-drop { font-size: 5px; }
            .forecast-row.days-8 .rain-drop { font-size: 3px; }
            .forecast-row.days-9 .rain-drop { font-size: 3px; }
            .forecast-row.days-10 .rain-drop { font-size: 2px; }
            
            .rain-drop.invisible {
                opacity: 0;
            }

            .snow-flakes {
                display: flex;
                gap: 3px;
                margin-top: -2px;
            }

            .forecast-row.days-8 .snow-flakes { gap: 2px; margin-top: -1px; }
            .forecast-row.days-9 .snow-flakes { gap: 1px; margin-top: -1px; }
            .forecast-row.days-10 .snow-flakes { gap: 1px; margin-top: 0px; }

            .snow-flake {
                font-size: 8px;
            }

            .forecast-row.days-1 .snow-flake { font-size: 12px; }
            .forecast-row.days-2 .snow-flake { font-size: 10px; }
            .forecast-row.days-8 .snow-flake { font-size: 6px; }
            .forecast-row.days-9 .snow-flake { font-size: 5px; }
            .forecast-row.days-10 .snow-flake { font-size: 5px; }

            .temps {
                display: flex;
                flex-direction: column;
                gap: 1px;
                align-items: center;
                margin-top: 1px;
            }

            .forecast-row.days-8 .temps { gap: 0px; margin-top: 0px; }
            .forecast-row.days-9 .temps { gap: 0px; margin-top: 0px; }
            .forecast-row.days-10 .temps { gap: 0px; margin-top: 0px; }

            .temp-hi {
                font-size: 11px;
                font-weight: 700;
                color: var(--text1);
                line-height: 1;
            }

            .temp-lo {
                font-size: 9px;
                font-weight: 600;
                color: var(--text2);
                line-height: 1;
            }

            .forecast-row.days-1 .temp-hi { font-size: 16px; }
            .forecast-row.days-1 .temp-lo { font-size: 13px; }
            .forecast-row.days-2 .temp-hi { font-size: 14px; }
            .forecast-row.days-2 .temp-lo { font-size: 11px; }
            .forecast-row.days-3 .temp-hi { font-size: 12px; }
            .forecast-row.days-3 .temp-lo { font-size: 10px; }
            .forecast-row.days-8 .temp-hi { font-size: 10px; }
            .forecast-row.days-8 .temp-lo { font-size: 8px; }
            .forecast-row.days-9 .temp-hi { font-size: 9px; }
            .forecast-row.days-9 .temp-lo { font-size: 7px; }
            .forecast-row.days-10 .temp-hi { font-size: 9px; }
            .forecast-row.days-10 .temp-lo { font-size: 7px; }

            .forecast-row.hourly .day-box { padding: 5px 2px 4px 2px; }
            .forecast-row.hourly .day-label { font-size: 9px; }
            .forecast-row.hourly .weather-icon { font-size: 22px; }
            .forecast-row.hourly .weather-icon-text { font-size: 8px; }
            .forecast-row.hourly .temp-hi { font-size: 12px; }
            .forecast-row.hourly .rain-cloud,
            .forecast-row.hourly .snow-cloud { font-size: 16px; }
            .forecast-row.hourly .rain-drop { font-size: 4px; }
            .forecast-row.hourly .snow-flake { font-size: 7px; }

            /* State Modal */
            #weatherStateModal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            #weatherStateModal.show { display: flex; }

            .weather-state-modal {
                background: var(--bg2);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                width: 100%;
                max-width: 400px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .weather-state-modal-header {
                background: var(--bg1);
                padding: 16px;
                border-bottom: var(--b) solid var(--border);
                font-size: 16px;
                font-weight: 700;
                text-align: center;
                color: var(--text1);
            }

            .weather-state-modal-body {
                overflow-y: auto;
                flex: 1;
            }

            .weather-state-modal-option {
                padding: 16px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                color: var(--text1);
                border-bottom: var(--b) solid var(--border);
                transition: background 0.2s;
                background: var(--bg3);
                text-align: center;
            }

            .weather-state-modal-option:last-child { border-bottom: none; }
            .weather-state-modal-option:hover { background: var(--bg4); }

            /* Settings - Properly Subdivided */
            #settingsWindow .weather-location-row {
                height: 24px;
                display: flex;
                border-bottom: var(--b) solid var(--border);
            }

            #settingsWindow .weather-location-input {
                flex: 1;
                background: var(--bg3);
                border: none;
                border-right: var(--b) solid var(--border);
                color: var(--text1);
                padding: 0 12px;
                font-size: 11px;
                font-family: inherit;
                min-width: 0;
            }

            #settingsWindow .weather-location-input:last-child { border-right: none; }
            #settingsWindow .weather-location-input.clickable { cursor: pointer; }
            #settingsWindow .weather-location-input.clickable:hover { background: var(--bg4); }
            #settingsWindow .weather-location-input:focus { outline: none; background: var(--bg2); }
            #settingsWindow .weather-location-input::placeholder { color: var(--text2); }
            
            #settingsWindow .weather-label-row {
                height: 20px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                color: var(--text1);
            }

            #settingsWindow .weather-color-row {
                height: 24px;
                display: flex;
                border-bottom: var(--b) solid var(--border);
            }

            #settingsWindow .weather-color-box {
                flex: 1;
                cursor: pointer;
                border-right: var(--b) solid var(--border);
                position: relative;
            }

            #settingsWindow .weather-color-box:last-child { border-right: none; }
            
            #settingsWindow .weather-color-box.selected::after {
                content: '';
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 1px 3px rgba(0,0,0,0.5);
            }

            #settingsWindow .weather-color-box.color-red { background: var(--job-color-red); }
            #settingsWindow .weather-color-box.color-orange { background: var(--job-color-orange); }
            #settingsWindow .weather-color-box.color-gold { background: var(--job-color-gold); }
            #settingsWindow .weather-color-box.color-green { background: var(--job-color-green); }
            #settingsWindow .weather-color-box.color-teal { background: var(--job-color-teal); }
            #settingsWindow .weather-color-box.color-blue { background: var(--job-color-blue); }
            #settingsWindow .weather-color-box.color-purple { background: var(--job-color-purple); }
            #settingsWindow .weather-color-box.color-brown { background: var(--job-color-brown); }
            
            #settingsWindow .weather-icon-style-row {
                height: 24px;
                background: var(--bg4);
                display: flex;
                border-bottom: var(--b) solid var(--border);
            }
            
            #settingsWindow .weather-icon-style-box {
                flex: 1;
                background: var(--bg3);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: background 0.2s;
            }
            
            #settingsWindow .weather-icon-style-box:last-child { border-right: none; }
            #settingsWindow .weather-icon-style-box:hover { background: var(--bg2); }
            #settingsWindow .weather-icon-style-box.selected { background: var(--primary); }
            
            #settingsWindow .weather-days-row {
                height: 24px;
                background: var(--bg4);
                display: flex;
            }
            
            #settingsWindow .weather-day-box {
                flex: 1;
                background: var(--bg3);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: background 0.2s;
            }
            
            #settingsWindow .weather-day-box:last-child { border-right: none; }
            #settingsWindow .weather-day-box:hover { background: var(--bg2); }
            #settingsWindow .weather-day-box.selected { background: var(--primary); }
        `;
        
        document.head.appendChild(style);
    },
    
    // === RENDERING ===
    renderWeatherCard() {
        // No location configured
        if (!this.config.city || !this.config.state) {
            return `
                <div class="weather-card">
                    <div class="weather-header color-${this.config.color}">NO LOCATION SET</div>
                    <div style="padding: 20px; text-align: center; color: var(--text2); font-size: 13px;">
                        Go to Settings to configure weather location
                    </div>
                </div>
            `;
        }
        
        // Loading state
        if (!this.state.weatherData) {
            return `
                <div class="weather-card">
                    <div class="weather-header color-${this.config.color}">LOADING...</div>
                </div>
            `;
        }
        
        // Show weather
        const location = `${this.config.city.toUpperCase()}, ${this.config.state.toUpperCase()}`;
        const hourlyClass = this.state.showHourly ? 'hourly' : '';
        const daysClass = this.state.showHourly ? '' : `days-${this.config.daysToShow}`;
        const indicator = this.state.showHourly ? '12HR' : `${this.config.daysToShow}DAY`;
        
        // Get data and limit daily to configured days
        const data = this.state.showHourly ? 
            this.state.weatherData.hourly : 
            this.state.weatherData.daily.slice(0, this.config.daysToShow);
        
        return `
            <div class="weather-card" onclick="WeatherSystem.toggleView()">
                <div class="weather-header color-${this.config.color}">
                    ${location}
                    <span class="weather-header-indicator">${indicator}</span>
                </div>
                <div class="forecast-row ${hourlyClass} ${daysClass}">
                    ${data.map(d => `
                        <div class="day-box">
                            <div class="day-label">${d.hour || d.day}</div>
                            ${this.renderIcon(d.icon, d.code)}
                            <div class="temps">
                                <div class="temp-hi">${d.temp || d.high}°</div>
                                ${d.low !== undefined ? `<div class="temp-lo">${d.low}°</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    renderIcon(icon, code) {
        if (this.config.iconStyle === 'text') {
            return `<div class="weather-icon-text">${icon}</div>`;
        }
        
        // Symbol rendering based on icon text
        if (icon === 'SUN') {
            return '<div class="weather-icon">☀</div>';
        }
        if (icon === 'CLOUD') {
            return '<div class="weather-icon">☁</div>';
        }
        if (icon === 'FOG') {
            return '<div class="weather-icon">≡</div>';
        }
        if (icon === 'ZAP') {
            return '<div class="weather-icon">↯</div>';
        }
        if (icon === 'RAIN') {
            return this.renderRainIcon();
        }
        if (icon === 'SNOW') {
            // Determine snow intensity from code
            if (code === 71) return this.renderSnowIcon('light');
            if (code === 73) return this.renderSnowIcon('medium');
            if (code >= 75 && code <= 77) return this.renderSnowIcon('heavy');
            if (code >= 85 && code <= 86) return this.renderSnowIcon('light'); // Snow showers
            return this.renderSnowIcon('medium'); // Default
        }
        
        return `<div class="weather-icon">${icon}</div>`;
    },
    
    renderRainIcon() {
        return `
            <div class="rain-icon">
                <div class="rain-cloud">☁</div>
                <div class="rain-drops">
                    <div class="rain-drop-row">
                        <span class="rain-drop">•</span>
                        <span class="rain-drop invisible">•</span>
                        <span class="rain-drop">•</span>
                    </div>
                    <div class="rain-drop-row">
                        <span class="rain-drop invisible">•</span>
                        <span class="rain-drop">•</span>
                        <span class="rain-drop invisible">•</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderSnowIcon(intensity) {
        const flakes = intensity === 'heavy' ? '❄❄❄' : intensity === 'medium' ? '❄❄' : '❄';
        return `
            <div class="snow-icon">
                <div class="snow-cloud">☁</div>
                <div class="snow-flakes">${flakes}</div>
            </div>
        `;
    },
    
    renderWeatherSettings(section, index, totalSections) {
        const upDisabled = index === 0 ? 'disabled' : '';
        const downDisabled = index === totalSections - 1 ? 'disabled' : '';
        const checked = this.config.enabled ? 'checked' : '';
        const disabled = this.config.enabled ? '' : 'disabled';
        
        return `
            <div class="setting-row ${disabled}">
                <div class="setting-top-section">
                    <div class="checkbox-section ${checked}" onclick="WeatherSystem.toggleEnabled()"></div>
                    <div class="setting-label">WEATHER</div>
                    <div class="right-section">
                        <div class="up-button ${upDisabled}" onclick="WeatherSystem.moveUp()"></div>
                        <div class="down-button ${downDisabled}" onclick="WeatherSystem.moveDown()"></div>
                    </div>
                </div>
                <div class="setting-bottom-section weather">
                    <div class="weather-location-row">
                        <input type="text" class="weather-location-input" placeholder="CITY" value="${this.config.city}" 
                            onchange="WeatherSystem.setCity(this.value)" ${this.config.enabled ? '' : 'disabled'}>
                        <input type="text" class="weather-location-input clickable" placeholder="STATE" value="${this.config.state}" 
                            onclick="WeatherSystem.showStateModal()" readonly ${this.config.enabled ? '' : 'disabled'}>
                    </div>
                    <div class="weather-label-row">COLOR</div>
                    <div class="weather-color-row">
                        <div class="weather-color-box color-red ${this.config.color === 'red' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('red')"></div>
                        <div class="weather-color-box color-orange ${this.config.color === 'orange' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('orange')"></div>
                        <div class="weather-color-box color-gold ${this.config.color === 'gold' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('gold')"></div>
                        <div class="weather-color-box color-green ${this.config.color === 'green' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('green')"></div>
                        <div class="weather-color-box color-teal ${this.config.color === 'teal' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('teal')"></div>
                        <div class="weather-color-box color-blue ${this.config.color === 'blue' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('blue')"></div>
                        <div class="weather-color-box color-purple ${this.config.color === 'purple' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('purple')"></div>
                        <div class="weather-color-box color-brown ${this.config.color === 'brown' ? 'selected' : ''}" onclick="WeatherSystem.selectColor('brown')"></div>
                    </div>
                    <div class="weather-label-row">ICON STYLE</div>
                    <div class="weather-icon-style-row">
                        <div class="weather-icon-style-box ${this.config.iconStyle === 'symbols' ? 'selected' : ''}" onclick="WeatherSystem.selectIconStyle('symbols')">SYMBOLS</div>
                        <div class="weather-icon-style-box ${this.config.iconStyle === 'text' ? 'selected' : ''}" onclick="WeatherSystem.selectIconStyle('text')">TEXT</div>
                    </div>
                    <div class="weather-label-row">DAYS TO SHOW</div>
                    <div class="weather-days-row">
                        ${[1,2,3,4,5,6,7,8,9,10].map(num => 
                            `<div class="weather-day-box ${this.config.daysToShow === num ? 'selected' : ''}" onclick="WeatherSystem.selectDays(${num})">${num}</div>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    // === USER INTERACTIONS ===
    toggleView() {
        this.state.showHourly = !this.state.showHourly;
        this.refreshDisplays();
    },
    
    toggleEnabled() {
        this.config.enabled = !this.config.enabled;
        this.saveToStorage();
        this.refreshDisplays();
        
        // Update section visibility
        if (typeof window.mainScreenSections !== 'undefined') {
            const section = window.mainScreenSections.find(s => s.id === 'weather');
            if (section) section.visible = this.config.enabled;
        }
    },
    
    selectColor(color) {
        if (!this.config.enabled) return;
        this.config.color = color;
        this.saveToStorage();
        this.refreshDisplays();
    },
    
    selectIconStyle(style) {
        if (!this.config.enabled) return;
        this.config.iconStyle = style;
        this.saveToStorage();
        this.refreshDisplays();
    },
    
    selectDays(days) {
        if (!this.config.enabled) return;
        this.config.daysToShow = days;
        this.saveToStorage();
        this.refreshDisplays();
    },
    
    setCity(city) {
        this.config.city = city.trim();
        this.saveToStorage();
        
        if (this.config.city && this.config.state) {
            this.fetchWeather();
        }
    },
    
    setState(state) {
        this.config.state = state;
        this.config.latitude = null;
        this.config.longitude = null;
        this.saveToStorage();
        this.refreshDisplays();
        
        if (this.config.city && this.config.state) {
            this.fetchWeather();
        }
    },
    
    showStateModal() {
        if (!this.config.enabled) return;
        
        const modal = document.getElementById('weatherStateModal');
        if (!modal) {
            this.createStateModal();
        }
        document.getElementById('weatherStateModal').classList.add('show');
    },
    
    hideStateModal() {
        document.getElementById('weatherStateModal').classList.remove('show');
    },
    
    createStateModal() {
        const states = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ];
        
        const modal = document.createElement('div');
        modal.id = 'weatherStateModal';
        modal.innerHTML = `
            <div class="weather-state-modal">
                <div class="weather-state-modal-header">SELECT STATE</div>
                <div class="weather-state-modal-body">
                    ${states.map(state => 
                        `<div class="weather-state-modal-option" onclick="WeatherSystem.selectState('${state}')">${state}</div>`
                    ).join('')}
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideStateModal();
        });
        
        document.body.appendChild(modal);
    },
    
    selectState(state) {
        this.setState(state);
        this.hideStateModal();
    },
    
    moveUp() {
        if (typeof SettingsSystem !== 'undefined' && SettingsSystem.moveUp) {
            SettingsSystem.moveUp('weather');
        }
    },
    
    moveDown() {
        if (typeof SettingsSystem !== 'undefined' && SettingsSystem.moveDown) {
            SettingsSystem.moveDown('weather');
        }
    },
    
    // === WEATHER DATA ===
    async fetchWeather() {
        if (!this.config.city || !this.config.state) return;
        
        try {
            // Get coordinates
            if (!this.config.latitude || !this.config.longitude) {
                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(this.config.city)}&count=5&language=en&format=json`;
                const geoResponse = await fetch(geoUrl);
                const geoData = await geoResponse.json();
                
                if (!geoData.results || geoData.results.length === 0) {
                    console.error('Location not found');
                    return;
                }
                
                // Find match with state
                const match = geoData.results.find(r => {
                    const admin = r.admin1 || '';
                    return admin.includes(this.config.state) || 
                           admin.toLowerCase().includes(this.config.state.toLowerCase());
                });
                
                const location = match || geoData.results[0];
                this.config.latitude = location.latitude;
                this.config.longitude = location.longitude;
                this.saveToStorage();
            }
            
            // Get weather
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${this.config.latitude}&longitude=${this.config.longitude}&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=10`;
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();
            
            this.state.weatherData = this.processWeatherData(weatherData);
            this.refreshDisplays();
            
        } catch (error) {
            console.error('Weather fetch error:', error);
        }
    },
    
    processWeatherData(data) {
        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        // Daily forecast (up to 10 days)
        const daily = [];
        for (let i = 0; i < Math.min(10, data.daily.time.length); i++) {
            const date = new Date(data.daily.time[i]);
            const dataIndex = i;
            const weatherCode = data.daily.weather_code[dataIndex];
            
            daily.push({
                day: i === 0 ? 'TODAY' : days[date.getDay()],
                icon: this.getWeatherIcon(weatherCode),
                code: weatherCode,
                high: Math.round(data.daily.temperature_2m_max[dataIndex]),
                low: Math.round(data.daily.temperature_2m_min[dataIndex]),
                isToday: i === 0
            });
        }
        
        // Hourly forecast (12 hours starting now)
        let currentHourIndex = 0;
        for (let i = 0; i < data.hourly.time.length; i++) {
            const hourDate = new Date(data.hourly.time[i]);
            if (hourDate >= now) {
                currentHourIndex = i;
                break;
            }
        }
        
        const hourly = [];
        for (let i = 0; i < 12; i++) {
            const dataIndex = currentHourIndex + i;
            if (dataIndex >= data.hourly.time.length) break;
            
            const hourDate = new Date(data.hourly.time[dataIndex]);
            const h = hourDate.getHours();
            let label = i === 0 ? 'NOW' : h === 0 ? '12A' : h === 12 ? '12P' : h < 12 ? `${h}A` : `${h-12}P`;
            const weatherCode = data.hourly.weather_code[dataIndex];
            
            hourly.push({
                hour: label,
                icon: this.getWeatherIcon(weatherCode),
                code: weatherCode,
                temp: Math.round(data.hourly.temperature_2m[dataIndex]),
                isNow: i === 0
            });
        }
        
        return { daily, hourly };
    },
    
    getWeatherIcon(code) {
        if (code === 0) return 'SUN';
        if (code <= 3) return 'CLOUD';
        if (code <= 48) return 'FOG';
        if (code <= 55) return 'RAIN';  // Drizzle
        if (code <= 65) return 'RAIN';
        if (code === 71) return 'SNOW';  // Light snow
        if (code === 73) return 'SNOW';
        if (code >= 75 && code <= 77) return 'SNOW';  // Heavy snow
        if (code <= 82) return 'RAIN';  // Rain showers
        if (code <= 86) return 'SNOW';  // Snow showers
        if (code >= 95) return 'ZAP';
        return 'CLOUD';
    }
};

// === AUTO-INITIALIZE ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WeatherSystem.initialize());
} else {
    WeatherSystem.initialize();
}

// === EXPORT ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherSystem;
}
