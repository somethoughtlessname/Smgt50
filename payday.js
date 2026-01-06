// payday.js - Payday Tracking Module
// FIXED: Uses event delegation to prevent event listener stacking

const PaydayModule = (() => {
    // Track initialized containers to prevent duplicate event delegation
    const initializedContainers = new WeakSet();
    
    // Inject CSS
    const injectStyles = () => {
        if (document.querySelector('#payday-styles')) return; // Already injected
        
        const style = document.createElement('style');
        style.id = 'payday-styles';
        style.textContent = `
            /* Payday Settings Card */
            .payday-setting-row {
                display: flex;
                flex-direction: column;
                background: var(--bg3);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                overflow: hidden;
                margin-bottom: var(--gap);
                transition: opacity 0.2s ease;
            }
            .payday-setting-row.disabled { opacity: 0.5; }
            .payday-setting-row.disabled .payday-setting-bottom-section { pointer-events: none; }
            
            .payday-setting-top-section {
                display: flex;
                height: 44px;
                width: 100%;
                border-bottom: var(--b) solid var(--border);
            }
            
            .payday-checkbox-section {
                flex: 0 0 42.5px;
                height: 44px;
                background: var(--bg3);
                border-right: 3px solid var(--border);
                border-bottom: 3px solid var(--border);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
                position: relative;
            }
            .payday-checkbox-section:hover { background: var(--bg2); }
            .payday-checkbox-section.checked { background: var(--primary); }
            .payday-checkbox-section.checked::after {
                content: '✓';
                color: white;
                font-size: 24px;
                font-weight: 900;
                position: absolute;
            }
            
            .payday-setting-label {
                flex: 1;
                background: var(--bg3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: var(--text1);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .payday-setting-bottom-section {
                background: var(--bg4);
                display: flex;
                flex-direction: column;
                width: 100%;
            }
            
            .payday-label-row {
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
            .payday-label-row.grayed { opacity: 0.3; }
            
            .payday-day-selection-row {
                height: 20px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
            }
            
            .payday-day-button {
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
                transition: background 0.2s ease;
            }
            .payday-day-button:last-child { border-right: none; }
            .payday-day-button:hover { background: var(--bg2); }
            .payday-day-button.selected { background: var(--primary); }
            
            .payday-frequency-row {
                height: 20px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
            }
            
            .payday-frequency-button {
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
                transition: background 0.2s ease;
            }
            .payday-frequency-button:last-child { border-right: none; }
            .payday-frequency-button:hover { background: var(--bg2); }
            .payday-frequency-button.selected { background: var(--primary); }
            
            .payday-sync-row {
                height: 20px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
            }
            .payday-sync-row.grayed { pointer-events: none; }
            .payday-sync-row.grayed .payday-sync-button { opacity: 0.3; }
            
            .payday-sync-button {
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
                transition: background 0.2s ease;
            }
            .payday-sync-button:last-child { border-right: none; }
            .payday-sync-button:hover { background: var(--bg2); }
            .payday-sync-button.selected { background: var(--job-color-blue); }
            
            .payday-wage-control-row {
                height: 20px;
                background: var(--bg4);
                display: flex;
            }
            
            .payday-wage-button {
                flex: 0.33;
                background: var(--bg3);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .payday-wage-button:hover { background: var(--bg2); }
            
            .payday-wage-display {
                flex: 1.01;
                background: var(--bg1);
                border-right: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 900;
                color: var(--text1);
            }
            
            /* Payday Preview Card */
            .payday-card {
                display: flex;
                flex-direction: column;
                background: var(--bg3);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                overflow: hidden;
                margin-bottom: var(--gap);
                box-sizing: border-box;
            }
            
            .payday-title-section {
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 40px;
                border-bottom: 3px solid var(--border);
                transition: background 0.3s ease;
            }
            
            .payday-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--border);
            }
            
            .payday-content {
                background: var(--dark-grey);
                padding: 8px 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                width: 100%;
                box-sizing: border-box;
            }
            
            .payday-date {
                font-size: 15px;
                font-weight: 600;
                color: var(--text1);
                max-width: 100%;
                word-wrap: break-word;
            }
            
            .payday-progress-bar-container {
                width: 100%;
                max-width: 100%;
                height: 24px;
                background: var(--bg3);
                border: var(--b) solid var(--border);
                border-radius: 8px;
                overflow: hidden;
                position: relative;
                cursor: pointer;
                transition: background 0.2s ease;
                box-sizing: border-box;
            }
            .payday-progress-bar-container:hover { background: var(--bg2); }
            
            .payday-progress-bar-fill {
                height: 100%;
                transition: width 0.3s ease, background 0.3s ease;
            }
            
            .payday-progress-bar-text {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 700;
                color: var(--text1);
            }
        `;
        document.head.appendChild(style);
    };

    // Create settings card HTML
    const createSettingsCard = (jobId, settings) => {
        return `
            <div class="payday-setting-row ${settings.enabled ? '' : 'disabled'}" data-job-id="${jobId}">
                <div class="payday-setting-top-section">
                    <div class="payday-checkbox-section ${settings.enabled ? 'checked' : ''}" data-action="toggle-enabled"></div>
                    <div class="payday-setting-label">PAYDAY TRACKING</div>
                </div>
                <div class="payday-setting-bottom-section">
                    <div class="payday-label-row">PAYDAY IS ON...</div>
                    <div class="payday-day-selection-row">
                        ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => `
                            <div class="payday-day-button ${settings.paydayDay === i ? 'selected' : ''}" data-action="select-day" data-day="${i}">${day}</div>
                        `).join('')}
                    </div>
                    <div class="payday-label-row">PAY PERIOD</div>
                    <div class="payday-frequency-row">
                        <div class="payday-frequency-button ${settings.frequency === 'weekly' ? 'selected' : ''}" data-action="select-frequency" data-frequency="weekly">WEEKLY</div>
                        <div class="payday-frequency-button ${settings.frequency === 'biweekly' ? 'selected' : ''}" data-action="select-frequency" data-frequency="biweekly">BI-WEEKLY</div>
                    </div>
                    <div class="payday-label-row ${settings.frequency === 'weekly' ? 'grayed' : ''}" data-sync-label>SYNC PAY PERIOD</div>
                    <div class="payday-sync-row ${settings.frequency === 'weekly' ? 'grayed' : ''}" data-sync-row>
                        <div class="payday-sync-button ${settings.sync === 'this' ? 'selected' : ''}" data-action="select-sync" data-sync="this">THIS WEEK</div>
                        <div class="payday-sync-button ${settings.sync === 'last' ? 'selected' : ''}" data-action="select-sync" data-sync="last">LAST WEEK</div>
                    </div>
                    <div class="payday-label-row">HOURLY WAGE</div>
                    <div class="payday-wage-control-row">
                        <div class="payday-wage-button" data-action="adjust-wage" data-amount="-1">-1</div>
                        <div class="payday-wage-button" data-action="adjust-wage" data-amount="-0.1">-.1</div>
                        <div class="payday-wage-button" data-action="adjust-wage" data-amount="-0.01">-.01</div>
                        <div class="payday-wage-display">$${settings.wage.toFixed(2)}</div>
                        <div class="payday-wage-button" data-action="adjust-wage" data-amount="0.01">+.01</div>
                        <div class="payday-wage-button" data-action="adjust-wage" data-amount="0.1">+.1</div>
                        <div class="payday-wage-button" data-action="adjust-wage" data-amount="1">+1</div>
                    </div>
                </div>
            </div>
        `;
    };

    // Create preview card HTML
    const createPreviewCard = (jobId, settings, jobColor) => {
        if (!settings.enabled) return '';

        const { date, daysUntil } = getNextPayday(settings);
        const isToday = daysUntil === 0;
        const dateStr = date.toLocaleDateString('en-US', { 
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
        });

        const periodDays = settings.frequency === 'weekly' ? 7 : 14;
        const daysComplete = isToday ? periodDays : periodDays - daysUntil;
        const progress = Math.min(100, Math.max(0, (daysComplete / periodDays) * 100));
        const hoursWorked = daysComplete * 8;
        const earnings = (hoursWorked * settings.wage).toFixed(2);

        const titleText = isToday ? 'TODAY IS PAYDAY!' : 'NEXT PAYDAY';
        const backgroundColor = isToday ? 'var(--job-color-gold)' : jobColor;
        const progressText = settings.showEarnings 
            ? `${hoursWorked}h • $${earnings}`
            : `${daysComplete} / ${periodDays} DAYS`;

        return `
            <div class="payday-card" data-job-id="${jobId}">
                <div class="payday-title-section" style="background: ${backgroundColor};">
                    <div class="payday-title">${titleText}</div>
                </div>
                <div class="payday-content">
                    <div class="payday-date">${dateStr}</div>
                    <div class="payday-progress-bar-container" data-action="toggle-earnings">
                        <div class="payday-progress-bar-fill" style="width: ${progress}%; background: ${backgroundColor};"></div>
                        <div class="payday-progress-bar-text">${progressText}</div>
                    </div>
                </div>
            </div>
        `;
    };

    // Calculate next payday
    const getNextPayday = (settings) => {
        const today = new Date();
        const todayDay = today.getDay();
        const targetDay = settings.paydayDay;
        let daysUntil = (targetDay - todayDay + 7) % 7;

        if (settings.frequency === 'biweekly' && settings.sync === 'last') {
            daysUntil += 7;
        }

        const nextPayday = new Date(today);
        if (daysUntil > 0) {
            nextPayday.setDate(today.getDate() + daysUntil);
        }
        return { date: nextPayday, daysUntil };
    };

    // Default settings
    const getDefaultSettings = () => ({
        enabled: false,
        paydayDay: 5,
        frequency: 'biweekly',
        sync: 'this',
        wage: 15.00,
        showEarnings: false
    });

    // Storage management
    const storage = {
        get: (jobId) => {
            const key = `payday_${jobId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : getDefaultSettings();
        },
        set: (jobId, settings) => {
            const key = `payday_${jobId}`;
            localStorage.setItem(key, JSON.stringify(settings));
        }
    };

    // Handle settings clicks using event delegation
    const handleSettingsClick = (e, jobId, settingsContainer, previewContainer, jobColor) => {
        const action = e.target.dataset.action;
        if (!action) return;

        const settings = storage.get(jobId);

        switch (action) {
            case 'toggle-enabled':
                settings.enabled = !settings.enabled;
                break;
            case 'select-day':
                settings.paydayDay = parseInt(e.target.dataset.day);
                break;
            case 'select-frequency':
                settings.frequency = e.target.dataset.frequency;
                if (settings.frequency === 'weekly') {
                    settings.sync = null;
                } else if (!settings.sync) {
                    settings.sync = 'this';
                }
                break;
            case 'select-sync':
                if (settings.frequency !== 'weekly') {
                    settings.sync = e.target.dataset.sync;
                }
                break;
            case 'adjust-wage':
                const amount = parseFloat(e.target.dataset.amount);
                settings.wage = Math.max(0, parseFloat((settings.wage + amount).toFixed(2)));
                break;
        }

        storage.set(jobId, settings);
        settingsContainer.innerHTML = createSettingsCard(jobId, settings);
        previewContainer.innerHTML = createPreviewCard(jobId, settings, jobColor);
    };

    // Handle preview clicks using event delegation
    const handlePreviewClick = (e, jobId, settingsContainer, previewContainer, jobColor) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'toggle-earnings') {
            const settings = storage.get(jobId);
            settings.showEarnings = !settings.showEarnings;
            storage.set(jobId, settings);
            previewContainer.innerHTML = createPreviewCard(jobId, settings, jobColor);
        }
    };

    // Initialize for a specific job
    const initializeJob = (jobId, settingsContainer, previewContainer, jobColor) => {
        const settings = storage.get(jobId);

        // Render HTML
        settingsContainer.innerHTML = createSettingsCard(jobId, settings);
        previewContainer.innerHTML = createPreviewCard(jobId, settings, jobColor);

        // Use event delegation - only attach listeners ONCE per container
        if (!initializedContainers.has(settingsContainer)) {
            settingsContainer.addEventListener('click', (e) => {
                const jobIdAttr = e.target.closest('[data-job-id]')?.dataset.jobId;
                if (jobIdAttr) {
                    handleSettingsClick(e, jobIdAttr, settingsContainer, previewContainer, jobColor);
                }
            });
            initializedContainers.add(settingsContainer);
        }

        if (!initializedContainers.has(previewContainer)) {
            previewContainer.addEventListener('click', (e) => {
                const jobIdAttr = e.target.closest('[data-job-id]')?.dataset.jobId;
                if (jobIdAttr) {
                    handlePreviewClick(e, jobIdAttr, settingsContainer, previewContainer, jobColor);
                }
            });
            initializedContainers.add(previewContainer);
        }
    };

    // Public API
    return {
        init: () => {
            injectStyles();
        },
        initializeJob,
        storage
    };
})();

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PaydayModule.init());
} else {
    PaydayModule.init();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaydayModule;
}