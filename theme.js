/**
 * Theme System - Complete theme creator and manager
 * Integrates with Settings.js to provide theme customization
 */

const ThemeSystem = {
    // Default color palettes
    defaultBaseColors: {
        primary: '#48a971',
        secondary: '#5a8db8',
        accent: '#8a7ca8',
        bg1: '#1F2937',
        bg2: '#374151',
        bg3: '#2d3748',
        bg4: '#636B76',
        border: '#000000',
        lines: '#888888',
        text1: '#ffffff',
        text2: '#000000',
        text3: '#b3b9c5',
        white: '#ffffff'
    },

    defaultJobColors: {
        green: '#48a971',
        blue: '#5A8DB8',
        purple: '#8a7ca8',
        red: '#C85A5A',
        orange: '#C7824A',
        teal: '#5AB8A8',
        gold: '#B8B85A',
        brown: '#B87390'
    },

    // Current state
    currentTheme: 'Default Theme',
    baseColors: {},
    jobColors: {},
    selectedColor: { type: 'base', key: 'primary' },
    selectedBaseColor: 'primary',
    selectedJobColor: 'green',
    selectedHarmony: 'complementary',
    expandedCards: {},
deleteConfirmCards: {},
swatchesExpanded: {},
    colorHistories: {},
    colorHistoryIndices: {},
    isUndoRedoAction: false,

    /**
     * Initialize theme system
     */
    initialize() {
        this.injectStyles();
        this.loadSavedTheme();
        this.ensureDefaultTheme();
    },

    /**
     * Inject all CSS styles into document head
     */
    injectStyles() {
        if (document.getElementById('theme-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'theme-system-styles';
        style.textContent = `
            /* Theme Window Overlay */
            #themeWindowOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 10000;
    display: flex;
}

#themeWindow {
    background: var(--bg1);
    width: 100%;
    height: 100%;
    overflow-y: auto;
}

/* Theme Header */
.theme-header {
    background: var(--bg2);
    border-bottom: 3px solid var(--border);
    height: 40px;
    display: flex;
}

.theme-header-back {
    width: 40px;
    height: 40px;
    background: var(--bg2);
    border: none;
    border-right: 3px solid var(--border);
    color: var(--text1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.theme-header-back::after {
    content: '';
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 12px solid var(--text1);
}

.theme-header-back:hover {
    opacity: 0.8;
}

.theme-header-title {
    flex: 1;
    background: var(--bg2);
    border-right: 3px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--text1);
}

.theme-header-unused {
    width: 40px;
    height: 40px;
    background: var(--bg2);
    border: none;
    flex-shrink: 0;
}

            /* Theme Content */
            .theme-content {
                padding: 4px;
            }

            /* Tabs */
            .theme-tabs {
                display: flex;
                background: var(--bg2);
                border: 3px solid var(--border);
                border-radius: 8px;
                height: 24px;
                margin-bottom: 4px;
                overflow: hidden;
            }

            .theme-tab {
                flex: 1;
                background: var(--bg4);
                border-right: 3px solid var(--border);
                color: var(--text3);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 10px;
                font-weight: 700;
            }

            .theme-tab:last-child {
                border-right: none;
            }

            .theme-tab.active {
                background: var(--primary);
                color: var(--text1);
            }

            .theme-tab:not(.active):hover {
                background: #4b5563;
            }

            .theme-tab-content {
                display: none;
            }

            .theme-tab-content.active {
                display: block;
            }

            /* Card */
            .theme-card {
                background: var(--bg3);
                border: 3px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 4px;
            }

            .theme-card-title {
                background: var(--bg4);
                padding: 0;
                height: 24px;
                font-size: 10px;
                font-weight: 700;
                border-bottom: 3px solid var(--border);
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-card-title-with-controls {
                display: flex;
                align-items: stretch;
                justify-content: space-between;
                width: 100%;
            }

            .theme-card-title-text {
                flex: 1;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-undo-redo-btn {
                width: 40px;
                background: var(--bg4);
                border-left: 3px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: var(--text1);
                font-size: 12px;
                font-weight: 700;
                transition: all 0.2s ease;
            }

            .theme-undo-btn {
                border-right: 3px solid var(--border);
                border-left: none;
            }

            .theme-undo-redo-btn:hover:not(.disabled) {
                background: var(--bg2);
            }

            .theme-undo-redo-btn.disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }

            /* Color Preview */
.theme-current-color {
    background: var(--bg2);
    display: flex;
    border-bottom: 3px solid var(--border);
    height: 24px;
}

.theme-color-preview {
    width: 40px;
    background: #48a971;
    border-right: 3px solid var(--border);
    flex-shrink: 0;
}

.theme-color-code {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg4);
    border-right: 3px solid var(--border);
}

.theme-color-code-input {
    width: 90%;
    background: transparent;
    border: none;
    padding: 0;
    font-size: 11px;
    font-weight: 700;
    color: var(--text1);
    text-align: center;
    outline: none;
}

.theme-color-action-section {
    width: 40px;
    background: var(--bg4);
    color: var(--text1);
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 3px solid var(--border);
}

.theme-color-action-section:last-child {
    border-right: none;
}

.theme-color-action-section:hover {
    background: var(--bg2);
}

            .theme-color-action-btn:hover {
                background: var(--bg2);
            }

            .theme-color-action-btn:last-child {
                border-left: 3px solid var(--border);
            }

            /* Sliders */
            .theme-slider-section {
                padding: 6px 8px;
                background: var(--bg2);
                border-bottom: 3px solid var(--border);
            }

            .theme-slider-section:last-child {
                border-bottom: none;
            }

            .theme-slider-row {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
                gap: 5px;
            }

            .theme-slider-row:last-child {
                margin-bottom: 0;
            }

            .theme-slider-label {
                width: 15px;
                font-size: 10px;
                font-weight: 700;
            }

            .theme-slider {
                flex: 1;
                height: 4px;
                -webkit-appearance: none;
                appearance: none;
                background: var(--bg1);
                border: none;
                border-radius: 2px;
                outline: none;
                margin: 4px 0;
            }

            .theme-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: var(--primary);
                border: 3px solid var(--border);
                border-radius: 50%;
                cursor: pointer;
            }

            .theme-slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: var(--primary);
                border: 3px solid var(--border);
                border-radius: 50%;
                cursor: pointer;
            }

            .theme-slider-value {
                width: 30px;
                text-align: center;
                font-size: 11px;
                font-weight: 700;
            }

            /* Demo Cards */
           .theme-demo-card {
    padding: 4px 15px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

            .theme-demo-schedule-card {
                background: var(--bg2);
                border: 3px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
            }

            .theme-demo-day-header {
                height: 15px;
                border-bottom: 3px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 700;
                color: var(--text1);
            }

            .theme-demo-day-timeline {
                display: flex;
                height: 25px;
                border-bottom: 3px solid var(--border);
                background: var(--bg4);
            }

            .theme-demo-timeline-padding {
                width: 8px;
                flex-shrink: 0;
            }

            .theme-demo-timeline-content {
                flex: 1;
                position: relative;
                display: flex;
            }

            .theme-demo-timeline-column {
                flex: 1;
                border-right: 1px solid var(--lines);
            }

            .theme-demo-timeline-column:first-child {
                border-left: 1px solid var(--lines);
            }

            .theme-demo-shift-bar {
    position: absolute;
    left: 25%;
    right: 25%;
                top: 0;
                bottom: 0;
                background: var(--white);
                border: 3px solid var(--secondary);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-demo-shift-title {
                font-size: 10px;
                font-weight: 700;
                color: var(--text2);
            }

            .theme-demo-hours-section {
                height: 15px;
                display: flex;
            }

            .theme-demo-hours-content {
                flex: 1;
                display: flex;
                position: relative;
            }

            .theme-demo-hour-number {
                position: absolute;
                font-size: 9px;
                font-weight: 700;
                color: var(--text1);
                transform: translateX(-50%);
            }

            .theme-demo-hour-number:nth-child(1) { left: 0%; }
.theme-demo-hour-number:nth-child(2) { left: 25%; }
.theme-demo-hour-number:nth-child(3) { left: 50%; }
.theme-demo-hour-number:nth-child(4) { left: 75%; }
.theme-demo-hour-number:nth-child(5) { left: 100%; }
        

            .theme-demo-job-card {
    background: var(--bg2);
    border: 3px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    height: 32px;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

            .theme-demo-job-title-section {
                height: 16px;
                background: var(--accent);
                padding: 0 6px;
          display: flex;
                align-items: center;
                justify-content: center;
                border-bottom: 3px solid var(--border);
            }

            .theme-demo-job-title {
                font-size: 11px;
                font-weight: 600;
                color: var(--text2);
            }

            .theme-demo-job-info-section {
                height: 13px;
                background: var(--bg4);
                padding: 0 6px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-demo-next-shift-time {
                font-size: 10px;
                color: var(--text1);
                line-height: 1;
                font-weight: 600;
                margin-top: -1px;
            }

            .theme-demo-day-card {
                background: var(--bg2);
                border: 3px solid var(--border);
                border-radius: 8px;
                height: 32px;
                display: flex;
                align-items: stretch;
                overflow: hidden;
            }
        
        /* Three Column Row Layout */
.theme-demo-three-column-row {
    display: flex;
    gap: 4px;
}

.theme-demo-three-column-row > * {
    flex: 1;
    min-width: 0;
}

.theme-demo-row {
    display: flex;
    gap: 4px;
}

.theme-demo-row > * {
    flex: 1;
    min-width: 0;
}

/* History Card */
.theme-demo-history-card {
    background: var(--bg2);
    border: 3px solid var(--border);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.theme-demo-history-header {
    height: 15px;
    background: var(--accent);
    border-bottom: 3px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: var(--text2);
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.theme-demo-history-content {
    height: 25px;
    background: var(--bg4);
    border-bottom: 3px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 900;
    color: var(--text1);
    line-height: 1.2;
    flex-shrink: 0;
}

.theme-demo-history-divider {
    width: 80%;
    border-top: 2px solid var(--border);
    margin: 2px 0;
}

.theme-demo-history-hours {
    height: 15px;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: var(--text1);
    flex-shrink: 0;
}

/* Work History Timeline Card */
.theme-demo-timeline-card {
    background: var(--bg2);
    border: 3px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
}

.theme-demo-timeline-years {
    flex: 0 0 33.33%;
    background: var(--bg1);
    border-right: 3px solid var(--border);
    display: flex;
    flex-direction: column;
}

.theme-demo-year-label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 900;
    color: var(--text1);
    border-bottom: 3px solid var(--border);
}

.theme-demo-year-label:last-child {
    border-bottom: none;
}

.theme-demo-timeline-grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
}

.theme-demo-timeline-year {
    flex: 1;
    background: var(--bg4);
    display: flex;
}

.theme-demo-timeline-half {
    flex: 1;
    border-right: 3px solid var(--border);
    display: flex;
    flex-direction: column;
}

.theme-demo-timeline-half:last-child {
    border-right: none;
}

.theme-demo-timeline-month {
    flex: 1;
    border-bottom: 1px solid var(--lines);
}

.theme-demo-timeline-month:last-child {
    border-bottom: none;
}

.theme-demo-job-bar {
    position: absolute;
    width: 20px;
    border: 2px solid var(--border);
    border-radius: 4px;
}

.theme-demo-job-bar.job1 {
    background: var(--secondary);
    right: calc(50% + 5px);
    top: 25%;
    height: 50%;
}

.theme-demo-job-bar.job2 {
    background: var(--primary);
    left: calc(50% + 5px);
    top: 25%;
    height: 50%;
}

            .theme-demo-day-letter {
                width: 20px;
                background: var(--primary);
                border-right: 3px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 700;
                color: var(--text1);
                flex-shrink: 0;
            }

            .theme-demo-day-number {
                width: 20px;
                background: var(--primary);
                border-right: 3px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 700;
                color: var(--text1);
                flex-shrink: 0;
            }

            .theme-demo-day-times {
                flex: 1;
                background: var(--bg4);
                display: flex;
                align-items: center;
                padding: 0;
                gap: 0;
                overflow: hidden;
            }

            .theme-demo-time-field {
                flex: 1;
                font-size: 13px;
                color: var(--text1);
                text-align: center;
                min-width: 0;
                padding: 0 2px;
                border-right: 3px solid var(--border);
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: var(--bg4);
            }

            .theme-demo-time-field.total {
                width: 37px;
    flex: 0 0 37px;
                background: var(--primary);
                color: var(--text1);
                border-right: none;
            }

            /* Action Button */
          .theme-action-button {
    padding: 0;
    height: 24px;
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text1);
}

            .theme-action-button:hover {
                opacity: 0.8;
            }

            .theme-action-button:active {
                opacity: 0.6;
            }

            .theme-save-button {
                background: var(--primary);
            }

            /* Modal */
            .theme-modal-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg1);
    z-index: 10001;
    align-items: center;
    justify-content: center;
}

            .theme-modal-overlay.active {
                display: flex;
            }

            .theme-modal {
                background: var(--bg3);
                border: 3px solid var(--border);
                border-radius: 8px;
                width: 90%;
                max-width: 400px;
                overflow: hidden;
            }

            .theme-modal-header {
                background: var(--bg4);
                padding: 15px;
                font-size: 14px;
                font-weight: 700;
                border-bottom: 3px solid var(--border);
            }

            .theme-modal-body {
                padding: 15px;
            }

            .theme-modal-input {
                width: 100%;
                background: var(--bg4);
                border: 3px solid var(--border);
                border-radius: 8px;
                padding: 10px;
                font-size: 14px;
                color: var(--text1);
                font-weight: 600;
            }

            .theme-modal-input::placeholder {
                color: var(--text3);
            }

            .theme-modal-input:focus {
                outline: none;
                border-color: var(--border);
            }

            .theme-modal-footer {
                display: flex;
                gap: 4px;
                padding: 15px;
                border-top: 3px solid var(--border);
            }

            .theme-modal-button {
                flex: 1;
                background: var(--bg4);
                border: 3px solid var(--border);
                border-radius: 8px;
                padding: 10px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text1);
            }

            .theme-modal-button:hover {
                background: var(--bg2);
            }

            .theme-modal-button.primary {
                background: var(--primary);
                color: var(--text1);
            }

            .theme-modal-button.primary:hover {
                opacity: 0.8;
            }

            /* Saved Themes */
            .theme-saved-list {
                padding: 0px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .theme-saved-item {
                background: var(--bg3);
                border: 3px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
            }

            .theme-empty-state {
                padding: 20px;
                text-align: center;
                color: var(--text3);
                font-size: 14px;
            }

            /* Color Grid */
            .theme-color-grid {
                display: flex;
                gap: 0;
            }

            .theme-color-item {
                flex: 1;
                height: 24px;
                border-right: 3px solid var(--border);
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
            }

            .theme-color-item:last-child {
                border-right: none;
            }

            .theme-color-item:hover {
                opacity: 0.8;
            }

            .theme-color-item.selected::after {
                content: '';
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .theme-color-readout {
                background: var(--bg4);
                padding: 0;
                height: 24px;
                font-size: 10px;
                font-weight: 700;
                border-top: 3px solid var(--border);
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Harmony Buttons */
            .theme-harmony-buttons {
                display: flex;
                gap: 0;
                border-bottom: 3px solid var(--border);
            }

            .theme-harmony-btn {
                flex: 1;
                height: 24px;
                background: var(--bg4);
                border-right: 3px solid var(--border);
                color: var(--text3);
                font-size: 10px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-harmony-btn:last-child {
                border-right: none;
            }

            .theme-harmony-btn.active {
                background: var(--primary);
                color: var(--text1);
            }

            .theme-harmony-btn:not(.active):hover {
                background: var(--bg2);
            }

            .theme-harmony-swatches {
                display: flex;
                gap: 0;
            }

            .theme-harmony-swatch {
                flex: 1;
                height: 24px;
                border-right: 3px solid var(--border);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .theme-harmony-swatch:last-child {
                border-right: none;
            }

            .theme-harmony-swatch:hover {
                opacity: 0.8;
            }
        
        /* Overlay Options */
            .theme-overlay-options {
                background: var(--bg2);
                display: flex;
                height: 24px;
            }

            .theme-overlay-option {
                flex: 1;
                background: var(--bg4);
                color: var(--text1);
                font-size: 9px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 3px solid var(--border);
                text-transform: uppercase;
            }

            .theme-overlay-option:last-child {
                border-right: none;
            }

            .theme-overlay-option:hover {
                background: var(--bg2);
            }

            .theme-overlay-option.active {
                background: var(--primary);
            }

            .theme-close-btn {
                width: 60px;
                height: 40px;
                background: var(--bg2);
                border-left: 3px solid var(--border);
                color: var(--text1);
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .theme-close-btn:hover {
                background: var(--primary);
            }
        `;
        document.head.appendChild(style);
    },

    /**
   /**
 * Render settings card for Settings.js integration
 */
renderSettingsCard() {
    return `
        <div class="theme-settings-card" onclick="ThemeSystem.openThemeWindow()">
            <div class="theme-stripes-top">
                <div class="theme-color-stripe color-blue"></div>
                <div class="theme-color-stripe color-green"></div>
                <div class="theme-color-stripe color-purple"></div>
                <div class="theme-color-stripe color-red"></div>
                <div class="theme-color-stripe color-orange"></div>
                <div class="theme-color-stripe color-teal"></div>
                <div class="theme-color-stripe color-gold"></div>
                <div class="theme-color-stripe color-brown"></div>
            </div>
            <div class="theme-card-content">COLOR THEMES</div>
    
    

            <div class="theme-stripes-bottom">
                <div class="theme-color-stripe color-blue"></div>
                <div class="theme-color-stripe color-green"></div>
                <div class="theme-color-stripe color-purple"></div>
                <div class="theme-color-stripe color-red"></div>
                <div class="theme-color-stripe color-orange"></div>
                <div class="theme-color-stripe color-teal"></div>
                <div class="theme-color-stripe color-gold"></div>
                <div class="theme-color-stripe color-brown"></div>
            </div>
        </div>
    `;
},

    /**
     * Open theme creator window
     */
   openThemeWindow() {
    // Load current theme instead of resetting to defaults
    const savedThemeName = localStorage.getItem('currentTheme');
    if (savedThemeName) {
        const savedThemes = this.getSavedThemes();
        const theme = savedThemes.find(t => t.name === savedThemeName);
        if (theme) {
            // Load the currently active theme
            this.baseColors = { ...theme.baseColors };
            this.jobColors = { ...theme.jobColors };
            this.selectedJobColor = theme.selectedJobColor || 'green';
        } else {
            // Fallback to defaults if theme not found
            this.baseColors = { ...this.defaultBaseColors };
            this.jobColors = { ...this.defaultJobColors };
            this.selectedJobColor = 'green';
        }
    } else {
        // No current theme, use defaults
        this.baseColors = { ...this.defaultBaseColors };
        this.jobColors = { ...this.defaultJobColors };
        this.selectedJobColor = 'green';
    }
    
    // Reset other state
    this.selectedColor = { type: 'base', key: 'primary' };
    this.selectedBaseColor = 'primary';
    this.selectedHarmony = 'complementary';
    this.expandedCards = {};
this.deleteConfirmCards = {};
this.swatchesExpanded = {};
    this.colorHistories = {};
    this.colorHistoryIndices = {};
    this.isUndoRedoAction = false;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'themeWindowOverlay';
    overlay.innerHTML = this.renderThemeWindow();
    document.body.appendChild(overlay);

    // Initialize
    this.initializeThemeCreator();
},

    /**
     * Close theme creator window
     */
    closeThemeWindow() {
        const overlay = document.getElementById('themeWindowOverlay');
        if (overlay) overlay.remove();
    },
    
    /**
 * Switch between tabs
 */
switchTab(tabName) {
    // Remove active from all tabs
    document.querySelectorAll('.theme-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.theme-tab-content').forEach(t => t.classList.remove('active'));
    
    // Add active to selected tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show corresponding content
    if (tabName === 'creator') {
        document.getElementById('themeCreatorTab').classList.add('active');
    } else if (tabName === 'saved') {
        document.getElementById('themeSavedTab').classList.add('active');
        this.renderSavedThemes();
    }
},
    

    /**
     * Render complete theme window HTML
     */
    renderThemeWindow() {
        return `
            <div id="themeWindow">
                <div class="theme-header">
                    <div class="theme-header-title">THEME CREATOR</div>
                    <div class="theme-close-btn" onclick="ThemeSystem.closeThemeWindow()">CLOSE</div>
                </div>
                <div class="theme-content">
                    <div class="theme-tabs">
    <div class="theme-tab active" data-tab="creator" onclick="ThemeSystem.switchTab('creator')">THEME CREATOR</div>
    <div class="theme-tab" data-tab="saved" onclick="ThemeSystem.switchTab('saved')">SAVED THEMES</div>
</div>

                    <div class="theme-tab-content active" id="themeCreatorTab">
                        <div class="theme-card">
                            <div class="theme-card-title">BASE COLORS</div>
                            <div class="theme-color-grid" id="themeBaseColorGrid"></div>
                            <div class="theme-color-readout" id="themeBaseColorReadout">SELECTED: PRIMARY</div>
                        </div>

                        <div class="theme-card">
                            <div class="theme-card-title">JOB COLORS</div>
                            <div class="theme-color-grid" id="themeJobColorGrid"></div>
                            <div class="theme-color-readout" id="themeJobColorReadout">SELECTED: GREEN</div>
                        </div>

                        <div class="theme-card">
                            <div class="theme-card-title">COLOR HARMONY</div>
                            <div class="theme-harmony-buttons">
                                <div class="theme-harmony-btn active" data-harmony="complementary">COM</div>
                                <div class="theme-harmony-btn" data-harmony="analogous">ANA</div>
                                <div class="theme-harmony-btn" data-harmony="triadic">TRI</div>
                                <div class="theme-harmony-btn" data-harmony="tetradic">TET</div>
                                <div class="theme-harmony-btn" data-harmony="split">SPL</div>
                                <div class="theme-harmony-btn" data-harmony="accented">ACC</div>
                                <div class="theme-harmony-btn" data-harmony="fibonacci">FIB</div>
                                <div class="theme-harmony-btn" data-harmony="monochromatic">MON</div>
                            </div>
                            <div class="theme-harmony-swatches" id="themeHarmonySwatches"></div>
                        </div>

                        <div class="theme-card">
                            <div class="theme-card-title">OVERLAYS</div>
                            <div class="theme-overlay-options">
                                <div class="theme-overlay-option active" data-overlay="none">NONE</div>
                                <div class="theme-overlay-option" data-overlay="pixels">PIXELS</div>
                                <div class="theme-overlay-option" data-overlay="static">STATIC</div>
                                <div class="theme-overlay-option" data-overlay="bw">B&W</div>
                                <div class="theme-overlay-option" data-overlay="scan">SCAN</div>
                            </div>
                        </div>

                        <div class="theme-card">
                            <div class="theme-card-title">
                                <div class="theme-card-title-with-controls">
                                    <div class="theme-undo-redo-btn theme-undo-btn disabled" id="themeUndoBtn">◄</div>
                                    <div class="theme-card-title-text">RGB EDITOR</div>
                                    <div class="theme-undo-redo-btn theme-redo-btn disabled" id="themeRedoBtn">►</div>
                                </div>
                            </div>
                           <div class="theme-current-color">
    <div class="theme-color-preview" id="themeColorPreview"></div>
    <div class="theme-color-code">
        <input type="text" class="theme-color-code-input" id="themeColorCodeInput" maxlength="6" value="48A971">
    </div>
    <div class="theme-color-action-section" id="themeCopyBtn">COPY</div>
    <div class="theme-color-action-section" id="themePasteBtn">PASTE</div>
</div>
                            <div class="theme-slider-section">
                                <div class="theme-slider-row">
                                    <div class="theme-slider-label">R</div>
                                    <input type="range" class="theme-slider" id="themeSliderR" min="0" max="255" value="72">
                                    <div class="theme-slider-value" id="themeValueR">72</div>
                                </div>
                                <div class="theme-slider-row">
                                    <div class="theme-slider-label">G</div>
                                    <input type="range" class="theme-slider" id="themeSliderG" min="0" max="255" value="169">
                                    <div class="theme-slider-value" id="themeValueG">169</div>
                                </div>
                                <div class="theme-slider-row">
                                    <div class="theme-slider-label">B</div>
                                    <input type="range" class="theme-slider" id="themeSliderB" min="0" max="255" value="113">
                                    <div class="theme-slider-value" id="themeValueB">113</div>
                                </div>
                            </div>
                            <div class="theme-slider-section">
                                <div class="theme-slider-row">
                                    <div class="theme-slider-label">BR</div>
                                    <input type="range" class="theme-slider" id="themeSliderBrightness" min="0" max="100" value="50">
                                    <div class="theme-slider-value" id="themeValueBrightness">50</div>
                                </div>
                                <div class="theme-slider-row">
                                    <div class="theme-slider-label">SA</div>
                                    <input type="range" class="theme-slider" id="themeSliderSaturation" min="0" max="100" value="50">
                                    <div class="theme-slider-value" id="themeValueSaturation">50</div>
                                </div>
                            </div>
                        </div>
        
        <div class="theme-card">
    <div class="theme-card-title">DEMO CARDS</div>

                       <div class="theme-demo-card">
    <!-- Job Card and Day Card Row -->
    <div class="theme-demo-row">
        <!-- Job Card -->
        <div class="theme-demo-job-card">
            <div class="theme-demo-job-title-section">
                <div class="theme-demo-job-title">JOB TITLE</div>
            </div>
            <div class="theme-demo-job-info-section">
                <div class="theme-demo-next-shift-time">6h 52m</div>
            </div>
        </div>

        <!-- Day Card -->
        <div class="theme-demo-day-card">
            <div class="theme-demo-day-letter">M</div>
            <div class="theme-demo-day-number">15</div>
            <div class="theme-demo-day-times">
                <div class="theme-demo-time-field">9:00</div>
                <div class="theme-demo-time-field">5:00</div>
            </div>
            <div class="theme-demo-time-field total">8.00</div>
        </div>
    </div>

    <!-- Three Column Row: Timeline, Schedule, History -->
    <div class="theme-demo-three-column-row">
        <!-- Work History Timeline Card -->
        <div class="theme-demo-timeline-card">
            <div class="theme-demo-timeline-years">
                <div class="theme-demo-year-label">2025</div>
            </div>
            <div class="theme-demo-timeline-grid">
                <div class="theme-demo-timeline-year">
                    <div class="theme-demo-timeline-half">
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                    </div>
                    <div class="theme-demo-timeline-half">
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                        <div class="theme-demo-timeline-month"></div>
                    </div>
                </div>
                <div class="theme-demo-job-bar job1"></div>
                <div class="theme-demo-job-bar job2"></div>
            </div>
        </div>

        <!-- Schedule Card -->
        <div class="theme-demo-schedule-card">
            <div class="theme-demo-day-header">TODAY</div>
            <div class="theme-demo-day-timeline">
                <div class="theme-demo-timeline-padding"></div>
                <div class="theme-demo-timeline-content">
                    <div class="theme-demo-timeline-column"></div>
                    <div class="theme-demo-timeline-column"></div>
                    <div class="theme-demo-timeline-column"></div>
                    <div class="theme-demo-timeline-column"></div>
                    <div class="theme-demo-shift-bar">
                        <div class="theme-demo-shift-title">10-12</div>
                    </div>
                </div>
                <div class="theme-demo-timeline-padding"></div>
            </div>
            <div class="theme-demo-hours-section">
                <div class="theme-demo-timeline-padding"></div>
                <div class="theme-demo-hours-content">
                    <div class="theme-demo-hour-number">9</div>
                    <div class="theme-demo-hour-number">10</div>
                    <div class="theme-demo-hour-number">11</div>
                    <div class="theme-demo-hour-number">12</div>
                    <div class="theme-demo-hour-number">1</div>
                </div>
                <div class="theme-demo-timeline-padding"></div>
            </div>
        </div>

        <!-- History Card -->
        <div class="theme-demo-history-card">
            <div class="theme-demo-history-header">THIS WEEK</div>
            <div class="theme-demo-history-content">
                10/14
                <div class="theme-demo-history-divider"></div>
                10/20
            </div>
            <div class="theme-demo-history-hours">32.5/40 (38)</div>
        </div>
    </div>
</div>
</div>        
                       

                        <div class="theme-card">
                            <div class="theme-action-button theme-save-button" onclick="ThemeSystem.openSaveModal()">SAVE THEME</div>
                        </div>
                    </div>

                    <div class="theme-tab-content" id="themeSavedTab">
                        <div class="theme-saved-list" id="themeSavedList">
                            <div class="theme-empty-state">No saved themes yet. Create a theme and save it!</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="theme-modal-overlay" id="themeSaveModal">
                <div class="theme-modal">
                    <div class="theme-modal-header">SAVE THEME</div>
                    <div class="theme-modal-body">
                        <input type="text" class="theme-modal-input" id="themeNameInput" placeholder="Enter theme name...">
                    </div>
                    <div class="theme-modal-footer">
                        <button class="theme-modal-button" onclick="ThemeSystem.closeSaveModal()">CANCEL</button>
                        <button class="theme-modal-button primary" onclick="ThemeSystem.confirmSaveTheme()">SAVE</button>
                    </div>
                </div>
            </div>

            <div class="theme-modal-overlay" id="themeOverwriteModal">
                <div class="theme-modal">
                    <div class="theme-modal-header">OVERWRITE THEME?</div>
                    <div class="theme-modal-body">
                        <div style="padding: 10px 0; text-align: center;">A theme with this name already exists. Do you want to overwrite it?</div>
                    </div>
                    <div class="theme-modal-footer">
                        <button class="theme-modal-button" onclick="ThemeSystem.cancelOverwrite()">CANCEL</button>
                        <button class="theme-modal-button primary" onclick="ThemeSystem.confirmOverwrite()">OVERWRITE</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Initialize theme creator functionality
     */
    initializeThemeCreator() {
        this.renderBaseColors();
        this.renderJobColors();
        this.setupSliders();
        this.updateRgbSliders(this.baseColors.primary);
        this.updateCssVariables();
        this.updateQuickScheduleColors();
        this.updateHarmonySwatches();
        this.renderSavedThemes();

        // Initialize history
        const key = this.getColorKey();
        this.colorHistories[key] = [this.baseColors.primary];
        this.colorHistoryIndices[key] = 0;
        this.updateUndoRedoButtons();

        // Setup event listeners
        this.setupEventListeners();
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
    // Tab switching - properly scoped to theme window
    const themeWindow = document.getElementById('themeWindow');
    if (!themeWindow) {
        console.error('Theme window not found when setting up event listeners');
        return;
    }
    
    themeWindow.querySelectorAll('.theme-tab').forEach(tab => {
        tab.onclick = () => {
            const tabName = tab.dataset.tab;
            const wasAlreadyActive = tab.classList.contains('active');
            
            // Remove active from all tabs and content (scoped to theme window)
            themeWindow.querySelectorAll('.theme-tab').forEach(t => t.classList.remove('active'));
            themeWindow.querySelectorAll('.theme-tab-content').forEach(t => t.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Add active to corresponding content
            const contentId = `theme${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`;
            const content = document.getElementById(contentId);
            if (content) {
                content.classList.add('active');
            }
            
            if (tabName === 'saved') {
                if (wasAlreadyActive) {
                    const savedThemes = this.getSavedThemes();
                    const allExpanded = savedThemes.every((_, index) => this.expandedCards[index]);
                    if (allExpanded) {
                        this.expandedCards = {};
                    } else {
                        savedThemes.forEach((_, index) => {
                            this.expandedCards[index] = true;
                        });
                    }
                } else {
                    this.expandedCards = {};
                    this.deleteConfirmCards = {};
                }
                this.renderSavedThemes();
            }
        };
    });

        // Harmony buttons
        document.querySelectorAll('.theme-harmony-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.theme-harmony-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedHarmony = btn.dataset.harmony;
                this.updateHarmonySwatches();
            };
        });
        
// Overlay options
        document.querySelectorAll('.theme-overlay-option').forEach(option => {
            option.onclick = () => {
                document.querySelectorAll('.theme-overlay-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const overlayType = option.dataset.overlay;
                // Add your overlay logic here
                console.log('Selected overlay:', overlayType);
            };
        });

        // Color code input
        const codeInput = document.getElementById('themeColorCodeInput');
        codeInput.oninput = () => {
            let value = codeInput.value.toUpperCase();
            let hasHash = value.startsWith('#');
            let hexPart = hasHash ? value.substring(1) : value;
            hexPart = hexPart.replace(/[^0-9A-F]/g, '');
            if (hexPart.length > 6) hexPart = hexPart.substring(0, 6);
            codeInput.value = hasHash ? '#' + hexPart : hexPart;
            
            if (hexPart.length === 6) {
                const hex = '#' + hexPart;
                this.applyColorFromInput(hex);
            }
        };

        codeInput.onpaste = (e) => {
            e.preventDefault();
            let pastedText = e.clipboardData.getData('text');
            let value = pastedText.trim().toUpperCase();
            let hasHash = value.startsWith('#');
            let hexPart = hasHash ? value.substring(1) : value;
            hexPart = hexPart.replace(/[^0-9A-F]/g, '');
            if (hexPart.length > 6) hexPart = hexPart.substring(0, 6);
            
            if (hexPart.length === 6) {
                codeInput.value = hasHash ? '#' + hexPart : hexPart;
                codeInput.dispatchEvent(new Event('input', { bubbles: true }));
                document.getElementById('themePasteBtn').textContent = 'PASTED!';
                setTimeout(() => {
                    document.getElementById('themePasteBtn').textContent = 'PASTE';
                }, 1000);
            }
        };

        // Copy button
        document.getElementById('themeCopyBtn').onclick = async () => {
            const hexValue = document.getElementById('themeColorCodeInput').value;
            try {
                await navigator.clipboard.writeText(hexValue.startsWith('#') ? hexValue : '#' + hexValue);
                document.getElementById('themeCopyBtn').textContent = 'COPIED!';
                setTimeout(() => {
                    document.getElementById('themeCopyBtn').textContent = 'COPY';
                }, 1000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        };

        // Paste button
        document.getElementById('themePasteBtn').onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                let value = text.trim().toUpperCase();
                let hasHash = value.startsWith('#');
                let hexPart = hasHash ? value.substring(1) : value;
                hexPart = hexPart.replace(/[^0-9A-F]/g, '');
                if (hexPart.length > 6) hexPart = hexPart.substring(0, 6);
                
                if (hexPart.length === 6) {
                    codeInput.value = hasHash ? '#' + hexPart : hexPart;
                    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    document.getElementById('themePasteBtn').textContent = 'PASTED!';
                    setTimeout(() => {
                        document.getElementById('themePasteBtn').textContent = 'PASTE';
                    }, 1000);
                }
            } catch (err) {
                codeInput.focus();
                codeInput.select();
            }
        };

        // Undo/Redo
        document.getElementById('themeUndoBtn').onclick = () => {
            if (!document.getElementById('themeUndoBtn').classList.contains('disabled')) {
                this.undo();
            }
        };

        document.getElementById('themeRedoBtn').onclick = () => {
            if (!document.getElementById('themeRedoBtn').classList.contains('disabled')) {
                this.redo();
            }
        };

        // Save modal enter key
        const nameInput = document.getElementById('themeNameInput');
        if (nameInput) {
            nameInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.confirmSaveTheme();
                }
            };
        }
    },

    /**
     * Render base colors
     */
    renderBaseColors() {
        const grid = document.getElementById('themeBaseColorGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        Object.keys(this.baseColors).forEach(key => {
            const div = document.createElement('div');
            div.className = 'theme-color-item' + (key === this.selectedBaseColor ? ' selected' : '');
            div.style.background = this.baseColors[key];
            div.onclick = () => this.selectColor('base', key, this.baseColors[key]);
            grid.appendChild(div);
        });
    },

    /**
     * Render job colors
     */
    renderJobColors() {
        const grid = document.getElementById('themeJobColorGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        Object.keys(this.jobColors).forEach(key => {
            const div = document.createElement('div');
            div.className = 'theme-color-item' + (key === this.selectedJobColor ? ' selected' : '');
            div.style.background = this.jobColors[key];
            div.onclick = () => this.selectColor('job', key, this.jobColors[key]);
            grid.appendChild(div);
        });
    },

    /**
     * Setup sliders
     */
    setupSliders() {
        ['R', 'G', 'B'].forEach(channel => {
            const slider = document.getElementById(`themeSlider${channel}`);
            const value = document.getElementById(`themeValue${channel}`);
            
            slider.oninput = () => {
                value.textContent = slider.value;
                const r = parseInt(document.getElementById('themeSliderR').value);
                const g = parseInt(document.getElementById('themeSliderG').value);
                const b = parseInt(document.getElementById('themeSliderB').value);
                const hex = this.rgbToHex(r, g, b);
                
                const hsl = this.rgbToHsl(r, g, b);
                document.getElementById('themeSliderBrightness').value = hsl.l;
                document.getElementById('themeSliderSaturation').value = hsl.s;
                document.getElementById('themeValueBrightness').textContent = hsl.l;
                document.getElementById('themeValueSaturation').textContent = hsl.s;
                
                if (this.selectedColor.type === 'base') {
                    this.baseColors[this.selectedColor.key] = hex;
                } else {
                    this.jobColors[this.selectedColor.key] = hex;
                }
                
                document.getElementById('themeColorPreview').style.background = hex;
                document.getElementById('themeColorCodeInput').value = hex.substring(1).toUpperCase();
                this.updateCssVariables();
                this.renderBaseColors();
                this.renderJobColors();
                this.updateHarmonySwatches();
            };
            
            slider.onmouseup = slider.ontouchend = () => {
                this.saveToHistory();
            };
        });
        
        const brightnessSlider = document.getElementById('themeSliderBrightness');
        const brightnessValue = document.getElementById('themeValueBrightness');
        
        brightnessSlider.oninput = () => {
            brightnessValue.textContent = brightnessSlider.value;
            
            const r = parseInt(document.getElementById('themeSliderR').value);
            const g = parseInt(document.getElementById('themeSliderG').value);
            const b = parseInt(document.getElementById('themeSliderB').value);
            const hsl = this.rgbToHsl(r, g, b);
            
            hsl.l = parseInt(brightnessSlider.value);
            const s = parseInt(document.getElementById('themeSliderSaturation').value);
            hsl.s = s;
            
            const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
            const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
            
            document.getElementById('themeSliderR').value = rgb.r;
            document.getElementById('themeSliderG').value = rgb.g;
            document.getElementById('themeSliderB').value = rgb.b;
            document.getElementById('themeValueR').textContent = rgb.r;
            document.getElementById('themeValueG').textContent = rgb.g;
            document.getElementById('themeValueB').textContent = rgb.b;
            
            if (this.selectedColor.type === 'base') {
                this.baseColors[this.selectedColor.key] = hex;
            } else {
                this.jobColors[this.selectedColor.key] = hex;
            }
            
            document.getElementById('themeColorPreview').style.background = hex;
            document.getElementById('themeColorCodeInput').value = hex.substring(1).toUpperCase();
            this.updateCssVariables();
            this.renderBaseColors();
            this.renderJobColors();
            this.updateHarmonySwatches();
        };
        
        brightnessSlider.onmouseup = brightnessSlider.ontouchend = () => {
            this.saveToHistory();
        };
        
        const saturationSlider = document.getElementById('themeSliderSaturation');
        const saturationValue = document.getElementById('themeValueSaturation');
        
        saturationSlider.oninput = () => {
            saturationValue.textContent = saturationSlider.value;
            
            const r = parseInt(document.getElementById('themeSliderR').value);
            const g = parseInt(document.getElementById('themeSliderG').value);
            const b = parseInt(document.getElementById('themeSliderB').value);
            const hsl = this.rgbToHsl(r, g, b);
            
            hsl.s = parseInt(saturationSlider.value);
            const l = parseInt(document.getElementById('themeSliderBrightness').value);
            hsl.l = l;
            
            const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
            const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
            
            document.getElementById('themeSliderR').value = rgb.r;
            document.getElementById('themeSliderG').value = rgb.g;
            document.getElementById('themeSliderB').value = rgb.b;
            document.getElementById('themeValueR').textContent = rgb.r;
            document.getElementById('themeValueG').textContent = rgb.g;
            document.getElementById('themeValueB').textContent = rgb.b;
            
            if (this.selectedColor.type === 'base') {
                this.baseColors[this.selectedColor.key] = hex;
            } else {
                this.jobColors[this.selectedColor.key] = hex;
            }
            
            document.getElementById('themeColorPreview').style.background = hex;
            document.getElementById('themeColorCodeInput').value = hex.substring(1).toUpperCase();
            this.updateCssVariables();
            this.renderBaseColors();
            this.renderJobColors();
            this.updateHarmonySwatches();
        };
        
        saturationSlider.onmouseup = saturationSlider.ontouchend = () => {
            this.saveToHistory();
        };
    },

    /**
     * Update RGB sliders
     */
    updateRgbSliders(hex) {
        const rgb = this.hexToRgb(hex);
        document.getElementById('themeSliderR').value = rgb.r;
        document.getElementById('themeSliderG').value = rgb.g;
        document.getElementById('themeSliderB').value = rgb.b;
        document.getElementById('themeValueR').textContent = rgb.r;
        document.getElementById('themeValueG').textContent = rgb.g;
        document.getElementById('themeValueB').textContent = rgb.b;
        
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        document.getElementById('themeSliderBrightness').value = hsl.l;
        document.getElementById('themeSliderSaturation').value = hsl.s;
        document.getElementById('themeValueBrightness').textContent = hsl.l;
        document.getElementById('themeValueSaturation').textContent = hsl.s;
        
        document.getElementById('themeColorPreview').style.background = hex;
        document.getElementById('themeColorCodeInput').value = hex.substring(1).toUpperCase();
        
        this.updateHarmonySwatches();
    },

    /**
     * Apply color from input
     */
    applyColorFromInput(hex) {
        const rgb = this.hexToRgb(hex);
        
        document.getElementById('themeSliderR').value = rgb.r;
        document.getElementById('themeSliderG').value = rgb.g;
        document.getElementById('themeSliderB').value = rgb.b;
        document.getElementById('themeValueR').textContent = rgb.r;
        document.getElementById('themeValueG').textContent = rgb.g;
        document.getElementById('themeValueB').textContent = rgb.b;
        
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        document.getElementById('themeSliderBrightness').value = hsl.l;
        document.getElementById('themeSliderSaturation').value = hsl.s;
        document.getElementById('themeValueBrightness').textContent = hsl.l;
        document.getElementById('themeValueSaturation').textContent = hsl.s;
        
        document.getElementById('themeColorPreview').style.background = hex;
        
        if (this.selectedColor.type === 'base') {
            this.baseColors[this.selectedColor.key] = hex;
        } else {
            this.jobColors[this.selectedColor.key] = hex;
        }
        
        this.updateCssVariables();
        this.renderBaseColors();
        this.renderJobColors();
        this.updateHarmonySwatches();
        this.saveToHistory();
    },

    /**
     * Select color
     */
    selectColor(type, key, color) {
        this.selectedColor = { type, key };
        
        if (type === 'base') {
            this.selectedBaseColor = key;
            document.getElementById('themeBaseColorReadout').textContent = `SELECTED: ${key.toUpperCase()}`;
        } else {
            this.selectedJobColor = key;
            document.getElementById('themeJobColorReadout').textContent = `SELECTED: ${key.toUpperCase()}`;
            this.updateQuickScheduleColors();
        }
        
        this.renderBaseColors();
        this.renderJobColors();
        this.updateRgbSliders(color);
        this.updateCssVariables();
        this.updateUndoRedoButtons();
        
        const history = this.getCurrentHistory();
        if (history.length > 0) {
            this.saveToHistory();
        }
    },

    /**
     * Update quick schedule colors
     */
    updateQuickScheduleColors() {
    const jobColor = this.jobColors[this.selectedJobColor];
    const header = document.getElementById('themeDemoScheduleHeader');
    const hours = document.getElementById('themeDemoScheduleHours');
    const jobTitleSection = document.querySelector('.theme-demo-job-title-section');
    
    if (header) header.style.background = jobColor;
    if (hours) hours.style.background = jobColor;
    if (jobTitleSection) jobTitleSection.style.background = jobColor;
},

    /**
     * Update CSS variables
     */
    updateCssVariables() {
        const root = document.documentElement;
        Object.keys(this.baseColors).forEach(key => {
            root.style.setProperty(`--${key}`, this.baseColors[key]);
        });
        Object.keys(this.jobColors).forEach(key => {
            root.style.setProperty(`--job-color-${key}`, this.jobColors[key]);
        });
        
        if (this.selectedColor.type === 'job') {
            this.updateQuickScheduleColors();
        }
    },

    /**
     * Color utility functions
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, x)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    },

    /**
     * Sort colors by rainbow order starting from base hue
     */
    sortColorsByRainbow(colorsWithHues, baseHue) {
        // Sort by the original angle (before modulo) to maintain rainbow order across multiple laps
        colorsWithHues.sort((a, b) => a.originalAngle - b.originalAngle);
        return colorsWithHues.map(c => c.color);
    },

    /**
     * Calculate harmony colors
     */
    calculateHarmonyColors(baseHex, harmonyType) {
        const rgb = this.hexToRgb(baseHex);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const colors = [];
        
        switch(harmonyType) {
            case 'analogous':
                const anaOffsets = [0, 15, 30, 45, 60, -15, -30, -45];
                const anaColorsWithHues = anaOffsets.map(offset => {
                    const originalAngle = hsl.h + offset;
                    const h = (originalAngle + 360) % 360;
                    const aRgb = this.hslToRgb(h, hsl.s, hsl.l);
                    return { color: this.rgbToHex(aRgb.r, aRgb.g, aRgb.b), hue: h, originalAngle };
                });
                colors.push(...this.sortColorsByRainbow(anaColorsWithHues, hsl.h));
                break;
                
            case 'accented':
                const accOffsets = [0, 20, -20, 40, 150, 180];
                const accColorsWithHues = accOffsets.map(offset => {
                    const originalAngle = hsl.h + offset;
                    const h = (originalAngle + 360) % 360;
                    const aRgb = this.hslToRgb(h, hsl.s, hsl.l);
                    return { color: this.rgbToHex(aRgb.r, aRgb.g, aRgb.b), hue: h, originalAngle };
                });
                colors.push(...this.sortColorsByRainbow(accColorsWithHues, hsl.h));
                break;
            
            case 'fibonacci':
                const goldenAngle = 137.508;
                const fibColorsWithHues = [];
                for (let i = 0; i < 8; i++) {
                    const originalAngle = hsl.h + (goldenAngle * i);
                    const h = originalAngle % 360;
                    const fRgb = this.hslToRgb(h, hsl.s, hsl.l);
                    fibColorsWithHues.push({ color: this.rgbToHex(fRgb.r, fRgb.g, fRgb.b), hue: h, originalAngle });
                }
                colors.push(...this.sortColorsByRainbow(fibColorsWithHues, hsl.h));
                break;
            
            case 'complementary':
                const compOffsets = [0, 30, -30, 180, 210, 150];
                const compColorsWithHues = compOffsets.map(offset => {
                    const originalAngle = hsl.h + offset;
                    const h = (originalAngle + 360) % 360;
                    const cRgb = this.hslToRgb(h, hsl.s, hsl.l);
                    return { color: this.rgbToHex(cRgb.r, cRgb.g, cRgb.b), hue: h, originalAngle };
                });
                colors.push(...this.sortColorsByRainbow(compColorsWithHues, hsl.h));
                break;
                
            case 'triadic':
                const triColorsWithHues = [];
                for (let i = 0; i < 6; i++) {
                    const originalAngle = hsl.h + (i * 60);
                    const h = originalAngle % 360;
                    const tRgb = this.hslToRgb(h, hsl.s, hsl.l);
                    triColorsWithHues.push({ color: this.rgbToHex(tRgb.r, tRgb.g, tRgb.b), hue: h, originalAngle });
                }
                colors.push(...this.sortColorsByRainbow(triColorsWithHues, hsl.h));
                break;
                
            case 'tetradic':
                const tetColorsWithHues = [];
                for (let i = 0; i < 8; i++) {
                    const originalAngle = hsl.h + (i * 45);
                    const h = originalAngle % 360;
                    const tRgb = this.hslToRgb(h, hsl.s, hsl.l);
                    tetColorsWithHues.push({ color: this.rgbToHex(tRgb.r, tRgb.g, tRgb.b), hue: h, originalAngle });
                }
                colors.push(...this.sortColorsByRainbow(tetColorsWithHues, hsl.h));
                break;
                
            case 'split':
                const splOffsets = [0, 30, -30, 150, 180, 210];
                const splColorsWithHues = splOffsets.map(offset => {
                    const originalAngle = hsl.h + offset;
                    const h = (originalAngle + 360) % 360;
                    const sRgb = this.hslToRgb(h, hsl.s, hsl.l);
                    return { color: this.rgbToHex(sRgb.r, sRgb.g, sRgb.b), hue: h, originalAngle };
                });
                colors.push(...this.sortColorsByRainbow(splColorsWithHues, hsl.h));
                break;
                
            case 'monochromatic':
                const lightnessSteps = [10, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90];
                lightnessSteps.forEach(lightness => {
                    const mRgb = this.hslToRgb(hsl.h, hsl.s, lightness);
                    colors.push(this.rgbToHex(mRgb.r, mRgb.g, mRgb.b));
                });
                break;
        }
        
        return colors;
    },

    /**
     * Update harmony swatches
     */
    updateHarmonySwatches() {
        const currentHex = this.selectedColor.type === 'base' 
            ? this.baseColors[this.selectedColor.key] 
            : this.jobColors[this.selectedColor.key];
        
        const harmonyColors = this.calculateHarmonyColors(currentHex, this.selectedHarmony);
        const swatchesContainer = document.getElementById('themeHarmonySwatches');
        if (!swatchesContainer) return;
        
        swatchesContainer.innerHTML = '';
        
        harmonyColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'theme-harmony-swatch';
            swatch.style.background = color;
            swatch.onclick = () => {
                if (this.selectedColor.type === 'base') {
                    this.baseColors[this.selectedColor.key] = color;
                } else {
                    this.jobColors[this.selectedColor.key] = color;
                }
                this.updateRgbSliders(color);
                this.updateCssVariables();
                this.renderBaseColors();
                this.renderJobColors();
                this.updateHarmonySwatches();
                this.saveToHistory();
            };
            swatchesContainer.appendChild(swatch);
        });
    },

    /**
     * History management
     */
    getColorKey() {
        return `${this.selectedColor.type}-${this.selectedColor.key}`;
    },

    getCurrentHistory() {
        const key = this.getColorKey();
        if (!this.colorHistories[key]) {
            this.colorHistories[key] = [];
            this.colorHistoryIndices[key] = -1;
        }
        return this.colorHistories[key];
    },

    getCurrentHistoryIndex() {
        const key = this.getColorKey();
        if (this.colorHistoryIndices[key] === undefined) {
            this.colorHistoryIndices[key] = -1;
        }
        return this.colorHistoryIndices[key];
    },

    setCurrentHistoryIndex(index) {
        const key = this.getColorKey();
        this.colorHistoryIndices[key] = index;
    },

    saveToHistory() {
        if (this.isUndoRedoAction) return;
        
        const history = this.getCurrentHistory();
        const currentIndex = this.getCurrentHistoryIndex();
        const color = this.selectedColor.type === 'base' 
            ? this.baseColors[this.selectedColor.key] 
            : this.jobColors[this.selectedColor.key];
        
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(color);
        if (newHistory.length > 50) newHistory.shift();
        
        const key = this.getColorKey();
        this.colorHistories[key] = newHistory;
        this.setCurrentHistoryIndex(newHistory.length - 1);
        
        this.updateUndoRedoButtons();
    },

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('themeUndoBtn');
        const redoBtn = document.getElementById('themeRedoBtn');
        if (!undoBtn || !redoBtn) return;
        
        const history = this.getCurrentHistory();
        const currentIndex = this.getCurrentHistoryIndex();
        
        if (currentIndex > 0) {
            undoBtn.classList.remove('disabled');
        } else {
            undoBtn.classList.add('disabled');
        }
        
        if (currentIndex < history.length - 1) {
            redoBtn.classList.remove('disabled');
        } else {
            redoBtn.classList.add('disabled');
        }
    },

    undo() {
        const currentIndex = this.getCurrentHistoryIndex();
        if (currentIndex > 0) {
            this.isUndoRedoAction = true;
            const newIndex = currentIndex - 1;
            this.setCurrentHistoryIndex(newIndex);
            const history = this.getCurrentHistory();
            const color = history[newIndex];
            
            if (this.selectedColor.type === 'base') {
                this.baseColors[this.selectedColor.key] = color;
            } else {
                this.jobColors[this.selectedColor.key] = color;
            }
            
            this.updateRgbSliders(color);
            this.updateCssVariables();
            this.renderBaseColors();
            this.renderJobColors();
            this.updateHarmonySwatches();
            this.updateUndoRedoButtons();
            
            setTimeout(() => { this.isUndoRedoAction = false; }, 100);
        }
    },

    redo() {
        const history = this.getCurrentHistory();
        const currentIndex = this.getCurrentHistoryIndex();
        if (currentIndex < history.length - 1) {
            this.isUndoRedoAction = true;
            const newIndex = currentIndex + 1;
            this.setCurrentHistoryIndex(newIndex);
            const color = history[newIndex];
            
            if (this.selectedColor.type === 'base') {
                this.baseColors[this.selectedColor.key] = color;
            } else {
                this.jobColors[this.selectedColor.key] = color;
            }
            
            this.updateRgbSliders(color);
            this.updateCssVariables();
            this.renderBaseColors();
            this.renderJobColors();
            this.updateHarmonySwatches();
            this.updateUndoRedoButtons();
            
            setTimeout(() => { this.isUndoRedoAction = false; }, 100);
        }
    },

    /**
     * Theme saving/loading
     */
    getSavedThemes() {
        return JSON.parse(localStorage.getItem('savedThemes') || '[]');
    },

    ensureDefaultTheme() {
        let savedThemes = this.getSavedThemes();
        if (savedThemes.length === 0) {
            savedThemes.push({
                name: 'Default Theme',
                baseColors: { ...this.defaultBaseColors },
                jobColors: { ...this.defaultJobColors },
                selectedJobColor: 'green',
                date: new Date().toISOString()
            });
            localStorage.setItem('savedThemes', JSON.stringify(savedThemes));
        }
    },

    openSaveModal() {
        document.getElementById('themeSaveModal').classList.add('active');
        document.getElementById('themeNameInput').value = '';
        document.getElementById('themeNameInput').focus();
    },

    closeSaveModal() {
        document.getElementById('themeSaveModal').classList.remove('active');
    },

    confirmSaveTheme() {
        const name = document.getElementById('themeNameInput').value.trim();
        if (!name) return;
        
        const savedThemes = this.getSavedThemes();
        const existingIndex = savedThemes.findIndex(t => t.name === name);
        
        if (existingIndex !== -1) {
            this.closeSaveModal();
            document.getElementById('themeOverwriteModal').classList.add('active');
        } else {
            this.saveTheme(name);
            this.closeSaveModal();
        }
    },

    cancelOverwrite() {
        document.getElementById('themeOverwriteModal').classList.remove('active');
        document.getElementById('themeSaveModal').classList.add('active');
    },

    confirmOverwrite() {
    const name = document.getElementById('themeNameInput').value.trim();
    if (name) {
        this.saveTheme(name, true);
        document.getElementById('themeOverwriteModal').classList.remove('active');
        document.getElementById('themeSaveModal').classList.remove('active');
    }
},

    saveTheme(name, overwrite = false) {
        const savedThemes = this.getSavedThemes();
        const existingIndex = savedThemes.findIndex(t => t.name === name);
        
        const theme = {
            name: name,
            baseColors: { ...this.baseColors },
            jobColors: { ...this.jobColors },
            selectedJobColor: this.selectedJobColor,
            date: new Date().toISOString()
        };
        
        if (existingIndex !== -1 && overwrite) {
            savedThemes[existingIndex] = theme;
        } else if (existingIndex === -1) {
            savedThemes.push(theme);
        }
        
        localStorage.setItem('savedThemes', JSON.stringify(savedThemes));
        this.renderSavedThemes();
    },

    loadTheme(index) {
    const savedThemes = this.getSavedThemes();
    const theme = savedThemes[index];
    if (!theme) return;
    
    // Apply theme immediately to the app
    this.applyTheme(theme.name);
    
    // Also load into creator for editing
    Object.keys(theme.baseColors).forEach(key => {
        this.baseColors[key] = theme.baseColors[key];
    });
    Object.keys(theme.jobColors).forEach(key => {
        this.jobColors[key] = theme.jobColors[key];
    });
    
    this.selectedJobColor = theme.selectedJobColor || 'green';
    this.selectedBaseColor = 'primary';
    this.selectedColor = { type: 'base', key: 'primary' };
    
    this.updateCssVariables();
    this.updateQuickScheduleColors();
    this.renderBaseColors();
    this.renderJobColors();
    this.updateRgbSliders(this.baseColors.primary);
    
    this.colorHistories = {};
    this.colorHistoryIndices = {};
    const key = this.getColorKey();
    this.colorHistories[key] = [this.baseColors.primary];
    this.colorHistoryIndices[key] = 0;
    this.updateUndoRedoButtons();
    
    document.getElementById('themeBaseColorReadout').textContent = 'SELECTED: PRIMARY';
    document.getElementById('themeJobColorReadout').textContent = `SELECTED: ${this.selectedJobColor.toUpperCase()}`;
    
    // Switch to creator tab
    document.querySelectorAll('.theme-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.theme-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="creator"]').classList.add('active');
    document.getElementById('themeCreatorTab').classList.add('active');
    
    this.currentTheme = theme.name;
    localStorage.setItem('currentTheme', theme.name);
},

    deleteTheme(index) {
    const savedThemes = this.getSavedThemes();
    savedThemes.splice(index, 1);
    localStorage.setItem('savedThemes', JSON.stringify(savedThemes));
    
    // Reset all states
    this.deleteConfirmCards = {};
    this.swatchesExpanded = {}; // ← ADD THIS LINE
    
    this.renderSavedThemes();
},

    showDeleteConfirm(index) {
        this.deleteConfirmCards[index] = true;
        this.renderSavedThemes();
    },

    cancelDelete(index) {
    this.deleteConfirmCards[index] = false;
    this.renderSavedThemes();
},

    toggleTimelineCard(index) {
    this.expandedCards[index] = !this.expandedCards[index];
    this.renderSavedThemes();
},

toggleSwatches(index) {  // ← NEW FUNCTION STARTS HERE
    // Don't allow toggling during delete confirmation
    if (this.deleteConfirmCards[index]) return;
    
    this.swatchesExpanded[index] = !this.swatchesExpanded[index];
    this.renderSavedThemes();
}, 

    /**
     * Render saved themes
     */
    renderSavedThemes() {
    const list = document.getElementById('themeSavedList');
    if (!list) return;
    
    const savedThemes = this.getSavedThemes();
    
    if (savedThemes.length === 0) {
        list.innerHTML = '<div class="theme-empty-state">No saved themes yet. Create a theme and save it!</div>';
        return;
    }
    
    list.innerHTML = '';
    
    savedThemes.forEach((theme, index) => {
        if (!theme || !theme.baseColors || !theme.jobColors) {
            console.warn('Skipping invalid theme:', theme);
            return;
        }
        
        const item = document.createElement('div');
        item.className = 'theme-saved-item';
        item.style.background = theme.baseColors.bg3;
        
        const isDeleteConfirm = this.deleteConfirmCards[index];
        const showSwatches = this.swatchesExpanded[index];
        const canDelete = index !== 0; // First theme (Default) cannot be deleted
        
        // DELETE Button (left 25%)
        let deleteButtonHtml;
        if (isDeleteConfirm) {
            // Show "NO" during delete confirmation
            deleteButtonHtml = `
                <div style="flex: 0 0 calc(25% - 3px); min-width: 0; background: ${theme.baseColors.bg2}; border: 3px solid ${theme.baseColors.border}; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="ThemeSystem.cancelDelete(${index})">
                    <div style="height: 15px; background: ${theme.baseColors.secondary}; border-bottom: 3px solid ${theme.baseColors.border};"></div>
                    <div style="height: 18px; background: ${theme.baseColors.bg4}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: ${theme.baseColors.text1};">NO</div>
                </div>
            `;
        } else {
            // Normal DELETE button
            const deleteClick = canDelete ? `onclick="ThemeSystem.showDeleteConfirm(${index})"` : '';
            const deleteStyle = canDelete ? 'cursor: pointer;' : 'cursor: not-allowed; opacity: 0.5;';
            deleteButtonHtml = `
                <div style="flex: 0 0 calc(25% - 3px); min-width: 0; background: ${theme.baseColors.bg2}; border: 3px solid ${theme.baseColors.border}; border-radius: 8px; overflow: hidden; ${deleteStyle}" ${deleteClick}>
                    <div style="height: 15px; background: ${theme.baseColors.secondary}; border-bottom: 3px solid ${theme.baseColors.border};"></div>
                    <div style="height: 18px; background: ${theme.baseColors.bg4}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: ${theme.baseColors.text1};">DELETE</div>
                </div>
            `;
        }
        
        // CENTER TITLE/SWATCHES Section (middle 50%)
        let centerSectionHtml;
        if (isDeleteConfirm) {
            // Show "DELETE THEME?" during confirmation (no clicking)
            centerSectionHtml = `
                <div style="flex: 0 0 calc(50% - 3px); min-width: 0; background: ${theme.baseColors.bg2}; border: 3px solid ${theme.baseColors.border}; border-radius: 8px; overflow: hidden;">
                    <div style="height: 15px; background: ${theme.baseColors.primary}; border-bottom: 3px solid ${theme.baseColors.border};"></div>
                    <div style="height: 18px; background: ${theme.baseColors.bg4}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: ${theme.baseColors.text1}; text-transform: uppercase;">DELETE THEME?</div>
                </div>
            `;
        } else if (showSwatches) {
            // Show color swatches (full height, clickable to toggle back)
            centerSectionHtml = `
                <div style="flex: 0 0 calc(50% - 3px); min-width: 0; background: ${theme.baseColors.bg2}; border: 3px solid ${theme.baseColors.border}; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="ThemeSystem.toggleSwatches(${index})">
                    <div style="display: flex; gap: 0; height: 33px;">
                        <div style="flex: 1; background: ${theme.jobColors.red}; border-right: 3px solid ${theme.baseColors.border};"></div>
                        <div style="flex: 1; background: ${theme.jobColors.orange}; border-right: 3px solid ${theme.baseColors.border};"></div>
                        <div style="flex: 1; background: ${theme.jobColors.gold}; border-right: 3px solid ${theme.baseColors.border};"></div>
                        <div style="flex: 1; background: ${theme.jobColors.green}; border-right: 3px solid ${theme.baseColors.border};"></div>
                        <div style="flex: 1; background: ${theme.jobColors.teal}; border-right: 3px solid ${theme.baseColors.border};"></div>
                        <div style="flex: 1; background: ${theme.jobColors.blue}; border-right: 3px solid ${theme.baseColors.border};"></div>
                        <div style="flex: 1; background: ${theme.jobColors.purple}; border-right: 3px solid ${theme.baseColors.border};"></div>
                        <div style="flex: 1; background: ${theme.jobColors.brown};"></div>
                    </div>
                </div>
            `;
        } else {
            // Show title (top colored bar + bottom grey section, clickable to toggle)
            centerSectionHtml = `
                <div style="flex: 0 0 calc(50% - 3px); min-width: 0; background: ${theme.baseColors.bg2}; border: 3px solid ${theme.baseColors.border}; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="ThemeSystem.toggleSwatches(${index})">
                    <div style="height: 15px; background: ${theme.baseColors.primary}; border-bottom: 3px solid ${theme.baseColors.border};"></div>
                    <div style="height: 18px; background: ${theme.baseColors.bg4}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: ${theme.baseColors.text1}; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 6px;">${theme.name}</div>
                </div>
            `;
        }
        
        // LOAD Button (right 25%, or YES during confirmation)
        let loadButtonHtml;
        if (isDeleteConfirm) {
            // Show "YES" during delete confirmation
            loadButtonHtml = `
                <div style="flex: 0 0 calc(25% - 3px); min-width: 0; background: ${theme.baseColors.bg2}; border: 3px solid ${theme.baseColors.border}; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="ThemeSystem.deleteTheme(${index})">
                    <div style="height: 15px; background: ${theme.baseColors.accent}; border-bottom: 3px solid ${theme.baseColors.border};"></div>
                    <div style="height: 18px; background: ${theme.baseColors.bg4}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: ${theme.baseColors.text1};">YES</div>
                </div>
            `;
        } else {
            // Normal LOAD button
            loadButtonHtml = `
                <div style="flex: 0 0 calc(25% - 3px); min-width: 0; background: ${theme.baseColors.bg2}; border: 3px solid ${theme.baseColors.border}; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="ThemeSystem.loadTheme(${index})">
                    <div style="height: 15px; background: ${theme.baseColors.accent}; border-bottom: 3px solid ${theme.baseColors.border};"></div>
                    <div style="height: 18px; background: ${theme.baseColors.bg4}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: ${theme.baseColors.text1};">LOAD</div>
                </div>
            `;
        }
        
        // Assemble the complete card
        item.innerHTML = `
            <div style="padding: 4px; display: flex; gap: 4px;">
                ${deleteButtonHtml}
                ${centerSectionHtml}
                ${loadButtonHtml}
            </div>
        `;
        
        list.appendChild(item);
    });
},

    /**
     * Apply theme to app (called from saved themes)
     */
    applyTheme(themeName) {
        const savedThemes = this.getSavedThemes();
        const theme = savedThemes.find(t => t.name === themeName);
        
        if (!theme) return;
        
        // Overwrite CSS variables
        const root = document.documentElement;
        Object.keys(theme.baseColors).forEach(key => {
            root.style.setProperty(`--${key}`, theme.baseColors[key]);
        });
        Object.keys(theme.jobColors).forEach(key => {
            root.style.setProperty(`--job-color-${key}`, theme.jobColors[key]);
        });
        
        // Save current theme
        this.currentTheme = themeName;
        localStorage.setItem('currentTheme', themeName);
        
        console.log(`Theme "${themeName}" applied successfully`);
    },

    /**
     * Load saved theme on app start
     */
    loadSavedTheme() {
        const savedThemeName = localStorage.getItem('currentTheme');
        if (savedThemeName) {
            this.currentTheme = savedThemeName;
            this.applyTheme(savedThemeName);
        }
    }
};

// Apply saved theme IMMEDIATELY (before DOM loads)
ThemeSystem.loadSavedTheme();

// Then do the rest of initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ThemeSystem.injectStyles();
        ThemeSystem.ensureDefaultTheme();
    });
} else {
    ThemeSystem.injectStyles();
    ThemeSystem.ensureDefaultTheme();
}