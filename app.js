// === APPLICATION STATE ===
let jobs = [];
let currentJobId = null;
let currentSubTab = 'scheduled'; // 'scheduled' or 'worked'
let currentViewMode = 'standard'; // 'standard', 'simple', or 'full'
let previousViewMode = 'standard'; // Track previous mode for full view return
let compactJobCards = false; // Compact job cards setting

// === QUICK SCHEDULE SETTINGS ===
let quickScheduleSettings = {
    enabled: true,
    color: 'purple', // default color
    daysToShow: 7    // default 7 days
};

// === HISTORY SETTINGS ===
let historySettings = {
    enabled: true,
    color: 'purple', // default color
    showThisNextWeek: true, // Show THIS WEEK and NEXT WEEK cards
    showLastWeek: true, // Show LAST WEEK section
    weekCount: 5 // Number of weeks to show in LAST X WEEKS section (1-8)
};

// === SECTION MANAGEMENT ===
let mainScreenSections = [
    { id: 'nextShift', name: 'Jobs', visible: true, locked: true },
    { id: 'quickSchedule', name: 'Quick Schedule', visible: true, locked: false },
    { id: 'history', name: 'History', visible: true, locked: false }
];

// === DYNAMIC MODULE REGISTRATION SYSTEM ===
window.registerSection = function(section) {
    // Check if section already exists
    const existing = mainScreenSections.find(s => s.id === section.id);
    if (!existing) {
        mainScreenSections.push(section);
        console.log('✅ Registered section:', section.id);
    }
};

window.sectionRenderers = {};
window.settingsRenderers = {};
window.moduleSettings = {}; // Store settings for each module

// === LOCAL STORAGE FUNCTIONS ===
function saveData() {
    try {
        const dataToSave = {
            jobs: jobs,
            lastUpdated: Date.now(),
            version: '1.0',
            compactJobCards: window.compactJobCards !== undefined ? window.compactJobCards : compactJobCards,
            mainScreenSections: mainScreenSections,
            quickScheduleSettings: quickScheduleSettings,
            historySettings: historySettings,
            moduleSettings: window.moduleSettings,  // ← ADD THIS LINE
            splashSettings: typeof SplashSystem !== 'undefined' ? {
                enabled: SplashSystem.config.enabled,
                type: SplashSystem.config.type,
                duration: SplashSystem.config.duration
            } : { enabled: true, type: 'circle', duration: 3 }
        };
        localStorage.setItem('scheduleManagerData', JSON.stringify(dataToSave));
        console.log('✅ Data saved to localStorage');
    } catch (error) {
        console.error('❌ Failed to save data:', error);
    }
}

function loadData() {
    try {
        const savedData = localStorage.getItem('scheduleManagerData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.jobs && Array.isArray(parsedData.jobs)) {
                jobs = parsedData.jobs;
                
                // Load compact setting (default to false if not set)
                compactJobCards = parsedData.compactJobCards || false;
                
                // Load Quick Schedule settings (default values if not set)
                if (parsedData.quickScheduleSettings) {
                    quickScheduleSettings = {
                        enabled: parsedData.quickScheduleSettings.enabled !== undefined ? parsedData.quickScheduleSettings.enabled : true,
                        color: parsedData.quickScheduleSettings.color || 'purple',
                        daysToShow: parsedData.quickScheduleSettings.daysToShow || 7
                    };
                } else {
                    quickScheduleSettings = {
                        enabled: true,
                        color: 'purple',
                        daysToShow: 7
                    };
                }
                
                // Load History settings (default values if not set)
                if (parsedData.historySettings) {
                    historySettings = {
                        enabled: parsedData.historySettings.enabled !== undefined ? parsedData.historySettings.enabled : true,
                        color: parsedData.historySettings.color || 'purple',
                        showThisNextWeek: parsedData.historySettings.showThisNextWeek !== undefined ? parsedData.historySettings.showThisNextWeek : true,
                        showLastWeek: parsedData.historySettings.showLastWeek !== undefined ? parsedData.historySettings.showLastWeek : true,
                        weekCount: parsedData.historySettings.weekCount || 5
                    };
                } else {
                    historySettings = {
                        enabled: true,
                        color: 'purple',
                        showThisNextWeek: true,
                        showLastWeek: true,
                        weekCount: 5
                    };
                }
                
                // Load module settings
if (parsedData.moduleSettings) {
    window.moduleSettings = parsedData.moduleSettings;
    console.log('✅ Loaded module settings');
} else {
    window.moduleSettings = {};
}
                
                // Load section settings (default to standard if not set)
                if (parsedData.mainScreenSections && Array.isArray(parsedData.mainScreenSections)) {
                    mainScreenSections = parsedData.mainScreenSections;
                } else {
                    // Default sections
                    mainScreenSections = [
                        { id: 'nextShift', name: 'Jobs', visible: true, locked: true },
                        { id: 'quickSchedule', name: 'Quick Schedule', visible: true, locked: false },
                        { id: 'history', name: 'History', visible: true, locked: false }
                    ];
                }
                
                // Load Splash settings (default values if not set)
if (typeof SplashSystem !== 'undefined') {
    if (parsedData.splashSettings) {
        SplashSystem.config.enabled = parsedData.splashSettings.enabled !== undefined 
            ? parsedData.splashSettings.enabled 
            : true;
        SplashSystem.config.type = parsedData.splashSettings.type || 'circle';
        SplashSystem.config.duration = parsedData.splashSettings.duration || 3;
        SplashSystem.config.loop = parsedData.splashSettings.loop !== undefined
            ? parsedData.splashSettings.loop
            : false;
    }
}

console.log('✅ Loaded from localStorage:', jobs.length, 'jobs');
return true;
            }
        }
        console.log('ℹ️ No saved data found');
        return false;
    } catch (error) {
        console.error('❌ Failed to load data:', error);
        return false;
    }
}

function clearData() {
    try {
        localStorage.removeItem('scheduleManagerData');
        jobs = [];
        console.log('✅ Data cleared');
    } catch (error) {
        console.error('❌ Failed to clear data:', error);
    }
}

// === QUICK SCHEDULE SETTINGS FUNCTIONS ===
function updateQuickScheduleColor(color) {
    quickScheduleSettings.color = color;
    
    // Update QuickScheduleGrid config immediately
    if (typeof QuickScheduleGrid !== 'undefined') {
        QuickScheduleGrid.config.color = color;
    }
    
    saveData();
    updateQuickScheduleDisplay();
    updateQuickScheduleSettingsUI();
}

function updateQuickScheduleDays(days) {
    quickScheduleSettings.daysToShow = days;
    
    // Update QuickScheduleGrid config immediately
    if (typeof QuickScheduleGrid !== 'undefined') {
        QuickScheduleGrid.config.daysToShow = days;
    }
    
    saveData();
    updateQuickScheduleDisplay();
    updateQuickScheduleSettingsUI();
}

function toggleQuickScheduleCheckbox() {
    const section = mainScreenSections.find(s => s.id === 'quickSchedule');
    if (section) {
        section.visible = !section.visible;
        saveData();
        renderJobs();
        updateQuickScheduleSettingsUI();
    }
}

function updateQuickScheduleSettingsUI() {
    // Update color selection
    document.querySelectorAll('#quickScheduleRow .blank-section').forEach(section => {
        section.classList.remove('selected');
    });
    const selectedColorSection = document.querySelector(`#quickScheduleRow .blank-section.color-${quickScheduleSettings.color}`);
    if (selectedColorSection) {
        selectedColorSection.classList.add('selected');
    }
    
    // Update day count selection
    document.querySelectorAll('#quickScheduleRow .day-section').forEach(section => {
        section.classList.remove('selected');
    });
    const selectedDaySection = document.querySelector(`#quickScheduleRow .day-section[data-days="${quickScheduleSettings.daysToShow}"]`);
    if (selectedDaySection) {
        selectedDaySection.classList.add('selected');
    }
    
    // Update checkbox state
    const checkbox = document.getElementById('quickScheduleCheckbox');
    const quickScheduleSection = mainScreenSections.find(s => s.id === 'quickSchedule');
    if (checkbox && quickScheduleSection) {
        if (quickScheduleSection.visible) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    }
    
    // Update disabled state
    const row = document.getElementById('quickScheduleRow');
    if (row && quickScheduleSection) {
        if (quickScheduleSection.visible) {
            row.classList.remove('disabled');
        } else {
            row.classList.add('disabled');
        }
    }
    
    // Update up/down button states
    const quickScheduleIndex = mainScreenSections.findIndex(s => s.id === 'quickSchedule');
    const upBtn = document.getElementById('quickScheduleUpBtn');
    const downBtn = document.getElementById('quickScheduleDownBtn');
    
    if (upBtn && downBtn) {
        const newUpBtn = upBtn.cloneNode(true);
        const newDownBtn = downBtn.cloneNode(true);
        upBtn.parentNode.replaceChild(newUpBtn, upBtn);
        downBtn.parentNode.replaceChild(newDownBtn, downBtn);
        
        newUpBtn.addEventListener('click', () => {
            if (quickScheduleIndex > 0) {
                // Swap with section above
                const temp = mainScreenSections[quickScheduleIndex];
                mainScreenSections[quickScheduleIndex] = mainScreenSections[quickScheduleIndex - 1];
                mainScreenSections[quickScheduleIndex - 1] = temp;
                
                saveData();
                renderJobs();
                updateSectionSettingsDisplay();
            }
        });
        
        newDownBtn.addEventListener('click', () => {
            if (quickScheduleIndex < mainScreenSections.length - 1) {
                // Swap with section below
                const temp = mainScreenSections[quickScheduleIndex];
                mainScreenSections[quickScheduleIndex] = mainScreenSections[quickScheduleIndex + 1];
                mainScreenSections[quickScheduleIndex + 1] = temp;
                
                saveData();
                renderJobs();
                updateSectionSettingsDisplay();
            }
        });
    }
}

// === HISTORY SETTINGS FUNCTIONS ===
function updateHistoryColor(color) {
    historySettings.color = color;
    
    // Update HistorySystem config immediately
    if (typeof HistorySystem !== 'undefined') {
        HistorySystem.config = HistorySystem.config || {};
        HistorySystem.config.color = color;
    }
    
    saveData();
    updateHistoryDisplay();
    updateHistorySettingsUI();
}

function updateHistoryWeekCount(count) {
    historySettings.weekCount = count;
    
    // Update HistorySystem config immediately
    if (typeof HistorySystem !== 'undefined') {
        HistorySystem.config = HistorySystem.config || {};
        HistorySystem.config.weekCount = count;
    }
    
    saveData();
    updateHistoryDisplay();
    updateHistorySettingsUI();
}

function toggleHistoryWeekOption(option) {
    // Prevent deselecting if it's the only one selected
    const otherOption = option === 'thisNextWeek' ? 'lastWeek' : 'thisNextWeek';
    const otherKey = option === 'thisNextWeek' ? 'showLastWeek' : 'showThisNextWeek';
    
    if (historySettings[option === 'thisNextWeek' ? 'showThisNextWeek' : 'showLastWeek'] && !historySettings[otherKey]) {
        return;
    }
    
    historySettings[option === 'thisNextWeek' ? 'showThisNextWeek' : 'showLastWeek'] = !historySettings[option === 'thisNextWeek' ? 'showThisNextWeek' : 'showLastWeek'];
    
    if (typeof HistorySystem !== 'undefined') {
        HistorySystem.config = HistorySystem.config || {};
        HistorySystem.config.showThisNextWeek = historySettings.showThisNextWeek;
        HistorySystem.config.showLastWeek = historySettings.showLastWeek;
    }
    
    saveData();
    updateHistoryDisplay();
    updateHistorySettingsUI();
}

function toggleHistoryCheckbox() {
    const section = mainScreenSections.find(s => s.id === 'history');
    if (section) {
        section.visible = !section.visible;
        saveData();
        renderJobs();
        updateHistorySettingsUI();
    }
}

function updateHistorySettingsUI() {
    // Update color selection
    document.querySelectorAll('#historyRow .color-section').forEach(section => {
        section.classList.remove('selected');
    });
    const selectedColorSection = document.querySelector(`#historyRow .color-section.color-${historySettings.color}`);
    if (selectedColorSection) {
        selectedColorSection.classList.add('selected');
    }
    
    // Update week count selection
    document.querySelectorAll('#historyRow .number-section').forEach(section => {
        section.classList.remove('selected');
    });
    const numberSections = document.querySelectorAll('#historyRow .number-section');
    if (numberSections[historySettings.weekCount - 1]) {
        numberSections[historySettings.weekCount - 1].classList.add('selected');
    }
    
    // Update week option selections
    const thisNextWeekOption = document.getElementById('thisNextWeek');
    const lastWeekOption = document.getElementById('lastWeek');
    
    if (thisNextWeekOption) {
        if (historySettings.showThisNextWeek) {
            thisNextWeekOption.classList.add('selected');
        } else {
            thisNextWeekOption.classList.remove('selected');
        }
    }
    
    if (lastWeekOption) {
        if (historySettings.showLastWeek) {
            lastWeekOption.classList.add('selected');
        } else {
            lastWeekOption.classList.remove('selected');
        }
    }
    
    // Update disabled state
    const row = document.getElementById('historyRow');
    if (row) {
        if (historySettings.enabled) {
            row.classList.remove('disabled');
        } else {
            row.classList.add('disabled');
        }
    }
    
    // Update up/down button states
    const historyIndex = mainScreenSections.findIndex(s => s.id === 'history');
    const upBtn = document.getElementById('historyUpBtn');
    const downBtn = document.getElementById('historyDownBtn');
    
    if (upBtn && downBtn) {
        // Handle up button
        if (historyIndex > 0) {
            upBtn.style.opacity = '1';
            upBtn.style.cursor = 'pointer';
            upBtn.onclick = () => {
                const temp = mainScreenSections[historyIndex];
                mainScreenSections[historyIndex] = mainScreenSections[historyIndex - 1];
                mainScreenSections[historyIndex - 1] = temp;
                saveData();
                renderJobs();
                updateHistorySettingsUI();
            };
        } else {
            upBtn.style.opacity = '0.3';
            upBtn.style.cursor = 'not-allowed';
            upBtn.onclick = null;
        }
        
        // Handle down button
        if (historyIndex < mainScreenSections.length - 1) {
            downBtn.style.opacity = '1';
            downBtn.style.cursor = 'pointer';
            downBtn.onclick = () => {
                const temp = mainScreenSections[historyIndex];
                mainScreenSections[historyIndex] = mainScreenSections[historyIndex + 1];
                mainScreenSections[historyIndex + 1] = temp;
                saveData();
                renderJobs();
                updateHistorySettingsUI();
            };
        } else {
            downBtn.style.opacity = '0.3';
            downBtn.style.cursor = 'not-allowed';
            downBtn.onclick = null;
        }
    }
}



// === SECTION MANAGEMENT FUNCTIONS ===
function toggleSectionVisibility(sectionId) {
    const section = mainScreenSections.find(s => s.id === sectionId);
    if (section && !section.locked) {
        section.visible = !section.visible;
        
        // If it's Quick Schedule, also update quickScheduleSettings
        if (sectionId === 'quickSchedule') {
            quickScheduleSettings.enabled = section.visible;
        }
        
        // If it's History, also update historySettings
        if (sectionId === 'history') {
            historySettings.enabled = section.visible;
        }
        
        saveData();
        renderJobs();
    }
}

function moveSectionUp(index) {
    if (index > 0) {
        const temp = mainScreenSections[index];
        mainScreenSections[index] = mainScreenSections[index - 1];
        mainScreenSections[index - 1] = temp;
        saveData();
        renderJobs();
        updateSectionSettingsDisplay();
    }
}

function moveSectionDown(index) {
    if (index < mainScreenSections.length - 1) {
        const temp = mainScreenSections[index];
        mainScreenSections[index] = mainScreenSections[index + 1];
        mainScreenSections[index + 1] = temp;
        saveData();
        renderJobs();
        updateSectionSettingsDisplay();
    }
}

function updateSectionSettingsDisplay() {
    const container = document.getElementById('sectionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const visibleIndices = [];
    mainScreenSections.forEach((section, index) => {
        if (section.visible) visibleIndices.push(index);
    });
    
    mainScreenSections.forEach((section, index) => {
        const row = document.createElement('div');
        row.className = 'setting-row' + (section.visible ? '' : ' hidden');
        
        // Checkbox
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = section.visible;
        checkbox.disabled = section.locked;
        checkbox.addEventListener('change', () => toggleSectionVisibility(section.id));
        checkboxContainer.appendChild(checkbox);
        
        // Label
        const label = document.createElement('div');
        label.className = 'setting-label' + (section.locked ? ' disabled' : '');
        label.textContent = section.name;
        if (!section.locked) {
            label.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;
                toggleSectionVisibility(section.id);
            });
        }
        
        // Position controls
        const controls = document.createElement('div');
        controls.className = 'position-controls';
        
        const visiblePosition = visibleIndices.indexOf(index);
        const isFirstVisible = visiblePosition === 0;
        const isLastVisible = visiblePosition === visibleIndices.length - 1;
        const isHidden = !section.visible;
        
        // Up button
        const upBtn = document.createElement('div');
        upBtn.className = 'position-btn' + (isFirstVisible || isHidden ? ' disabled' : '');
        const upArrow = document.createElement('div');
        upArrow.className = 'arrow-up';
        upBtn.appendChild(upArrow);
        if (!isFirstVisible && !isHidden) {
            upBtn.addEventListener('click', () => moveSectionUp(index));
        }
        
        // Down button
        const downBtn = document.createElement('div');
        downBtn.className = 'position-btn' + (isLastVisible || isHidden ? ' disabled' : '');
        const downArrow = document.createElement('div');
        downArrow.className = 'arrow-down';
        downBtn.appendChild(downArrow);
        if (!isLastVisible && !isHidden) {
            downBtn.addEventListener('click', () => moveSectionDown(index));
        }
        
        controls.appendChild(upBtn);
        controls.appendChild(downBtn);
        
        // Assemble row
        row.appendChild(checkboxContainer);
        row.appendChild(label);
        row.appendChild(controls);
        
        container.appendChild(row);
    });
}

// === DATE RANGE FUNCTIONALITY ===
function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function updateDateRangeDisplay() {
    const dateRangeElement = document.getElementById('dateRangeText');
    if (!dateRangeElement) return;
    
    try {
        const activeWeekKey = WeekRolloverSystem.getActiveWeekKey();
        const weekStart = new Date(activeWeekKey + 'T00:00:00');
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'long' });
        const startDay = weekStart.getDate();
        const startOrdinal = getOrdinalSuffix(startDay);
        
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'long' });
        const endDay = weekEnd.getDate();
        const endOrdinal = getOrdinalSuffix(endDay);
        
        const dateRangeText = `${startMonth} ${startDay}${startOrdinal} - ${endMonth} ${endDay}${endOrdinal}`;
        
        dateRangeElement.textContent = dateRangeText;
    } catch (error) {
        console.error('Error updating date range:', error);
        dateRangeElement.textContent = 'Week View';
    }
}

function updateDayNumbers() {
    try {
        const activeWeekKey = WeekRolloverSystem.getActiveWeekKey();
        const weekStart = new Date(activeWeekKey + 'T00:00:00');
        
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + dayOffset);
            
            const dayOfMonth = currentDate.getDate();
            const formattedDay = dayOfMonth.toString().padStart(2, '0');
            
            const dayDataValue = dayOffset === 6 ? 0 : dayOffset + 1;
            
            const dayCard = document.querySelector(`[data-day="${dayDataValue}"]`);
            if (dayCard) {
                const dayNumberElement = dayCard.querySelector('.day-number');
                if (dayNumberElement) {
                    dayNumberElement.textContent = formattedDay;
                }
            }
        }
    } catch (error) {
        console.error('Error updating day numbers:', error);
    }
}

// === VIEW MODE FUNCTIONALITY ===
function switchViewMode(mode) {
    if (mode === 'full' && currentViewMode !== 'full') {
        previousViewMode = currentViewMode;
    }
    
    currentViewMode = mode;
    
    if (currentJobId && mode !== 'full') {
        const job = jobs.find(j => j.id === currentJobId);
        if (job) {
            job.viewPreference = mode;
            saveData();
        }
    }
    
    updateViewDisplay();
    
    if (mode === 'full') {
        addFullViewTouchListener();
        const copyButton = document.getElementById('copyButton');
        if (copyButton) {
            copyButton.textContent = 'Copy to Clipboard';
        }
    } else {
        removeFullViewTouchListener();
    }
}

function updateViewDisplay() {
    const content = document.querySelector('#jobEntryWindow .content');
    const body = document.body;
    
    content.classList.remove('simple-view', 'full-view');
    body.classList.remove('full-view-mode');
    
    // Get job color
    const job = jobs.find(j => j.id === currentJobId);
    const jobColor = job ? (job.color || 'blue') : 'blue';
    const colorVar = `var(--job-color-${jobColor})`;
    
    // Remove active and reset background color from all view tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.backgroundColor = '';
    });
    
    if (currentViewMode === 'simple') {
    content.classList.add('simple-view');
    const simpleTab = document.querySelector('.view-tabs .view-tab:nth-child(1)');
    if (simpleTab) {
        simpleTab.classList.add('active');
        simpleTab.style.backgroundColor = colorVar;
    }
} else if (currentViewMode === 'full') {
    content.classList.add('full-view');
    body.classList.add('full-view-mode');
    const fullTab = document.querySelector('.view-tabs .view-tab:nth-child(3)');
    if (fullTab) {
        fullTab.classList.add('active');
        fullTab.style.backgroundColor = colorVar;
    }
    console.log('Full view activated');
} else {
    const standardTab = document.querySelector('.view-tabs .view-tab:nth-child(2)');
    if (standardTab) {
        standardTab.classList.add('active');
        standardTab.style.backgroundColor = colorVar;
    }
}
    
    setTimeout(() => {
        calculateAndApplyDayCardScaling();
    }, 50);
    // Reload shift data to update break field display
if (currentJobId) {
    const job = jobs.find(j => j.id === currentJobId);
    if (job) {
        loadShiftDataToDom(job);
    }
}
}

let touchListener = null;

function addFullViewTouchListener() {
    if (touchListener) return;
    
    touchListener = function(e) {
        if (e.target.closest('.view-tabs')) {
            return;
        }
        
        if (e.target.closest('.copy-overlay')) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        switchViewMode(previousViewMode);
    };
    
    setTimeout(() => {
        document.addEventListener('touchstart', touchListener, { passive: false });
        document.addEventListener('click', touchListener, true);
    }, 100);
}

function removeFullViewTouchListener() {
    if (touchListener) {
        document.removeEventListener('touchstart', touchListener);
        document.removeEventListener('click', touchListener, true);
        touchListener = null;
    }
}

function loadViewPreference(job) {
    currentViewMode = job.viewPreference === 'simple' ? 'simple' : 'standard';
    previousViewMode = currentViewMode;
    updateViewDisplay();
}

// === RESPONSIVE DAY CARD SCALING ===
function calculateAndApplyDayCardScaling() {
    const jobEntryWindow = document.getElementById('jobEntryWindow');
    if (!jobEntryWindow || !jobEntryWindow.classList.contains('active')) {
        return;
    }

    const headerHeight = 40;
    const availableHeight = window.innerHeight - headerHeight;
    
    const jobTabsHeight = 40 + 8 + 4;
    const subTabsHeight = 40 + 4 + 4;
    const dateRangeHeight = 40 + 4;
    const dayCardsHeight = (7 * 40) + (6 * 4);
    const totalHoursHeight = 40 + 4;  // Now just 40px card + 4px margin
    const viewTabsHeight = 40 + 4;
    const clearScheduleHeight = 40 + 4;
    const contentPadding = 16 + 16;
    
    const totalRequiredHeight = jobTabsHeight + subTabsHeight + dateRangeHeight + 
                               dayCardsHeight + totalHoursHeight + viewTabsHeight + 
                               clearScheduleHeight + contentPadding;
    
    let scalingFactor = 1;
    
    if (totalRequiredHeight > availableHeight) {
        const excessHeight = totalRequiredHeight - availableHeight;
        const maxReduction = (7 * 40) * 0.5;
        
        if (excessHeight <= maxReduction) {
            const reductionNeeded = excessHeight / (7 * 40);
            scalingFactor = Math.max(0.5, 1 - reductionNeeded);
        } else {
            scalingFactor = 0.5;
        }
    }
    
    const root = document.documentElement;
    const newHeight = Math.round(40 * scalingFactor);
    root.style.setProperty('--day-card-height', `${newHeight}px`);
    root.style.setProperty('--day-card-font-scale', scalingFactor.toString());
    
    console.log(`📏 Day card scaling: ${scalingFactor.toFixed(2)} (${newHeight}px height)`);
}

// === WEEK ROLLOVER INTEGRATION HELPERS ===
function getShiftsForActiveWeek(job, shiftType) {
    return WeekRolloverSystem.getActiveWeekShifts(job, shiftType);
}

function setShiftsForActiveWeek(job, shiftType, shiftData) {
    WeekRolloverSystem.setActiveWeekShifts(job, shiftType, shiftData);
}

// === TOTAL HOURS CALCULATION ===
function calculateTotalHours(job, shiftType) {
    const shiftsData = getShiftsForActiveWeek(job, shiftType);
    let totalMinutes = 0;
    
    // Loop through all 7 days (0 = Sunday, 6 = Saturday)
    for (let day = 0; day <= 6; day++) {
        const dayShift = shiftsData[day];
        
        // Only count days with valid totals
        if (dayShift && dayShift.total && dayShift.total !== '00.00') {
            const hours = parseFloat(dayShift.total);
            if (!isNaN(hours)) {
                totalMinutes += Math.round(hours * 60);
            }
        }
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return formatTimeDisplay(hours, minutes);
}

function formatTimeDisplay(hours, minutes) {
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const hourText = hours === 1 ? 'HOUR' : 'HOURS';
    const minuteText = minutes === 1 ? 'MINUTE' : 'MINUTES';
    return `${paddedHours} ${hourText}, ${paddedMinutes} ${minuteText}`;
}

function parseTimeToMinutes(timeString) {
    if (!timeString || timeString === 'START' || timeString === 'END' || timeString === 'OFF') {
        return null;
    }
    
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'AM' && hours === 12) {
        hours = 0;
    } else if (period === 'PM' && hours !== 12) {
        hours += 12;
    }
    
    return hours * 60 + minutes;
}

function updateTotalHoursDisplay() {
    if (currentJobId) {
        const job = jobs.find(j => j.id === currentJobId);
        if (job) {
            // Update the hours text
            const totalHours = calculateTotalHours(job, currentSubTab);
            const totalHoursElement = document.getElementById('totalHoursDisplay');
            if (totalHoursElement) {
                totalHoursElement.textContent = totalHours;
            }
            
            // Update the left section color to match job color
            const totalHoursLeft = document.getElementById('totalHoursLeft');
            if (totalHoursLeft) {
                const jobColor = job.color || 'blue';  // Default to blue if no color set
                totalHoursLeft.style.background = `var(--job-color-${jobColor})`;
            }
        }
    }
}

// === SUB TAB MANAGEMENT ===
function switchSubTab(tabType) {
    const scheduledTab = document.querySelector('.sub-tabs .tab:first-child');
    const workedTab = document.querySelector('.sub-tabs .tab:last-child');
    
    if (tabType === 'worked' && workedTab.style.display === 'none') {
        return;
    }
    
    currentSubTab = tabType;
    
    const job = jobs.find(j => j.id === currentJobId);
    const jobColor = job ? (job.color || 'blue') : 'blue';
    const colorVar = `var(--job-color-${jobColor})`;
    
    // Remove active and color from BOTH tabs
    document.querySelectorAll('.sub-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.backgroundColor = '';
    });
    
    // Add active and color ONLY to selected tab
    if (tabType === 'scheduled') {
        scheduledTab.classList.add('active');
        scheduledTab.style.backgroundColor = colorVar;
    } else {
        workedTab.classList.add('active');
        workedTab.style.backgroundColor = colorVar;
    }
    
    if (job) {
        loadShiftDataToDom(job);
        updateTotalHoursDisplay();
    }
}

function updateSubTabsVisibility(weekPosition) {
    const scheduledTab = document.querySelector('.sub-tabs .tab:first-child');
    const workedTab = document.querySelector('.sub-tabs .tab:last-child');
    const subTabsContainer = document.querySelector('.sub-tabs');
    
    if (weekPosition === 'next') {
        scheduledTab.style.display = 'flex';
        workedTab.style.display = 'none';
        
        subTabsContainer.classList.add('single-visible-tab');
        
        if (currentSubTab === 'worked') {
            currentSubTab = 'scheduled';
            scheduledTab.classList.add('active');
            workedTab.classList.remove('active');
        }
    } else {
        scheduledTab.style.display = 'flex';
        workedTab.style.display = 'flex';
        
        subTabsContainer.classList.remove('single-visible-tab');
        
        if (weekPosition === 'current') {
            currentSubTab = 'scheduled';
            scheduledTab.classList.add('active');
            workedTab.classList.remove('active');
        }
        else if (weekPosition === 'previous' && currentSubTab === 'scheduled') {
            currentSubTab = 'worked';
            scheduledTab.classList.remove('active');
            workedTab.classList.add('active');
        }
    }
}

// === JOB MANAGEMENT ===
function saveJob() {
    const title = document.getElementById('jobTitleInput').value.trim();
    if (title) {
        // Generate numeric ID (same method as import system)
        const newId = jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1;
        
        const job = {
            id: newId,  // Numeric ID, not string
            title: title,
            nextShift: 'No upcoming shifts',
            weeklyScheduledShifts: {},
            weeklyWorkedShifts: {},
            color: 'blue',
            viewPreference: 'standard',
            showBreaks: true
        };
        jobs.push(job);
        updateNextShiftForJob(job);
        saveData();
        renderJobs();
        closeAddJobModal();
    }
}

function confirmDeleteJob() {
    if (currentJobId) {
        jobs = jobs.filter(job => job.id !== currentJobId);
        saveData();
        renderJobs();
        closeDeleteJobModal();
        returnToMain();
        currentJobId = null;
    }
}

function confirmClearSchedule() {
    if (currentJobId) {
        const job = jobs.find(j => j.id === currentJobId);
        if (job) {
            const emptyShifts = {};
            setShiftsForActiveWeek(job, currentSubTab, emptyShifts);
            
            document.querySelectorAll('.day-card').forEach(dayCard => {
                const startField = dayCard.querySelector('.time-field.start');
                const endField = dayCard.querySelector('.time-field.end');
                const breakField = dayCard.querySelector('.time-field.break');
                const totalField = dayCard.querySelector('.time-field.total');
                
                if (startField) {
                    startField.textContent = 'START';
                    startField.removeAttribute('data-state');
                }
                if (endField) {
                    endField.textContent = 'END';
                    endField.removeAttribute('data-state');
                }
                if (breakField) {
                    breakField.removeAttribute('data-state');
                }
                if (totalField) {
                    totalField.textContent = '00.00';
                    totalField.removeAttribute('data-state');
                }
            });
            
            updateNextShiftForJob(job);
            renderJobs();
            updateTotalHoursDisplay();
            saveData();
        }
    }
    closeClearScheduleModal();
}

function openJobEntry(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    currentJobId = jobId;
    
    loadViewPreference(job);
    
    WeekRolloverSystem.setCurrentWeekPosition('current');
    updateWeekTabsUI('current');
    
    currentSubTab = 'scheduled';
    
    const jobColor = job.color || 'blue';
    const colorVar = `var(--job-color-${jobColor})`;
    
    document.querySelectorAll('.sub-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.backgroundColor = '';
    });
    
    const scheduledTab = document.querySelector('.sub-tabs .tab:first-child');
    if (scheduledTab) {
        scheduledTab.classList.add('active');
        scheduledTab.style.backgroundColor = colorVar;
    }
    
    updateSubTabsVisibility('current');
    
    document.getElementById('jobHeaderTitle').textContent = job.title;
    showWindow('jobEntryWindow');
    highlightTodaysDay();
    loadShiftDataToDom(job);
    updateTotalHoursDisplay();
    
    updateDateRangeDisplay();
    updateDayNumbers();
    
    const settingsContainer = document.getElementById('payday-settings-container');
    const previewContainer = document.getElementById('payday-preview-container');
    const jobColorForPayday = `var(--job-color-${job.color || 'blue'})`;
    PaydayModule.initializeJob(job.id, settingsContainer, previewContainer, jobColorForPayday);
    
    setTimeout(() => {
        calculateAndApplyDayCardScaling();
    }, 0);
}

function selectJobColor(color) {
    if (currentJobId) {
        const job = jobs.find(j => j.id === currentJobId);
        if (job) {
            if (!job.color) {
                job.color = 'blue';
            }
            
            job.color = color;
            saveData();
            renderJobs();
            updateColorPickerUI(color);
            updateTotalHoursDisplay();
            
            // Update tab colors immediately (NOT week tabs)
            const colorVar = `var(--job-color-${color})`;
            
            // Update active sub-tab
            const activeSubTab = document.querySelector('.sub-tabs .tab.active');
            if (activeSubTab) {
                activeSubTab.style.backgroundColor = colorVar;
            }
            
            // Update active view tab
            const activeViewTab = document.querySelector('.view-tabs .view-tab.active');
            if (activeViewTab) {
                activeViewTab.style.backgroundColor = colorVar;
            }
        }
    }
}

function updateColorPickerUI(selectedColor) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`.color-option.${selectedColor}`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

function loadJobSettingsData(job) {
    if (!job.color) {
        job.color = 'blue';
    }
    
    updateColorPickerUI(job.color);
    
    // Initialize showBreaks setting if it doesn't exist
    if (job.showBreaks === undefined) {
        job.showBreaks = true;
    }
    
    // Update checkbox visual
    const checkbox = document.getElementById('breaksCheckbox');
    if (checkbox) {
        if (job.showBreaks) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    }
    
    // Initialize Payday Settings
    const settingsContainer = document.getElementById('payday-settings-container');
    const jobColor = `var(--job-color-${job.color || 'blue'})`;
    if (settingsContainer) {
        PaydayModule.initializeJob(job.id, settingsContainer, document.createElement('div'), jobColor);
    }
}

function loadShiftDataToDom(job) {
    const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
    
    document.querySelectorAll('.day-card').forEach(dayCard => {
        const startField = dayCard.querySelector('.time-field.start');
        const endField = dayCard.querySelector('.time-field.end');
        const breakField = dayCard.querySelector('.time-field.break');
        const totalField = dayCard.querySelector('.time-field.total');
        
        // Show or hide break field based on job setting
        if (breakField) {
            if (job.showBreaks === false) {
                breakField.style.display = 'none';
            } else {
                breakField.style.display = '';
            }
        }
        
        if (startField) {
            startField.textContent = 'START';
            startField.removeAttribute('data-state');
        }
        if (endField) {
            endField.textContent = 'END';
            endField.removeAttribute('data-state');
        }
        if (breakField) {
            breakField.textContent = 'BREAK';
            breakField.removeAttribute('data-state');
        }
        if (totalField) {
            totalField.textContent = '00.00';
            totalField.removeAttribute('data-state');
        }
    });
    
    for (let day = 0; day <= 6; day++) {
        const dayShift = shiftsData[day];
        if (dayShift) {
            const dayCard = document.querySelector(`[data-day="${day}"]`);
            if (dayCard) {
                const startField = dayCard.querySelector('.time-field.start');
                const endField = dayCard.querySelector('.time-field.end');
                const breakField = dayCard.querySelector('.time-field.break');
                const totalField = dayCard.querySelector('.time-field.total');
                
                if (startField && dayShift.start && dayShift.start !== 'START') {
                    startField.textContent = dayShift.start;
                    if (dayShift.start === 'OFF') {
                        startField.setAttribute('data-state', 'off');
                    }
                }
                if (endField && dayShift.end && dayShift.end !== 'END') {
                    endField.textContent = dayShift.end;
                    if (dayShift.end === 'OFF') {
                        endField.setAttribute('data-state', 'off');
                    }
                }
                
                if (breakField) {
    const content = document.querySelector('#jobEntryWindow .content');
    const isSimpleView = content && content.classList.contains('simple-view');
    
    if (isSimpleView) {
        // Simple view: Use new design
        if (dayShift.break && dayShift.break > 0) {
            breakField.classList.add('has-value');
            breakField.innerHTML = `<div class="break-value-box">${dayShift.break}</div>`;
        } else {
            breakField.classList.remove('has-value');
            breakField.innerHTML = '';
        }
    } else {
        // Standard/Full view: Use old text display
        if (dayShift.break && dayShift.break > 0) {
            breakField.textContent = `${dayShift.break}m`;
        } else {
            breakField.textContent = 'BREAK';
        }
    }
}
                
                if (totalField && dayShift.total) {
                    totalField.textContent = dayShift.total;
                }
                
                if (dayShift.start === 'OFF' && dayShift.end === 'OFF') {
                    if (breakField) breakField.setAttribute('data-state', 'off');
                    if (totalField) totalField.setAttribute('data-state', 'off');
                }
            }
        }
    }
    
    updateTotalHoursDisplay();
}

function highlightTodaysDay() {
    document.querySelectorAll('.day-card').forEach(card => {
        card.classList.remove('today');
    });
    
    const currentPosition = WeekRolloverSystem.getCurrentWeekPosition();
    if (currentPosition === 'current') {
        const today = new Date().getDay();
        const todayCard = document.querySelector(`[data-day="${today}"]`);
        if (todayCard) {
            todayCard.classList.add('today');
        }
    }
}

function toggleCompactCards() {
    compactJobCards = !compactJobCards;
    saveData();
    renderJobs();
    updateCompactCardToggleDisplay();
}

function updateCompactCardToggleDisplay() {
    const statusElement = document.getElementById('compactCardToggleStatus');
    if (statusElement) {
        statusElement.textContent = compactJobCards ? 'Currently: ON' : 'Currently: OFF';
    }
}

function updateHistoryDisplay() {
    const historySection = document.getElementById('historySection');
    if (historySection) {
        if (typeof HistorySystem !== 'undefined') {
            // Pass settings to HistorySystem
            HistorySystem.config = HistorySystem.config || {};
            HistorySystem.config.color = historySettings.color;
            HistorySystem.config.showThisNextWeek = historySettings.showThisNextWeek;
            HistorySystem.config.showLastWeek = historySettings.showLastWeek;
            HistorySystem.config.weekCount = historySettings.weekCount;
            historySection.innerHTML = HistorySystem.renderHistory(jobs);
        } else {
            historySection.innerHTML = '<div class="empty-state">History loading...</div>';
        }
    }
}

function updateQuickScheduleDisplay() {
    const quickScheduleSection = document.getElementById('quickScheduleSection');
    if (quickScheduleSection) {
        if (typeof QuickScheduleGrid !== 'undefined') {
            // Pass settings to QuickScheduleGrid
            QuickScheduleGrid.config.daysToShow = quickScheduleSettings.daysToShow;
            QuickScheduleGrid.config.color = quickScheduleSettings.color;
            quickScheduleSection.innerHTML = QuickScheduleGrid.renderQuickScheduleGrid(jobs);
        } else {
            quickScheduleSection.innerHTML = '<div class="empty-state">Quick schedule loading...</div>';
        }
    }
}

function updateNextShiftForJob(job) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    let nextShift = null;
    let shortestWait = Infinity;
    
    const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
    const weeksToCheck = [
        { key: weekKeys.current, weekOffset: 0 },
        { key: weekKeys.next, weekOffset: 1 }
    ];
    
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const checkDay = (currentDay + dayOffset) % 7;
        const weekIndex = Math.floor((currentDay + dayOffset) / 7);
        
        if (weekIndex >= weeksToCheck.length) continue;
        
        const weekInfo = weeksToCheck[weekIndex];
        const weekShifts = WeekRolloverSystem.getWeekShifts(job, weekInfo.key, 'scheduled');
        const dayShift = weekShifts[checkDay];
        
        if (dayShift && dayShift.start && dayShift.start !== 'START' && dayShift.start !== 'OFF') {
            const shiftStartMinutes = parseTimeToMinutes(dayShift.start);
            if (shiftStartMinutes !== null) {
                let waitMinutes;
                if (dayOffset === 0 && shiftStartMinutes > currentTimeMinutes) {
                    waitMinutes = shiftStartMinutes - currentTimeMinutes;
                } else if (dayOffset > 0) {
                    const fullDaysWait = dayOffset * 24 * 60;
                    const todayRemainingMinutes = (24 * 60) - currentTimeMinutes;
                    waitMinutes = todayRemainingMinutes + shiftStartMinutes + ((dayOffset - 1) * 24 * 60);
                } else {
                    continue;
                }
                
                if (waitMinutes < shortestWait) {
                    shortestWait = waitMinutes;
                    nextShift = {
                        day: checkDay,
                        startTime: dayShift.start,
                        waitMinutes: waitMinutes
                    };
                }
            }
        }
    }
    
    if (nextShift) {
        const days = Math.floor(nextShift.waitMinutes / (24 * 60));
        const hours = Math.floor((nextShift.waitMinutes % (24 * 60)) / 60);
        const minutes = nextShift.waitMinutes % 60;
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[nextShift.day];
        const shortTime = shortenTimeString(nextShift.startTime);
        
        const totalHours = Math.floor(nextShift.waitMinutes / 60);
const totalMinutes = nextShift.waitMinutes % 60;

let timeUntil = '';
if (totalHours > 0) {
    timeUntil = `${totalHours}h ${totalMinutes}m`;
} else {
    timeUntil = `${totalMinutes}m`;
}
        
        job.nextShift = timeUntil;
    } else {
        job.nextShift = 'No upcoming shifts';
    }
}

function shortenTimeString(timeString) {
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return timeString;
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toLowerCase();
    
    let formattedTime = hours.toString();
    
    if (minutes !== '00') {
        formattedTime += minutes;
    }
    
    formattedTime += period;
    
    return formattedTime;
}

function returnToMain() {
    showWindow('mainWindow');
    
    const root = document.documentElement;
    root.style.setProperty('--day-card-height', '40px');
    root.style.setProperty('--day-card-font-scale', '1');
    
    updateAllJobNextShifts();
}

function updateAllJobNextShifts() {
    jobs.forEach(job => {
        updateNextShiftForJob(job);
    });
    renderJobs();
}

function updateQuickScheduleOnShiftChange() {
    updateQuickScheduleDisplay();
    
    jobs.forEach(job => {
        updateNextShiftForJob(job);
    });
    
    const jobsList = document.getElementById('jobsList');
    if (jobsList && jobs.length > 0) {
        jobsList.innerHTML = jobs.map(job => {
            const jobColor = job.color || 'blue';
            return `
                <div class="job-card" onclick="openJobEntry(${job.id})">
                    <div class="job-title-section color-${jobColor}">
                        <div class="job-title">${job.title}</div>
                    </div>
                    <div class="job-info-section">
                        <div class="next-shift-time">${job.nextShift}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function initializeApp() {
    console.log('🚀 Initializing Schedule Manager...');
    
    loadData();
    
    // CRITICAL: Expose settings to window object for Settings.js
    window.compactJobCards = compactJobCards;
    window.mainScreenSections = mainScreenSections;
    window.quickScheduleSettings = quickScheduleSettings;
    window.historySettings = historySettings;
    
    console.log('✅ Settings loaded:', {
        compactJobCards: window.compactJobCards,
        quickScheduleEnabled: window.quickScheduleSettings.enabled,
        historyEnabled: window.historySettings.enabled,
        sections: window.mainScreenSections.map(s => `${s.id}:${s.visible}`)
    });
    
    const migrationOccurred = migrateHourFormat(jobs);  
    const recalcOccurred = recalculateAllTotals(jobs);
    
    jobs = WeekRolloverSystem.initialize(jobs);
    
    jobs.forEach(job => {
        if (!job.color) {
            job.color = 'blue';
        }
        if (!job.viewPreference || !['standard', 'simple'].includes(job.viewPreference)) {
            job.viewPreference = 'standard';
        }
        updateNextShiftForJob(job);
    });
    
    if (jobs.length > 0 || migrationOccurred || recalcOccurred) {
        saveData();
    }
    
    renderJobs();
    updateCompactCardToggleDisplay();
    updateSectionSettingsDisplay();
    
    setTimeout(() => {
        if (typeof HistorySystem !== 'undefined') {
            // Set config from saved settings before initializing
            HistorySystem.config = HistorySystem.config || {};
            HistorySystem.config.color = historySettings.color;
            HistorySystem.config.showThisNextWeek = historySettings.showThisNextWeek;
            HistorySystem.config.showLastWeek = historySettings.showLastWeek;
            HistorySystem.config.weekCount = historySettings.weekCount;
            HistorySystem.initialize(jobs);
        } else {
            setTimeout(() => {
                if (typeof HistorySystem !== 'undefined') {
                    HistorySystem.config = HistorySystem.config || {};
                    HistorySystem.config.color = historySettings.color;
                    HistorySystem.config.showThisNextWeek = historySettings.showThisNextWeek;
                    HistorySystem.config.showLastWeek = historySettings.showLastWeek;
                    HistorySystem.config.weekCount = historySettings.weekCount;
                    HistorySystem.initialize(jobs);
                } else {
                    console.warn('⚠️ HistorySystem not available after retries');
                }
            }, 500);
        }
        
        if (typeof QuickScheduleGrid !== 'undefined') {
            // Set config from saved settings before initializing
            QuickScheduleGrid.config.daysToShow = quickScheduleSettings.daysToShow;
            QuickScheduleGrid.config.color = quickScheduleSettings.color;
            QuickScheduleGrid.initialize(jobs);
        } else {
            setTimeout(() => {
                if (typeof QuickScheduleGrid !== 'undefined') {
                    // Set config from saved settings before initializing
                    QuickScheduleGrid.config.daysToShow = quickScheduleSettings.daysToShow;
                    QuickScheduleGrid.config.color = quickScheduleSettings.color;
                    QuickScheduleGrid.initialize(jobs);
                } else {
                    console.warn('⚠️ QuickScheduleGrid not available after retries');
                }
            }, 500);
        }
    }, 100);
    
    // Initialize splash screen system
setTimeout(() => {
    if (typeof SplashSystem !== 'undefined') {
        SplashSystem.loadSettings();
        SplashSystem.initialize();
    } else {
        // Fallback if SplashSystem not loaded
        const app = document.getElementById('app');
        if (app) app.style.opacity = '1';
        
        const oldSplash = document.getElementById('splash');
        if (oldSplash) oldSplash.style.display = 'none';
    }
}, 100);
    
    console.log('✅ App initialized with', jobs.length, 'jobs');
}

// === HOUR FORMAT MIGRATION ===
function migrateHourFormat(jobs) {
    let migrationCount = 0;
    
    jobs.forEach(job => {
        if (job.weeklyScheduledShifts) {
            for (const weekKey in job.weeklyScheduledShifts) {
                for (const dayKey in job.weeklyScheduledShifts[weekKey]) {
                    const dayData = job.weeklyScheduledShifts[weekKey][dayKey];
                    if (dayData && dayData.total && dayData.total.includes('.') && dayData.total.length > 5) {
                        const newTotal = parseFloat(dayData.total).toFixed(2).padStart(5, '0');
                        console.log(`🔄 Migrating ${job.title} - Week ${weekKey}, Day ${dayKey}: ${dayData.total} → ${newTotal}`);
                        dayData.total = newTotal;
                        migrationCount++;
                    }
                }
            }
        }
        
        if (job.weeklyWorkedShifts) {
            for (const weekKey in job.weeklyWorkedShifts) {
                for (const dayKey in job.weeklyWorkedShifts[weekKey]) {
                    const dayData = job.weeklyWorkedShifts[weekKey][dayKey];
                    if (dayData && dayData.total && dayData.total.includes('.') && dayData.total.length > 5) {
                        const newTotal = parseFloat(dayData.total).toFixed(2).padStart(5, '0');
                        console.log(`🔄 Migrating ${job.title} - Week ${weekKey}, Day ${dayKey}: ${dayData.total} → ${newTotal}`);
                        dayData.total = newTotal;
                        migrationCount++;
                    }
                }
            }
        }
        
        if (job.scheduledShifts) {
            for (const dayKey in job.scheduledShifts) {
                const dayData = job.scheduledShifts[dayKey];
                if (dayData && dayData.total && dayData.total.includes('.') && dayData.total.length > 5) {
                    const newTotal = parseFloat(dayData.total).toFixed(2).padStart(5, '0');
                    console.log(`🔄 Migrating legacy ${job.title} - Day ${dayKey}: ${dayData.total} → ${newTotal}`);
                    dayData.total = newTotal;
                    migrationCount++;
                }
            }
        }
        
        if (job.workedShifts) {
            for (const dayKey in job.workedShifts) {
                const dayData = job.workedShifts[dayKey];
                if (dayData && dayData.total && dayData.total.includes('.') && dayData.total.length > 5) {
                    const newTotal = parseFloat(dayData.total).toFixed(2).padStart(5, '0');
                    console.log(`🔄 Migrating legacy ${job.title} - Day ${dayKey}: ${dayData.total} → ${newTotal}`);
                    dayData.total = newTotal;
                    migrationCount++;
                }
            }
        }
    });
    
    if (migrationCount > 0) {
        console.log(`✅ Migrated ${migrationCount} hour formats`);
        return true;
    } else {
        console.log('ℹ️ No hour format migration needed');
        return false;
    }
}

// === RECALCULATE TOTALS ===
function recalculateAllTotals(jobs) {
    let recalcCount = 0;
    
    jobs.forEach(job => {
        if (job.weeklyScheduledShifts) {
            for (const weekKey in job.weeklyScheduledShifts) {
                for (const dayKey in job.weeklyScheduledShifts[weekKey]) {
                    const dayData = job.weeklyScheduledShifts[weekKey][dayKey];
                    if (dayData && dayData.start && dayData.end) {
                        const newTotal = calculateShiftTotal(dayData.start, dayData.end);
                        if (newTotal !== null && dayData.total !== newTotal) {
                            console.log(`  Recalculated ${job.title} - Week ${weekKey}, Day ${dayKey}: ${dayData.start} to ${dayData.end} = ${newTotal}`);
                            dayData.total = newTotal;
                            recalcCount++;
                        }
                    }
                }
            }
        }
        
        if (job.weeklyWorkedShifts) {
            for (const weekKey in job.weeklyWorkedShifts) {
                for (const dayKey in job.weeklyWorkedShifts[weekKey]) {
                    const dayData = job.weeklyWorkedShifts[weekKey][dayKey];
                    if (dayData && dayData.start && dayData.end) {
                        const newTotal = calculateShiftTotal(dayData.start, dayData.end);
                        if (newTotal !== null && dayData.total !== newTotal) {
                            console.log(`  Recalculated ${job.title} - Week ${weekKey}, Day ${dayKey}: ${dayData.start} to ${dayData.end} = ${newTotal}`);
                            dayData.total = newTotal;
                            recalcCount++;
                        }
                    }
                }
            }
        }
        
        if (job.scheduledShifts) {
            for (const dayKey in job.scheduledShifts) {
                const dayData = job.scheduledShifts[dayKey];
                if (dayData && dayData.start && dayData.end) {
                    const newTotal = calculateShiftTotal(dayData.start, dayData.end);
                    if (newTotal !== null && dayData.total !== newTotal) {
                        console.log(`  Recalculated legacy ${job.title} - Day ${dayKey}: ${dayData.start} to ${dayData.end} = ${newTotal}`);
                        dayData.total = newTotal;
                        recalcCount++;
                    }
                }
            }
        }
        
        if (job.workedShifts) {
            for (const dayKey in job.workedShifts) {
                const dayData = job.workedShifts[dayKey];
                if (dayData && dayData.start && dayData.end) {
                    const newTotal = calculateShiftTotal(dayData.start, dayData.end);
                    if (newTotal !== null && dayData.total !== newTotal) {
                        console.log(`  Recalculated legacy ${job.title} - Day ${dayKey}: ${dayData.start} to ${dayData.end} = ${newTotal}`);
                        dayData.total = newTotal;
                        recalcCount++;
                    }
                }
            }
        }
    });
    
    if (recalcCount > 0) {
        console.log(`✅ Recalculated ${recalcCount} shift totals`);
        return true;
    } else {
        console.log('ℹ️ No shift totals needed recalculation');
        return false;
    }
}

function calculateShiftTotal(startTime, endTime, breakMinutes = 0) {
    if (startTime === 'OFF' || endTime === 'OFF') {
        return '00.00';
    }
    
    if (!startTime || !endTime || startTime === 'START' || endTime === 'END') {
        return '00.00';
    }
    
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    if (startMinutes === null || endMinutes === null) {
        return '00.00';
    }
    
    let totalMinutes;
    if (endMinutes >= startMinutes) {
        totalMinutes = endMinutes - startMinutes;
    } else {
        totalMinutes = (24 * 60) - startMinutes + endMinutes;
    }
    
    // Deduct break time
    totalMinutes = Math.max(0, totalMinutes - breakMinutes);
    
    return minutesToHoursDisplay(totalMinutes);
}

function minutesToHoursDisplay(totalMinutes) {
    if (totalMinutes === null || totalMinutes < 0) return '00.00';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const decimalHours = hours + (minutes / 60);
    
    return decimalHours.toFixed(2).padStart(5, '0');
}

function copyScheduleToClipboard() {
    if (!currentJobId) return;
    
    const job = jobs.find(j => j.id === currentJobId);
    if (!job) return;
    
    const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    let scheduleText = '';
    
    for (let day = 1; day <= 6; day++) {
        const dayShift = shiftsData[day] || { start: 'START', end: 'END' };
        const dayName = dayNames[day];
        
        if (dayShift.start === 'OFF' || dayShift.start === 'START') {
            continue;
        }
        
        const startTime = dayShift.start;
        const endTime = dayShift.end;
        
        scheduleText += `${dayName}: ${startTime} - ${endTime}\n`;
    }
    
    const sundayShift = shiftsData[0] || { start: 'START', end: 'END' };
    if (sundayShift.start !== 'OFF' && sundayShift.start !== 'START') {
        scheduleText += `${dayNames[0]}: ${sundayShift.start} - ${sundayShift.end}\n`;
    }
    
    if (scheduleText) {
        navigator.clipboard.writeText(scheduleText.trim()).then(() => {
            const copyButton = document.getElementById('copyButton');
            if (copyButton) {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy to Clipboard';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
}

function clearAllData() {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
        clearData();
        location.reload();
    }
}

function renderJobs() {
    const jobsList = document.getElementById('jobsList');
    
    if (!jobsList) return;
    
    if (jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                No jobs added yet.<br>
                Use the "+ Job" button above to add your first job.
            </div>
        `;
    } else {
        jobsList.innerHTML = jobs.map(job => {
            const jobColor = job.color || 'blue';
            const compactClass = window.compactJobCards ? ' compact' : '';
            return `
                <div class="job-card${compactClass}" onclick="openJobEntry(${job.id})">
                    <div class="job-title-section color-${jobColor}">
                        <div class="job-title">${job.title}</div>
                    </div>
                    <div class="job-info-section">
                        <div class="next-shift-time">${job.nextShift}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateHistoryDisplay();
    updateQuickScheduleDisplay();
}

window.addEventListener('resize', () => {
    calculateAndApplyDayCardScaling();
});


document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

