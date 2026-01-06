// === UI MANAGER ===
// Handles window navigation, rendering, and system coordination
// Integrates Quick Schedule and History systems with main app

// === WINDOW MANAGEMENT ===
function showWindow(windowId) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
    document.getElementById(windowId).classList.add('active');
    
    const headerButtons = document.getElementById('headerButtons');
    const jobTitleCard = document.getElementById('jobTitleHeaderCard');
    const settingsTitleCard = document.getElementById('settingsTitleHeaderCard');
    const dataTitleCard = document.getElementById('dataTitleHeaderCard');
    const jobSettingsTitleCard = document.getElementById('jobSettingsTitleHeaderCard');
    const impexExportTitleCard = document.getElementById('impexExportTitleHeaderCard');
    const impexImportTitleCard = document.getElementById('impexImportTitleHeaderCard');
    const workHistoryTitleCard = document.getElementById('workHistoryTitleHeaderCard');
    const body = document.body;
    
    // Reset all states
    headerButtons.classList.remove('hidden');
    jobTitleCard.classList.remove('active');
    settingsTitleCard.classList.remove('active');
    dataTitleCard.classList.remove('active');
    jobSettingsTitleCard.classList.remove('active');
    if (impexExportTitleCard) impexExportTitleCard.classList.remove('active');
    if (impexImportTitleCard) impexImportTitleCard.classList.remove('active');
    if (workHistoryTitleCard) workHistoryTitleCard.classList.remove('active');
    body.className = '';
    
    // Set appropriate state
    if (windowId === 'jobEntryWindow') {
        headerButtons.classList.add('hidden');
        jobTitleCard.classList.add('active');
        body.classList.add('job-entry-mode');
    } else if (windowId === 'settingsWindow') {
        headerButtons.classList.add('hidden');
        settingsTitleCard.classList.add('active');
        body.classList.add('settings-mode');
    } else if (windowId === 'dataWindow') {
        headerButtons.classList.add('hidden');
        dataTitleCard.classList.add('active');
        body.classList.add('data-mode');
    } else if (windowId === 'jobSettingsWindow') {
        headerButtons.classList.add('hidden');
        jobSettingsTitleCard.classList.add('active');
        body.classList.add('job-settings-mode');
        
        // Load job settings data when opening settings
        if (currentJobId) {
            const job = jobs.find(j => j.id === currentJobId);
            if (job) {
                loadJobSettingsData(job);
            }
        }
    } else if (windowId === 'impexExportWindow') {
        headerButtons.classList.add('hidden');
        if (impexExportTitleCard) impexExportTitleCard.classList.add('active');
        body.classList.add('impex-export-mode');
    } else if (windowId === 'impexImportWindow') {
        headerButtons.classList.add('hidden');
        if (impexImportTitleCard) impexImportTitleCard.classList.add('active');
        body.classList.add('impex-import-mode');
    } else if (windowId === 'workHistoryWindow') {
        headerButtons.classList.add('hidden');
        if (workHistoryTitleCard) workHistoryTitleCard.classList.add('active');
        body.classList.add('work-history-mode');
    }
    
    // Update Quick Schedule and other systems when returning to main window
    if (windowId === 'mainWindow') {
        // Render main window with section ordering
        renderMainWindow();
    }
}

function openSettingsWindow() {
    showWindow('settingsWindow');
}

function openDataWindow() {
    showWindow('dataWindow');
}

function openJobSettingsWindow() {
    showWindow('jobSettingsWindow');
    
    // Update checkbox state based on current job's showBreaks setting
    const job = jobs.find(j => j.id === currentJobId);
    const checkbox = document.getElementById('breaksCheckbox');
    if (job && checkbox) {
        if (job.showBreaks) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    }
}

function returnToMain() {
    showWindow('mainWindow');
    
    // Reset day card scaling when leaving job entry
    const root = document.documentElement;
    root.style.setProperty('--day-card-height', '40px');
    root.style.setProperty('--day-card-font-scale', '1');
    
    // Update next shift times when returning to main window
    updateAllJobNextShifts();
    
    // Render main window with proper section ordering
    renderMainWindow();
    
    // Load fresh weather data
    if (typeof WeatherSystem !== 'undefined' && weatherSettings.enabled) {
        setTimeout(() => {
            WeatherSystem.loadWeather();
        }, 100);
    }
}

function returnToJobEntry() {
    showWindow('jobEntryWindow');
    
    // Reload shift data for current job
    if (currentJobId) {
        const job = jobs.find(j => j.id === currentJobId);
        if (job) {
            loadShiftDataToDom(job);
            highlightTodaysDay();
            updateTotalHoursDisplay();
            
            // Recalculate scaling after returning
            setTimeout(() => {
                calculateAndApplyDayCardScaling();
            }, 50);
        }
    }
}

/**
 * Toggle show breaks setting for current job
 */
function toggleJobBreaks() {
    const job = jobs.find(j => j.id === currentJobId);
    if (!job) return;
    
    // Toggle the setting
    job.showBreaks = !job.showBreaks;
    
    // Update checkbox visual
    const checkbox = document.getElementById('breaksCheckbox');
    if (checkbox) {
        if (job.showBreaks) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    }
    
    // Save data
    saveData();
    
    // Immediately update all break fields visibility
    document.querySelectorAll('.day-card .time-field.break').forEach(breakField => {
        if (job.showBreaks === false) {
            breakField.style.display = 'none';
        } else {
            breakField.style.display = '';
        }
    });
    
    console.log(`✅ Breaks ${job.showBreaks ? 'shown' : 'hidden'} for ${job.name}`);
}

// === MAIN WINDOW SECTION RENDERING ===
function renderMainWindow() {
    const mainWindowContent = document.querySelector('#mainWindow .content');
    if (!mainWindowContent) return;
    
    let html = '';
    
    // Render sections in order based on mainScreenSections array
    mainScreenSections.forEach(section => {
        if (section.visible) {
            html += renderSection(section.id);
        }
    });
    
    mainWindowContent.innerHTML = html;
}

function renderSection(sectionId) {
    let html = '';
    
    // Check for module-provided renderer FIRST
    if (window.sectionRenderers && window.sectionRenderers[sectionId]) {
        html += `<div class="section-divider">${getSectionName(sectionId)}</div>`;
        html += window.sectionRenderers[sectionId]();
        return html;
    }
    
    // Fallback to existing switch for built-in sections
    switch (sectionId) {
        case 'nextShift':
            html += `<div class="section-divider">Time Until Next Shift</div>`;
            html += renderJobsList();
            break;
            
        case 'quickSchedule':
            html += `<div class="section-divider">Quick Schedule</div>`;
            html += `<div id="quickScheduleSection">${renderQuickScheduleContent()}</div>`;
            break;
            
        case 'history':
            html += `<div class="section-divider">History</div>`;
            html += `<div id="historySection">${renderHistoryContent()}</div>`;
            break;
    }
    
    return html;
}

// Helper function to get section name from ID
function getSectionName(sectionId) {
    const section = mainScreenSections.find(s => s.id === sectionId);
    return section ? section.name : sectionId.toUpperCase();
}

function renderJobsList() {
    if (jobs.length === 0) {
        return `
            <div class="empty-state">
                No jobs added yet.<br>
                Use the "+ Job" button above to add your first job.
            </div>
        `;
    }
    
    return jobs.map(job => {
        // Ensure color property exists (backward compatibility)
        const jobColor = job.color || 'blue';
        
        // Apply compact class if setting is enabled
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

function renderQuickScheduleContent() {
    if (typeof QuickScheduleGrid !== 'undefined') {
        return QuickScheduleGrid.renderQuickScheduleGrid(jobs);
    }
    return '<div class="empty-state">Quick schedule loading...</div>';
}

function renderHistoryContent() {
    if (typeof HistorySystem !== 'undefined') {
        return HistorySystem.renderHistory(jobs);
    }
    return '<div class="empty-state">History loading...</div>';
}

function renderWeatherContent() {
    if (typeof WeatherSystem !== 'undefined') {
        return WeatherSystem.renderWeather();
    }
    return '<div class="empty-state">Weather loading...</div>';
}

// === WEEK TAB MANAGEMENT ===
function switchWeekTab(weekPosition) {
    // Update week position in rollover system
    WeekRolloverSystem.setCurrentWeekPosition(weekPosition);
    
    // Update tab appearance
    updateWeekTabsUI(weekPosition);
    
    // Set appropriate sub-tab based on week position
    if (weekPosition === 'previous') {
        currentSubTab = 'worked'; // Default to worked for last week
    } else if (weekPosition === 'next') {
        currentSubTab = 'scheduled'; // Force scheduled for next week
    } else if (weekPosition === 'current') {
        currentSubTab = 'scheduled'; // Always default to scheduled for current week
    }
    
    // Update sub-tab visibility and active state
    updateSubTabsVisibility(weekPosition);
    
    // Update sub-tab active state
    document.querySelectorAll('.sub-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.backgroundColor = '';
    });
    
    // Get job color
    const job = jobs.find(j => j.id === currentJobId);
    const jobColor = job ? (job.color || 'blue') : 'blue';
    const colorVar = `var(--job-color-${jobColor})`;
    
    if (currentSubTab === 'scheduled') {
        const scheduledTab = document.querySelector('.sub-tabs .tab:first-child');
        if (scheduledTab && scheduledTab.style.display !== 'none') {
            scheduledTab.classList.add('active');
            scheduledTab.style.backgroundColor = colorVar;
        }
    } else {
        const workedTab = document.querySelector('.sub-tabs .tab:last-child');
        if (workedTab && workedTab.style.display !== 'none') {
            workedTab.classList.add('active');
            workedTab.style.backgroundColor = colorVar;
        }
    }
    
    // Reload data for current job if in job entry mode
    if (currentJobId) {
        const job = jobs.find(j => j.id === currentJobId);
        if (job) {
            loadShiftDataToDom(job);
            highlightTodaysDay(); // Update today highlighting based on current week
            updateTotalHoursDisplay(); // Update total hours for new week
            
            // Update date range and day numbers for all views
            updateDateRangeDisplay();
            updateDayNumbers();
            
            // Recalculate scaling after week tab change
            setTimeout(() => {
                calculateAndApplyDayCardScaling();
            }, 50);
            
            // Update Quick Schedule when switching weeks if we're viewing current week's scheduled hours
            // This ensures Quick Schedule stays current when user navigates between weeks
            if (weekPosition === 'current' && currentSubTab === 'scheduled') {
                if (typeof updateQuickScheduleDisplay === 'function') {
                    updateQuickScheduleDisplay();
                }
            }
        }
    }
}

function updateWeekTabsUI(activePosition) {
    const tabs = document.querySelectorAll('.job-tabs .tab');
    tabs.forEach((tab, index) => {
        tab.classList.remove('active');
        const positions = ['previous', 'current', 'next'];
        if (positions[index] === activePosition) {
            tab.classList.add('active');
        }
    });
    
    // Update tab labels with relative week names and dates
    const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
    if (tabs.length >= 3) {
        tabs[0].textContent = `Last Week`;
        tabs[1].textContent = `This Week`;
        tabs[2].textContent = `Next Week`;
        
        // Optionally add date ranges as titles for better context
        try {
            tabs[0].title = WeekRolloverSystem.getWeekLabel(weekKeys.previous);
            tabs[1].title = WeekRolloverSystem.getWeekLabel(weekKeys.current);
            tabs[2].title = WeekRolloverSystem.getWeekLabel(weekKeys.next);
        } catch (e) {
            // Fallback if getWeekLabel isn't available
            console.warn('Week label generation failed:', e);
        }
    }
}

// === SUB TAB MANAGEMENT ===
function updateSubTabsVisibility(weekPosition) {
    const scheduledTab = document.querySelector('.sub-tabs .tab:first-child');
    const workedTab = document.querySelector('.sub-tabs .tab:last-child');
    const subTabsContainer = document.querySelector('.sub-tabs');
    
    if (weekPosition === 'next') {
        // Next week: only show scheduled tab, hide worked tab
        scheduledTab.style.display = 'flex';
        workedTab.style.display = 'none';
        
        // Add class for single visible tab styling
        subTabsContainer.classList.add('single-visible-tab');
        
        // Force switch to scheduled if currently on worked
        if (currentSubTab === 'worked') {
            currentSubTab = 'scheduled';
            scheduledTab.classList.add('active');
            workedTab.classList.remove('active');
        }
    } else {
        // Previous and current week: show both tabs
        scheduledTab.style.display = 'flex';
        workedTab.style.display = 'flex';
        
        // Remove class for single visible tab styling
        subTabsContainer.classList.remove('single-visible-tab');
        
        // For current week, always default to scheduled
        if (weekPosition === 'current') {
            currentSubTab = 'scheduled';
            scheduledTab.classList.add('active');
            workedTab.classList.remove('active');
        }
        // Default to worked for previous week only if coming from another week
        else if (weekPosition === 'previous') {
            currentSubTab = 'worked';
            scheduledTab.classList.remove('active');
            workedTab.classList.add('active');
        }
    }
}

// === MODAL CONTROLLERS ===
function openAddJobModal() {
    document.getElementById('addJobModal').style.display = 'flex';
    document.getElementById('jobTitleInput').focus();
}

function closeAddJobModal() {
    document.getElementById('addJobModal').style.display = 'none';
    document.getElementById('jobTitleInput').value = '';
}

function openDeleteJobModal() {
    document.getElementById('deleteJobModal').style.display = 'flex';
}

function closeDeleteJobModal() {
    document.getElementById('deleteJobModal').style.display = 'none';
}

function openClearScheduleModal() {
    document.getElementById('clearScheduleModal').style.display = 'flex';
}

function closeClearScheduleModal() {
    document.getElementById('clearScheduleModal').style.display = 'none';
}

// === DOM RENDERING ===
function renderJobs() {
    // This function now updates the main window with section ordering
    renderMainWindow();
}

// === QUICK SCHEDULE AND HISTORY UPDATE HELPERS ===
function updateQuickScheduleDisplay() {
    const quickScheduleSection = document.getElementById('quickScheduleSection');
    if (quickScheduleSection) {
        if (typeof QuickScheduleGrid !== 'undefined') {
            quickScheduleSection.innerHTML = QuickScheduleGrid.renderQuickScheduleGrid(jobs);
        } else {
            quickScheduleSection.innerHTML = '<div class="empty-state">Quick schedule loading...</div>';
        }
    }
}

function updateHistoryDisplay() {
    const historySection = document.getElementById('historySection');
    if (historySection) {
        if (typeof HistorySystem !== 'undefined') {
            historySection.innerHTML = HistorySystem.renderHistory(jobs);
        } else {
            historySection.innerHTML = '<div class="empty-state">History loading...</div>';
        }
    }
}

// === SHIFT CHANGE HANDLER ===
/**
 * Handle updates when shifts are modified (called from time picker, etc.)
 * This ensures Quick Schedule stays synchronized with shift changes
 */
function onShiftDataChanged() {
    // Update Quick Schedule immediately when shift data changes
    updateQuickScheduleDisplay();
    
    // Update next shift calculations for all jobs
    jobs.forEach(job => {
        if (typeof updateNextShiftForJob === 'function') {
            updateNextShiftForJob(job);
        }
    });
    
    // Re-render main window to update job cards
    renderMainWindow();
    
    // Save data after changes
    if (typeof saveData === 'function') {
        saveData();
    }
}

// === DATA IMPORT/EXPORT ===
function exportData() {
    try {
        const dataToExport = {
            jobs: jobs,
            exportDate: new Date().toISOString(),
            version: '1.0',
            weekRolloverState: WeekRolloverSystem.getRolloverState(),
            compactJobCards: compactJobCards,
            mainScreenSections: mainScreenSections
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Data exported successfully');
    } catch (error) {
        console.error('❌ Failed to export data:', error);
        alert('Failed to export data. Please try again.');
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.jobs && Array.isArray(importedData.jobs)) {
                if (confirm(`Import ${importedData.jobs.length} job(s)? This will replace your current data.`)) {
                    jobs = importedData.jobs;
                    
                    // Import week rollover state if available
                    if (importedData.weekRolloverState) {
                        WeekRolloverSystem.saveRolloverState(importedData.weekRolloverState);
                    }
                    
                    // Import compact cards setting
                    if (importedData.compactJobCards !== undefined) {
                        compactJobCards = importedData.compactJobCards;
                    }
                    
                    // Import section settings
                    if (importedData.mainScreenSections && Array.isArray(importedData.mainScreenSections)) {
                        mainScreenSections = importedData.mainScreenSections;
                    }
                    
                    // Re-initialize week rollover system with imported data
                    jobs = WeekRolloverSystem.initialize(jobs);
                    
                    // Ensure all jobs have required properties (backward compatibility)
                    jobs.forEach(job => {
                        if (!job.color) {
                            job.color = 'blue';
                        }
                        if (!job.viewPreference || !['standard', 'simple'].includes(job.viewPreference)) {
                            job.viewPreference = 'standard';
                        }
                        if (typeof updateNextShiftForJob === 'function') {
                            updateNextShiftForJob(job);
                        }
                    });
                    
                    if (typeof saveData === 'function') {
                        saveData();
                    }
                    
                    renderJobs(); // This will update main window with section ordering
                    returnToMain();
                    
                    alert(`Successfully imported ${jobs.length} job(s)!`);
                    console.log('✅ Data imported successfully');
                }
            } else {
                alert('Invalid file format. Please select a valid schedule backup file.');
            }
        } catch (error) {
            console.error('❌ Failed to import data:', error);
            alert('Failed to import data. Please check the file format and try again.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// === WEEK NAVIGATION HELPERS ===
function getCurrentWeekInfo() {
    const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
    const currentPosition = WeekRolloverSystem.getCurrentWeekPosition();
    const activeWeekKey = weekKeys[currentPosition];
    
    return {
        position: currentPosition,
        weekKey: activeWeekKey,
        weekKeys: weekKeys,
        label: WeekRolloverSystem.getWeekLabel ? WeekRolloverSystem.getWeekLabel(activeWeekKey) : activeWeekKey
    };
}

function showWeekInfo() {
    const info = getCurrentWeekInfo();
    console.log('Current Week Info:', info);
    return info;
}

// === JOB COLOR CHANGE HANDLER ===
/**
 * Handle job color changes and update Quick Schedule
 * @param {string} jobId - ID of the job whose color changed
 */
function onJobColorChanged(jobId) {
    // Update Quick Schedule to reflect new job color
    updateQuickScheduleDisplay();
    
    // Update job cards in main view
    renderJobs();
}

// === JOB MANAGEMENT HANDLERS ===
/**
 * Handle job addition and update all relevant systems
 * @param {Object} newJob - The newly added job
 */
function onJobAdded(newJob) {
    // Update Quick Schedule to include new job
    updateQuickScheduleDisplay();
    
    // Update History system
    updateHistoryDisplay();
    
    // Update main job list
    renderJobs();
    
    console.log('✅ Job added, all systems updated');
}

/**
 * Handle job deletion and update all relevant systems
 * @param {string} deletedJobId - ID of the deleted job
 */
function onJobDeleted(deletedJobId) {
    // Update Quick Schedule to remove deleted job
    updateQuickScheduleDisplay();
    
    // Update History system
    updateHistoryDisplay();
    
    // Update main job list
    renderJobs();
    
    console.log('✅ Job deleted, all systems updated');
}

/**
 * Handle schedule clearing and update Quick Schedule
 * @param {string} jobId - ID of the job whose schedule was cleared
 */
function onScheduleCleared(jobId) {
    // Update Quick Schedule if today's shifts were affected
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        updateQuickScheduleDisplay();
        
        // Update job next shift times
        if (typeof updateNextShiftForJob === 'function') {
            updateNextShiftForJob(job);
        }
        
        // Update job cards
        renderJobs();
    }
    
    console.log('✅ Schedule cleared, Quick Schedule updated');
}

// === KEYBOARD EVENTS ===
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('addJobModal').style.display === 'flex') {
        if (typeof saveJob === 'function') {
            saveJob();
        }
    }
    if (e.key === 'Escape') {
        closeAddJobModal();
        closeDeleteJobModal();
        closeClearScheduleModal();
        if (typeof closeTimePicker === 'function') {
            closeTimePicker();
        }
        if (document.getElementById('overnightModal').style.display === 'flex') {
            if (typeof rejectOvernightShift === 'function') {
                rejectOvernightShift();
            }
        }
    }
    
    // Week navigation shortcuts when in job entry mode
    if (document.getElementById('jobEntryWindow').classList.contains('active')) {
        if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const currentPosition = WeekRolloverSystem.getCurrentWeekPosition();
            if (currentPosition === 'current') {
                switchWeekTab('previous');
            } else if (currentPosition === 'next') {
                switchWeekTab('current');
            }
        } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const currentPosition = WeekRolloverSystem.getCurrentWeekPosition();
            if (currentPosition === 'previous') {
                switchWeekTab('current');
            } else if (currentPosition === 'current') {
                switchWeekTab('next');
            }
        }
    }
    
    // Time picker keyboard shortcuts
    if (document.getElementById('timePickerModal').style.display === 'flex') {
        if (e.key >= '0' && e.key <= '9') {
            if (typeof timeInput === 'function') {
                timeInput(e.key);
            }
        } else if (e.key === 'Backspace') {
            if (typeof timeBackspace === 'function') {
                timeBackspace();
            }
        } else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
            if (typeof timeClear === 'function') {
                timeClear();
            }
        } else if (e.key === 'Enter') {
            if (typeof setTime === 'function') {
                setTime();
            }
        }
    }
    
    // Overnight modal shortcuts
    if (document.getElementById('overnightModal').style.display === 'flex') {
        if (e.key === 'y' || e.key === 'Y') {
            if (typeof confirmOvernightShift === 'function') {
                confirmOvernightShift();
            }
        } else if (e.key === 'n' || e.key === 'N') {
            if (typeof rejectOvernightShift === 'function') {
                rejectOvernightShift();
            }
        }
    }
});

// === WINDOW INITIALIZATION ===
/**
 * Initialize UI Manager with Quick Schedule integration
 */
function initializeUIManager() {
    console.log('🎨 Initializing UI Manager with Quick Schedule integration...');
    
    // Set up event listeners for system updates
    window.addEventListener('jobAdded', (event) => {
        onJobAdded(event.detail.job);
    });
    
    window.addEventListener('jobDeleted', (event) => {
        onJobDeleted(event.detail.jobId);
    });
    
    window.addEventListener('jobColorChanged', (event) => {
        onJobColorChanged(event.detail.jobId);
    });
    
    window.addEventListener('scheduleCleared', (event) => {
        onScheduleCleared(event.detail.jobId);
    });
    
    window.addEventListener('shiftDataChanged', () => {
        onShiftDataChanged();
    });
    
    console.log('✅ UI Manager initialized with Quick Schedule support');
}

// === UTILITY FUNCTIONS ===
/**
 * Trigger a custom event for system coordination
 * @param {string} eventType - Type of event
 * @param {Object} detail - Event detail data
 */
function triggerSystemEvent(eventType, detail = {}) {
    const event = new CustomEvent(eventType, { detail });
    window.dispatchEvent(event);
}

/**
 * Refresh all main window systems (Quick Schedule, History, Jobs)
 */
function refreshMainWindowSystems() {
    updateQuickScheduleDisplay();
    updateHistoryDisplay();
    
    // Update job cards if we have jobs
    if (jobs && jobs.length > 0) {
        renderJobs();
    }
}

// Initialize UI Manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUIManager);
} else {
    initializeUIManager();
}