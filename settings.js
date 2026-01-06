// === SETTINGS.JS ===
// Dynamically populates and manages the Settings Window

const SettingsSystem = {
    
    /**
     * Initialize the settings system
     */
    initialize() {
        console.log('🚀 Initializing Settings System...');
        this.injectStyles();
        this.renderSettings();
        console.log('✅ Settings System initialized');
    },
    
    /**
     * Inject CSS styles for settings cards
     */
    injectStyles() {
        if (document.getElementById('settings-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'settings-styles';
        style.textContent = `
            #settingsWindow .section-divider {
                font-size: 14px;
                font-weight: 700;
                color: var(--text2);
                background: var(--white);
                padding: 8px 12px;
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                margin-bottom: var(--gap);
                text-align: center;
            }
        
        #settingsWindow .theme-settings-card {
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.0s ease;
    margin-bottom: var(--gap);
}

#settingsWindow .theme-settings-card:hover {
    transform: translateY(-0px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

#settingsWindow .theme-stripes-top,
#settingsWindow .theme-stripes-bottom {
    height: 24px;
    display: flex;
}

#settingsWindow .theme-stripes-top {
    border-bottom: 3px solid var(--border);
}

#settingsWindow .theme-stripes-bottom {
    border-top: 3px solid var(--border);
}

#settingsWindow .theme-color-stripe {
    flex: 1;
    border-right: 3px solid var(--border);
}

#settingsWindow .theme-color-stripe:last-child {
    border-right: none;
}

#settingsWindow .theme-card-content {
    background: var(--bg1);
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: var(--text1);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

#settingsWindow .theme-color-stripe.color-blue { background: var(--job-color-blue); }
#settingsWindow .theme-color-stripe.color-green { background: var(--job-color-green); }
#settingsWindow .theme-color-stripe.color-purple { background: var(--job-color-purple); }
#settingsWindow .theme-color-stripe.color-red { background: var(--job-color-red); }
#settingsWindow .theme-color-stripe.color-orange { background: var(--job-color-orange); }
#settingsWindow .theme-color-stripe.color-teal { background: var(--job-color-teal); }
#settingsWindow .theme-color-stripe.color-gold { background: var(--job-color-gold); }
#settingsWindow .theme-color-stripe.color-brown { background: var(--job-color-brown); }

            #settingsWindow .setting-row {
                display: flex;
                flex-direction: column;
                background: var(--bg1);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                overflow: hidden;
                margin-bottom: var(--gap);
                transition: opacity 0.2s ease;
            }
            
            #settingsWindow .setting-row.disabled {
                opacity: 0.5;
            }

            #settingsWindow .setting-row.disabled .setting-bottom-section {
                pointer-events: none;
            }

            #settingsWindow .setting-top-section {
                display: flex;
                height: 44px;
                width: 100%;
                border-bottom: var(--b) solid var(--border);
                position: relative;
            }

            #settingsWindow .setting-top-section::after {
                content: '';
                position: absolute;
                bottom: -3px;
                left: -100vw;
                right: -100vw;
                height: 3px;
                background: var(--border);
                z-index: 10;
            }

            #settingsWindow .checkbox-section {
                flex: 0 0 42.5px;
                height: 44px;
                background: var(--bg1);
                border-right: 3px solid var(--border);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
                position: relative;
            }

            #settingsWindow .checkbox-section:hover {
                background: var(--bg2);
            }

            #settingsWindow .checkbox-section.checked {
                background: var(--primary);
            }

            #settingsWindow .checkbox-section.checked::after {
                content: '✓';
                color: var(--text1);
                font-size: 24px;
                font-weight: 900;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            #settingsWindow .checkbox-section.locked {
                background: var(--bg2);
                cursor: not-allowed;
            }

            #settingsWindow .checkbox-section.locked::after {
                content: '✕';
                color: var(--text1);
                font-size: 28px;
                font-weight: 900;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            #settingsWindow .checkbox-section.locked:hover {
                background: #1F2937;
            }

            #settingsWindow .setting-label {
                flex: 1;
                font-size: 15px;
                font-weight: 600;
                color: var(--text1);
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg1);
            }

            #settingsWindow .right-section {
                flex: 0 0 42.5px;
                height: 44px;
                background: var(--bg1);
                border-left: 3px solid var(--border);
                display: flex;
                flex-direction: column;
                position: relative;
            }

            #settingsWindow .right-section::after {
                content: '';
                position: absolute;
                left: -3px;
                top: 0;
                bottom: 0;
                width: 3px;
                background: var(--border);
                z-index: 10;
            }

            #settingsWindow .up-button,
            #settingsWindow .down-button {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s ease;
                position: relative;
            }

            #settingsWindow .up-button {
                border-bottom: 1.5px solid var(--border);
            }

            #settingsWindow .down-button {
                border-top: 1.5px solid var(--border);
            }

            #settingsWindow .up-button:hover,
            #settingsWindow .down-button:hover {
                background: var(--bg2);
            }

            #settingsWindow .up-button.disabled,
            #settingsWindow .down-button.disabled {
                opacity: 0.3;
                cursor: not-allowed;
                pointer-events: none;
            }

            #settingsWindow .up-button::after {
                content: '';
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 8px solid var(--text1);
            }

            #settingsWindow .down-button::after {
                content: '';
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid var(--text1);
            }

            /* === JOB CARDS BOTTOM SECTION === */
            #settingsWindow .setting-bottom-section.job-cards {
                background: var(--bg4);
                display: flex;
                flex-direction: column;
                height: 40px;
            }

            #settingsWindow .card-states-label {
                height: 20px;
                background: var(--bg4);
                border-bottom: 3px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                color: var(--text1);
            }

            #settingsWindow .card-states-buttons {
                height: 20px;
                background: var(--bg4);
                display: flex;
            }

            #settingsWindow .state-button {
                flex: 1;
                background: var(--bg1);
                border-right: 3px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            #settingsWindow .state-button:last-child {
                border-right: none;
            }

            #settingsWindow .state-button:hover {
                background: var(--bg2);
            }

            #settingsWindow .state-button.selected {
                background: var(--primary);
                color: var(--text1);
            }

            /* === QUICK SCHEDULE BOTTOM SECTION === */
            #settingsWindow .setting-bottom-section.quick-schedule {
                background: var(--bg4);
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            #settingsWindow .bottom-blank {
                height: 20px;
                background: var(--bg4);
                border-bottom: 3px solid var(--border);
                display: flex;
            }

            #settingsWindow .blank-section {
                flex: 1;
                background: var(--bg1);
                border-right: 3px solid var(--border);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: all 0.2s ease;
            }

            #settingsWindow .blank-section:last-child {
                border-right: none;
            }

            #settingsWindow .blank-section.color-blue { background: var(--job-color-blue); }
            #settingsWindow .blank-section.color-green { background: var(--job-color-green); }
            #settingsWindow .blank-section.color-purple { background: var(--job-color-purple); }
            #settingsWindow .blank-section.color-red { background: var(--job-color-red); }
            #settingsWindow .blank-section.color-orange { background: var(--job-color-orange); }
            #settingsWindow .blank-section.color-teal { background: var(--job-color-teal); }
            #settingsWindow .blank-section.color-gold { background: var(--job-color-gold); }
            #settingsWindow .blank-section.color-brown { background: var(--job-color-brown); }

            #settingsWindow .blank-section.selected::after {
                content: '';
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                position: absolute;
            }

            #settingsWindow .bottom-top {
                height: 20px;
                background: var(--bg4);
                border-bottom: 3px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                color: var(--text1);
            }

            #settingsWindow .bottom-bottom {
                height: 20px;
                background: var(--bg4);
                display: flex;
            }

            #settingsWindow .day-section {
                flex: 1;
                background: var(--bg1);
                border-right: 3px solid var(--border);
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 2px;
                font-size: 10px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            #settingsWindow .day-section:hover {
                background: var(--bg2);
            }

            #settingsWindow .day-section.selected {
                color: var(--text1);
            }
            
            #settingsWindow .day-section.selected.color-blue { background: var(--job-color-blue); }
            #settingsWindow .day-section.selected.color-green { background: var(--job-color-green); }
            #settingsWindow .day-section.selected.color-purple { background: var(--job-color-purple); }
            #settingsWindow .day-section.selected.color-red { background: var(--job-color-red); }
            #settingsWindow .day-section.selected.color-orange { background: var(--job-color-orange); }
            #settingsWindow .day-section.selected.color-teal { background: var(--job-color-teal); }
            #settingsWindow .day-section.selected.color-gold { background: var(--job-color-gold); }
            #settingsWindow .day-section.selected.color-brown { background: var(--job-color-brown); }

            #settingsWindow .day-section:last-child {
                border-right: none;
            }

            /* === HISTORY BOTTOM SECTION === */
            #settingsWindow .setting-bottom-section.history {
                background: var(--bg4);
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            #settingsWindow .color-selection-row {
                height: 20px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
            }

            #settingsWindow .color-section {
                flex: 1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: all 0.2s ease;
            }

            #settingsWindow .color-section.color-blue { background: var(--job-color-blue); }
            #settingsWindow .color-section.color-green { background: var(--job-color-green); }
            #settingsWindow .color-section.color-purple { background: var(--job-color-purple); }
            #settingsWindow .color-section.color-red { background: var(--job-color-red); }
            #settingsWindow .color-section.color-orange { background: var(--job-color-orange); }
            #settingsWindow .color-section.color-teal { background: var(--job-color-teal); }
            #settingsWindow .color-section.color-gold { background: var(--job-color-gold); }
            #settingsWindow .color-section.color-brown { background: var(--job-color-brown); }

            #settingsWindow .color-section.selected::after {
                content: '';
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                position: absolute;
            }

            #settingsWindow .history-text-row {
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

            #settingsWindow .week-selection-row {
                height: 20px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
            }

            #settingsWindow .week-option {
                flex: 1;
                background: var(--bg1);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            #settingsWindow .week-option:last-child {
                border-right: none;
            }

            #settingsWindow .week-option:hover {
                background: var(--bg2);
            }

            #settingsWindow .week-option.selected {
                color: var(--text1);
            }
            
            #settingsWindow .week-option.selected.color-blue { background: var(--job-color-blue); }
            #settingsWindow .week-option.selected.color-green { background: var(--job-color-green); }
            #settingsWindow .week-option.selected.color-purple { background: var(--job-color-purple); }
            #settingsWindow .week-option.selected.color-red { background: var(--job-color-red); }
            #settingsWindow .week-option.selected.color-orange { background: var(--job-color-orange); }
            #settingsWindow .week-option.selected.color-teal { background: var(--job-color-teal); }
            #settingsWindow .week-option.selected.color-gold { background: var(--job-color-gold); }
            #settingsWindow .week-option.selected.color-brown { background: var(--job-color-brown); }

            #settingsWindow .number-selection-row {
                height: 20px;
                background: var(--bg4);
                display: flex;
            }

            #settingsWindow .number-section {
                flex: 1;
                background: var(--bg1);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            #settingsWindow .number-section:last-child {
                border-right: none;
            }

            #settingsWindow .number-section:hover {
                background: var(--bg2);
            }

            #settingsWindow .number-section.selected {
                color: var(--text1);
            }
            
            #settingsWindow .number-section.selected.color-blue { background: var(--job-color-blue); }
            #settingsWindow .number-section.selected.color-green { background: var(--job-color-green); }
            #settingsWindow .number-section.selected.color-purple { background: var(--job-color-purple); }
            #settingsWindow .number-section.selected.color-red { background: var(--job-color-red); }
            #settingsWindow .number-section.selected.color-orange { background: var(--job-color-orange); }
            #settingsWindow .number-section.selected.color-teal { background: var(--job-color-teal); }
            #settingsWindow .number-section.selected.color-gold { background: var(--job-color-gold); }
            #settingsWindow .number-section.selected.color-brown { background: var(--job-color-brown); }
        
            /* === SPLASH SCREEN BOTTOM SECTION === */
            #settingsWindow .setting-bottom-section.splash {
                background: var(--bg4);
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            #settingsWindow .splash-type-row {
                height: 20px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
            }

            #settingsWindow .splash-type-button {
                flex: 1;
                background: var(--bg1);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            #settingsWindow .splash-type-button:last-child {
                border-right: none;
            }

            #settingsWindow .splash-type-button:hover {
                background: var(--bg2);
            }

            #settingsWindow .splash-type-button.selected {
                background: var(--primary) !important;
                color: var(--text1) !important;
            }

            #settingsWindow .splash-duration-label {
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

            #settingsWindow .splash-duration-row {
                height: 20px;
                background: var(--bg4);
                display: flex;
            }

            #settingsWindow .duration-button {
                flex: 1;
                background: var(--bg1);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            #settingsWindow .duration-button:last-child {
                border-right: none;
            }

            #settingsWindow .duration-button:hover {
                background: var(--bg2);
            }

            #settingsWindow .duration-button.selected {
                background: var(--primary) !important;
                color: var(--text1) !important;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    /**
     * Render the settings interface
     */
    renderSettings() {
        const settingsWindow = document.querySelector('#settingsWindow .content');
        if (!settingsWindow) return;
        
        // === APPEARANCE SECTION (FIRST) ===
        let html = '<div class="section-divider">Appearance</div>';
        
        // COLOR THEMES card
        if (typeof ThemeSystem !== 'undefined') {
            html += ThemeSystem.renderSettingsCard();
        }
        
        // === MAIN WINDOW LAYOUT SECTION ===
        html += '<div class="section-divider">Main Window Layout</div>';
        
        // Build cards array from mainScreenSections
        const sections = window.mainScreenSections || [
            { id: 'nextShift', name: 'Time Until Next Shift', visible: true, locked: true },
            { id: 'quickSchedule', name: 'Quick Schedule', visible: true, locked: false },
            { id: 'history', name: 'History', visible: true, locked: false }
        ];
        
        sections.forEach((section, index) => {
    if (section.id === 'nextShift') {
        // JOB CARDS section
        const cardState = window.compactJobCards ? 'compact' : 'full';
        html += this.renderJobCardsSection(index, sections.length, cardState);
    } else if (section.id === 'quickSchedule') {
        // QUICK SCHEDULE section
        const settings = window.quickScheduleSettings || { enabled: true, color: 'purple', daysToShow: 7 };
        html += this.renderQuickScheduleSection(section, index, sections.length, settings);
    } else if (section.id === 'history') {
        // HISTORY section
        const settings = window.historySettings || { 
            enabled: true, 
            color: 'purple', 
            showThisNextWeek: true, 
            showLastWeek: true, 
            weekCount: 5 
        };
        html += this.renderHistorySection(section, index, sections.length, settings);
    } else {
        // DYNAMIC MODULE RENDERING
        if (window.settingsRenderers && window.settingsRenderers[section.id]) {
            html += window.settingsRenderers[section.id](section, index, sections.length);
        }
    }
});

        // === SPLASH SCREEN SECTION ===
        html += '<div class="section-divider">Splash Screen Settings</div>';
        
        // Force fresh read of splash settings
        const splashSettings = (typeof SplashSystem !== 'undefined' && SplashSystem.config) ? {
    enabled: SplashSystem.config.enabled,
    type: SplashSystem.config.type,
    duration: SplashSystem.config.duration,
    loop: SplashSystem.config.loop
} : { 
    enabled: true, 
    type: 'circle', 
    duration: 3,
    loop: false
};
        
        console.log('Rendering splash settings:', splashSettings);
        html += this.renderSplashScreenSection(splashSettings);
        
        settingsWindow.innerHTML = html;
    },
    
    /**
     * Render Job Cards section
     */
    renderJobCardsSection(index, totalSections, cardState) {
        const upDisabled = index === 0 ? 'disabled' : '';
        const downDisabled = index === totalSections - 1 ? 'disabled' : '';
        
        return `
            <div class="setting-row">
                <div class="setting-top-section">
                    <div class="checkbox-section locked"></div>
                    <div class="setting-label">JOB CARDS</div>
                    <div class="right-section">
                        <div class="up-button ${upDisabled}" onclick="SettingsSystem.moveUp('nextShift')"></div>
                        <div class="down-button ${downDisabled}" onclick="SettingsSystem.moveDown('nextShift')"></div>
                    </div>
                </div>
                <div class="setting-bottom-section job-cards">
                    <div class="card-states-label">CARD STATES</div>
                    <div class="card-states-buttons">
                        <div class="state-button ${cardState === 'full' ? 'selected' : ''}" onclick="SettingsSystem.setJobCardsState('full')">FULL</div>
                        <div class="state-button ${cardState === 'compact' ? 'selected' : ''}" onclick="SettingsSystem.setJobCardsState('compact')">COMPACT</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render Quick Schedule section
     */
    renderQuickScheduleSection(section, index, totalSections, settings) {
        const upDisabled = index === 0 ? 'disabled' : '';
        const downDisabled = index === totalSections - 1 ? 'disabled' : '';
        const disabledClass = !section.visible ? 'disabled' : '';
        const checkedClass = section.visible ? 'checked' : '';
        
        const daysHtml = [1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(day => {
            const selectedClass = settings.daysToShow === day ? `selected color-${settings.color}` : '';
            return `<div class="day-section ${selectedClass}" onclick="SettingsSystem.setQuickScheduleDays(${day})">${day}</div>`;
        }).join('');
        
        return `
            <div class="setting-row ${disabledClass}">
                <div class="setting-top-section">
                    <div class="checkbox-section ${checkedClass}" onclick="SettingsSystem.toggleQuickSchedule()"></div>
                    <div class="setting-label">QUICK SCHEDULE</div>
                    <div class="right-section">
                        <div class="up-button ${upDisabled}" onclick="SettingsSystem.moveUp('quickSchedule')"></div>
                        <div class="down-button ${downDisabled}" onclick="SettingsSystem.moveDown('quickSchedule')"></div>
                    </div>
                </div>
                <div class="setting-bottom-section quick-schedule">
                    <div class="bottom-blank">
                        <div class="blank-section color-red ${settings.color === 'red' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('red')"></div>
                        <div class="blank-section color-orange ${settings.color === 'orange' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('orange')"></div>
                        <div class="blank-section color-gold ${settings.color === 'gold' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('gold')"></div>
                        <div class="blank-section color-green ${settings.color === 'green' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('green')"></div>
                        <div class="blank-section color-teal ${settings.color === 'teal' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('teal')"></div>
                        <div class="blank-section color-blue ${settings.color === 'blue' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('blue')"></div>
                        <div class="blank-section color-purple ${settings.color === 'purple' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('purple')"></div>
                        <div class="blank-section color-brown ${settings.color === 'brown' ? 'selected' : ''}" onclick="SettingsSystem.setQuickScheduleColor('brown')"></div>
                    </div>
                    <div class="bottom-top">HOW MANY DAYS TO SHOW?</div>
                    <div class="bottom-bottom">${daysHtml}</div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render History section
     */
    renderHistorySection(section, index, totalSections, settings) {
        const upDisabled = index === 0 ? 'disabled' : '';
        const downDisabled = index === totalSections - 1 ? 'disabled' : '';
        const disabledClass = !section.visible ? 'disabled' : '';
        const checkedClass = section.visible ? 'checked' : '';
        
        const numbersHtml = [1,2,3,4,5,6,7,8,9,10].map(num => {
            const selectedClass = settings.weekCount === num ? `selected color-${settings.color}` : '';
            return `<div class="number-section ${selectedClass}" onclick="SettingsSystem.setHistoryWeekCount(${num})">${num}</div>`;
        }).join('');
        
        const thisNextWeekClass = settings.showThisNextWeek ? `selected color-${settings.color}` : '';
        const lastWeekClass = settings.showLastWeek ? `selected color-${settings.color}` : '';
        
        return `
            <div class="setting-row ${disabledClass}">
                <div class="setting-top-section">
                    <div class="checkbox-section ${checkedClass}" onclick="SettingsSystem.toggleHistory()"></div>
                    <div class="setting-label">HISTORY</div>
                    <div class="right-section">
                        <div class="up-button ${upDisabled}" onclick="SettingsSystem.moveUp('history')"></div>
                        <div class="down-button ${downDisabled}" onclick="SettingsSystem.moveDown('history')"></div>
                    </div>
                </div>
                <div class="setting-bottom-section history">
                    <div class="color-selection-row">
                        <div class="color-section color-red ${settings.color === 'red' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('red')"></div>
                        <div class="color-section color-orange ${settings.color === 'orange' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('orange')"></div>
                        <div class="color-section color-gold ${settings.color === 'gold' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('gold')"></div>
                        <div class="color-section color-green ${settings.color === 'green' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('green')"></div>
                        <div class="color-section color-teal ${settings.color === 'teal' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('teal')"></div>
                        <div class="color-section color-blue ${settings.color === 'blue' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('blue')"></div>
                        <div class="color-section color-purple ${settings.color === 'purple' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('purple')"></div>
                        <div class="color-section color-brown ${settings.color === 'brown' ? 'selected' : ''}" onclick="SettingsSystem.setHistoryColor('brown')"></div>
                    </div>
                    <div class="history-text-row">HOW MANY WEEKS OF HISTORY?</div>
                    <div class="week-selection-row">
                        <div class="week-option ${thisNextWeekClass}" onclick="SettingsSystem.toggleThisNextWeek()">THIS/NEXT</div>
                        <div class="week-option ${lastWeekClass}" onclick="SettingsSystem.toggleLastWeek()">LAST</div>
                    </div>
                    <div class="number-selection-row">${numbersHtml}</div>
                </div>
            </div>
        `;
    },

    /**
     * Render Splash Screen section
     */
    renderSplashScreenSection(settings) {
        const checkedClass = settings.enabled ? 'checked' : '';
        const disabledClass = !settings.enabled ? 'disabled' : '';
        
        return `
            <div class="setting-row ${disabledClass}">
                <div class="setting-top-section">
                    <div class="checkbox-section ${checkedClass}" onclick="SettingsSystem.toggleSplash()"></div>
                    <div class="setting-label">SPLASH SCREEN</div>
                    <div class="right-section" style="opacity: 0; pointer-events: none;"></div>
                </div>
                <div class="setting-bottom-section splash">
                    <div class="splash-type-row">
                        <div class="splash-type-button ${settings.type === 'circle' ? 'selected' : ''}" onclick="SettingsSystem.setSplashType('circle')">CIRCLE</div>
                        <div class="splash-type-button ${settings.type === 'puzzle' ? 'selected' : ''}" onclick="SettingsSystem.setSplashType('puzzle')">PUZZLE</div>
                    </div>
                    <div class="splash-duration-label">SPLASH DURATION (SECONDS)</div>
                    <div class="splash-duration-row">
                        <div class="duration-button ${settings.duration === 2 ? 'selected' : ''}" onclick="SettingsSystem.setSplashDuration(2)">2</div>
                        <div class="duration-button ${settings.duration === 3 ? 'selected' : ''}" onclick="SettingsSystem.setSplashDuration(3)">3</div>
                        <div class="duration-button ${settings.duration === 4 ? 'selected' : ''}" onclick="SettingsSystem.setSplashDuration(4)">4</div>
                        <div class="duration-button ${settings.duration === 5 ? 'selected' : ''}" onclick="SettingsSystem.setSplashDuration(5)">5</div>
        <div class="duration-button ${settings.loop ? 'selected' : ''}" onclick="SettingsSystem.setSplashLoop()">∞</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // === CONTROL METHODS ===
    
    /**
     * Set job cards state
     */
    setJobCardsState(state) {
        window.compactJobCards = (state === 'compact');
        if (typeof saveData === 'function') saveData();
        if (typeof renderJobs === 'function') renderJobs();
        setTimeout(() => this.renderSettings(), 10);
    },
    
    /**
     * Toggle Quick Schedule enabled/disabled
     */
    toggleQuickSchedule() {
        const sections = window.mainScreenSections;
        if (!sections) return;
        
        const section = sections.find(s => s.id === 'quickSchedule');
        if (section) {
            section.visible = !section.visible;
            window.quickScheduleSettings.enabled = section.visible;
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },
    
    /**
     * Set Quick Schedule color
     */
    setQuickScheduleColor(color) {
        if (window.quickScheduleSettings) {
            window.quickScheduleSettings.color = color;
            if (typeof QuickScheduleGrid !== 'undefined') {
                QuickScheduleGrid.config.color = color;
            }
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },
    
    /**
     * Set Quick Schedule days to show
     */
    setQuickScheduleDays(days) {
        if (window.quickScheduleSettings) {
            window.quickScheduleSettings.daysToShow = days;
            if (typeof QuickScheduleGrid !== 'undefined') {
                QuickScheduleGrid.config.daysToShow = days;
            }
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },
    
    /**
     * Toggle History enabled/disabled
     */
    toggleHistory() {
        const sections = window.mainScreenSections;
        if (!sections) return;
        
        const section = sections.find(s => s.id === 'history');
        if (section) {
            section.visible = !section.visible;
            window.historySettings.enabled = section.visible;
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },
    
    /**
     * Set History color
     */
    setHistoryColor(color) {
        if (window.historySettings) {
            window.historySettings.color = color;
            if (typeof HistorySystem !== 'undefined') {
                HistorySystem.config.color = color;
            }
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },
    
    /**
     * Toggle THIS/NEXT week visibility
     */
    toggleThisNextWeek() {
        if (window.historySettings) {
            window.historySettings.showThisNextWeek = !window.historySettings.showThisNextWeek;
            if (typeof HistorySystem !== 'undefined') {
                HistorySystem.config.showThisNextWeek = window.historySettings.showThisNextWeek;
            }
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },
    
    /**
     * Toggle LAST week visibility
     */
    toggleLastWeek() {
        if (window.historySettings) {
            window.historySettings.showLastWeek = !window.historySettings.showLastWeek;
            if (typeof HistorySystem !== 'undefined') {
                HistorySystem.config.showLastWeek = window.historySettings.showLastWeek;
            }
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },
    
    /**
     * Set History week count
     */
    setHistoryWeekCount(count) {
        if (window.historySettings) {
            window.historySettings.weekCount = count;
            if (typeof HistorySystem !== 'undefined') {
                HistorySystem.config.weekCount = count;
            }
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    },

    /**
     * Toggle splash screen enabled/disabled
     */
    toggleSplash() {
        if (typeof SplashSystem !== 'undefined') {
            SplashSystem.config.enabled = !SplashSystem.config.enabled;
            SplashSystem.saveSettings();
            console.log('Splash toggled:', SplashSystem.config.enabled);
            // Force re-render with longer delay to ensure state updates
            setTimeout(() => this.renderSettings(), 50);
        }
    },

    /**
     * Set splash type (circle or puzzle)
     */
    setSplashType(type) {
        if (typeof SplashSystem !== 'undefined') {
            SplashSystem.config.type = type;
            SplashSystem.saveSettings();
            console.log('Splash type set to:', type);
            // Force re-render with longer delay to ensure state updates
            setTimeout(() => this.renderSettings(), 50);
        }
    },

    /**
     * Set splash duration
     */
    setSplashDuration(duration) {
    if (typeof SplashSystem !== 'undefined') {
        SplashSystem.config.duration = duration;
        SplashSystem.saveSettings();
        console.log('Splash duration set to:', duration);
        setTimeout(() => this.renderSettings(), 50);
    }
},

/**
 * Set splash loop mode
 */
setSplashLoop() {
    if (typeof SplashSystem !== 'undefined') {
        SplashSystem.config.loop = !SplashSystem.config.loop;
        SplashSystem.saveSettings();
        console.log('Splash loop toggled:', SplashSystem.config.loop);
        setTimeout(() => this.renderSettings(), 50);
    }
},
    
/**
 * Move section up
 */
moveUp(sectionId) {
    const sections = window.mainScreenSections;
    if (!sections) return;
    
    const index = sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
        // Swap with previous section
        [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
        if (typeof saveData === 'function') saveData();
        
        // Render settings first to update arrow states, then render main window
        this.renderSettings();
        if (typeof renderJobs === 'function') {
            setTimeout(() => renderJobs(), 0);
        }
    }
},
    
    /**
     * Move section down
     */
    moveDown(sectionId) {
        const sections = window.mainScreenSections;
        if (!sections) return;
        
        const index = sections.findIndex(s => s.id === sectionId);
        if (index >= 0 && index < sections.length - 1) {
            // Swap with next section
            [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
            if (typeof saveData === 'function') saveData();
            if (typeof renderJobs === 'function') renderJobs();
            setTimeout(() => this.renderSettings(), 10);
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SettingsSystem.initialize();
    });
} else {
    SettingsSystem.initialize();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsSystem;
}