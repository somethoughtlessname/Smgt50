// === IMPORT/EXPORT SYSTEM ===
// Handles data import and export with text-based format
// Works with historical totals for archived weeks

const ImpexSystem = {
    
    // === EXPORT DATA GENERATION ===
    
    /**
     * Generate complete export text from current app state
     * @returns {string} - Formatted export text
     */
    generateExportText() {
        const exportDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
        
        let exportText = `SCHEDULE MANAGER EXPORT
Export Date: ${exportDate}
Version: 1.0

THREE-WEEK WINDOW
Previous: ${this.formatWeekRange(weekKeys.previous)}
Current:  ${this.formatWeekRange(weekKeys.current)}
Next:     ${this.formatWeekRange(weekKeys.next)}

---
`;
        
        // Export each job
        jobs.forEach(job => {
            exportText += this.generateJobSection(job, weekKeys);
            exportText += '\n---\n';
        });
        
        // Export settings
        const settings = WeekRolloverSystem.getSettings();
        const weekStartName = WeekRolloverSystem.getDayName(settings.weekStartDay || 1);
        exportText += `
SETTINGS
Week Start: ${weekStartName}
Compact Cards: ${compactJobCards ? 'ON' : 'OFF'}
Last Update: ${exportDate}

---
`;
        
        // Export historical totals
        exportText += this.generateHistoricalTotals();
        
        return exportText;
    },
    
    /**
     * Format week range for display
     * @param {string} weekKey - Week key
     * @returns {string} - Formatted date range
     */
    formatWeekRange(weekKey) {
        const weekStart = new Date(weekKey + 'T00:00:00');
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const formatDate = (date) => {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(-2);
            return `${month}/${day}/${year}`;
        };
        
        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    },
    
    /**
     * Generate job section for export
     * @param {Object} job - Job object
     * @param {Object} weekKeys - Week keys object
     * @returns {string} - Formatted job section
     */
    generateJobSection(job, weekKeys) {
        const colorName = (job.color || 'blue').charAt(0).toUpperCase() + (job.color || 'blue').slice(1);
const viewPreference = job.viewPreference || 'standard';
const viewName = viewPreference === 'standard' ? 'Detailed' : viewPreference.charAt(0).toUpperCase() + viewPreference.slice(1);

let jobText = `
JOB: ${job.title} (ID: ${job.id})
Color: ${colorName} | View: ${viewName}
`;
        
        // Previous week (both scheduled and worked)
        jobText += `PREVIOUS WEEK: ${this.formatWeekRange(weekKeys.previous)}\n`;
        jobText += this.generateWeekShifts(job, weekKeys.previous, true);
        
        // Current week (both scheduled and worked)
        jobText += `\nCURRENT WEEK: ${this.formatWeekRange(weekKeys.current)}\n`;
        jobText += this.generateWeekShifts(job, weekKeys.current, true);
        
        // Next week (scheduled only)
        jobText += `\nNEXT WEEK: ${this.formatWeekRange(weekKeys.next)}\n`;
        jobText += this.generateWeekShifts(job, weekKeys.next, false);
        
        return jobText;
    },
    
    /**
     * Generate week shifts text
     * @param {Object} job - Job object
     * @param {string} weekKey - Week key
     * @param {boolean} includeBoth - Include both scheduled and worked
     * @returns {string} - Formatted shifts
     */
    generateWeekShifts(job, weekKey, includeBoth) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekStart = new Date(weekKey + 'T00:00:00');
        let shiftsText = '';
        
        // Start with Monday (day 1), end with Sunday (day 0)
        const dayOrder = [1, 2, 3, 4, 5, 6, 0];
        
        dayOrder.forEach(dayIndex => {
            const currentDate = new Date(weekStart);
            const daysToAdd = dayIndex === 0 ? 6 : dayIndex - 1; // Sunday is last
            currentDate.setDate(weekStart.getDate() + daysToAdd);
            
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getDate().toString().padStart(2, '0');
            const dateStr = `${month}/${day}`;
            
            const scheduledShifts = WeekRolloverSystem.getWeekShifts(job, weekKey, 'scheduled');
            const workedShifts = WeekRolloverSystem.getWeekShifts(job, weekKey, 'worked');
            
            const scheduled = scheduledShifts[dayIndex];
            const worked = workedShifts[dayIndex];
            
            let timeStr = '';
            
            if (includeBoth) {
                // Format: (scheduled)/(worked)
                const schedStr = this.formatShiftTime(scheduled);
                const workStr = this.formatShiftTime(worked);
                timeStr = `(${schedStr})/(${workStr})`;
            } else {
                // Next week: scheduled only
                timeStr = this.formatShiftTime(scheduled);
            }
            
            shiftsText += `  ${dayNames[dayIndex]} ${dateStr}: ${timeStr}\n`;
        });
        
        return shiftsText;
    },
    
    /**
     * Format shift time for export
     * @param {Object} shift - Shift object
     * @returns {string} - Formatted time
     */
    formatShiftTime(shift) {
        if (!shift || !shift.start || shift.start === 'START') {
            return 'INCOMPLETE';
        }
        if (shift.start === 'OFF') {
            return 'OFF';
        }
        
        // Convert "09:00 AM" to "09:00"
        const start = this.convertTo24Hour(shift.start);
        const end = this.convertTo24Hour(shift.end);
        
        if (!start || !end) return 'INCOMPLETE';
        
        return `${start}-${end}`;
    },
    
    /**
     * Convert 12-hour time to 24-hour format
     * @param {string} timeString - Time in 12-hour format
     * @returns {string} - Time in 24-hour format
     */
    convertTo24Hour(timeString) {
        if (!timeString || timeString === 'START' || timeString === 'END' || timeString === 'OFF') {
            return null;
        }
        
        const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;
        
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();
        
        if (period === 'AM' && hours === 12) {
            hours = 0;
        } else if (period === 'PM' && hours !== 12) {
            hours += 12;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    },
    
    /**
     * Generate historical totals section - exports from rollover state
     * @returns {string} - Formatted historical totals
     */
    generateHistoricalTotals() {
        let totalsText = 'HISTORICAL WEEK TOTALS (Worked Hours)\n';
        
        const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
        const historicalWeekKeys = WeekRolloverSystem.getHistoricalWeekKeys();
        
        // Only export weeks not in the three-week window
        const threeWeekSet = new Set([weekKeys.previous, weekKeys.current, weekKeys.next]);
        
        historicalWeekKeys.forEach(weekKey => {
            if (!threeWeekSet.has(weekKey)) {
                // Calculate total for this week across all jobs
                let totalHours = 0;
                jobs.forEach(job => {
                    totalHours += WeekRolloverSystem.getHistoricalWeekTotal(weekKey, job.id);
                });
                
                if (totalHours > 0) {
                    totalsText += `${this.formatWeekRange(weekKey)}: ${totalHours.toFixed(2)}h\n`;
                }
            }
        });
        
        return totalsText;
    },
    
    // === IMPORT DATA PARSING ===
    
    /**
     * Parse and import data from text
     * @param {string} importText - Import text
     * @returns {Object} - Parsed data object or error
     */
    parseImportText(importText) {
        try {
            const lines = importText.split('\n');
            const importedJobs = [];
            let currentJob = null;
            let currentSection = null;
            let settings = {};
            let historicalTotals = [];
            let inHistoricalSection = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Check if we're entering historical totals section
                if (line.startsWith('HISTORICAL WEEK TOTALS')) {
                    inHistoricalSection = true;
                    continue;
                }
                
                // Parse historical totals
                if (inHistoricalSection && line.match(/\d{2}\/\d{2}\/\d{2}\s*-\s*\d{2}\/\d{2}\/\d{2}:\s*[\d.]+h/)) {
                    const match = line.match(/(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2})\/(\d{2})\/(\d{2}):\s*([\d.]+)h/);
                    if (match) {
                        const startMonth = parseInt(match[1]) - 1;
                        const startDay = parseInt(match[2]);
                        const startYear = 2000 + parseInt(match[3]);
                        const weekDate = new Date(startYear, startMonth, startDay);
                        const weekKey = WeekRolloverSystem.getWeekKey(weekDate);
                        const totalHours = parseFloat(match[7]);
                        
                        historicalTotals.push({ weekKey, totalHours });
                    }
                    continue;
                }
                
                // Parse job header
                if (line.startsWith('JOB:')) {
                    if (currentJob) {
                        importedJobs.push(currentJob);
                    }
                    
                    const jobMatch = line.match(/JOB:\s*(.+?)\s*\(ID:\s*(\d+)\)/);
                    if (jobMatch) {
                        currentJob = {
                            id: parseInt(jobMatch[2]),
                            title: jobMatch[1],
                            weeklyScheduledShifts: {},
                            weeklyWorkedShifts: {},
                            color: 'blue',
                            viewPreference: 'standard',
                            nextShift: 'No upcoming shifts'
                        };
                    }
                    inHistoricalSection = false;
                    continue;
                }
                
                // Parse job metadata
                if (currentJob && line.startsWith('Color:')) {
                    const colorMatch = line.match(/Color:\s*(\w+)/);
                    if (colorMatch) {
                        currentJob.color = colorMatch[1].toLowerCase();
                    }
                    const viewMatch = line.match(/View:\s*(\w+)/);
                    if (viewMatch) {
                        currentJob.viewPreference = viewMatch[1].toLowerCase();
                    }
                    continue;
                }
                
                // Parse week sections
                if (line.startsWith('PREVIOUS WEEK:') || line.startsWith('CURRENT WEEK:') || line.startsWith('NEXT WEEK:')) {
                    const dateMatch = line.match(/(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2})\/(\d{2})\/(\d{2})/);
                    if (dateMatch) {
                        const startMonth = parseInt(dateMatch[1]) - 1;
                        const startDay = parseInt(dateMatch[2]);
                        const startYear = 2000 + parseInt(dateMatch[3]);
                        const weekDate = new Date(startYear, startMonth, startDay);
                        const weekKey = WeekRolloverSystem.getWeekKey(weekDate);
                        
                        currentSection = {
                            weekKey: weekKey,
                            type: line.startsWith('NEXT WEEK:') ? 'next' : 'both'
                        };
                    }
                    continue;
                }
                
                // Parse shift lines
                if (currentJob && currentSection && line.match(/^\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{2}\/\d{2}:/)) {
                    const dayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
                    const shiftMatch = line.match(/^\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{2}\/\d{2}:\s*(.+)$/);
                    
                    if (shiftMatch) {
                        const dayName = shiftMatch[1];
                        const dayIndex = dayMap[dayName];
                        const timeData = shiftMatch[2].trim();
                        
                        if (currentSection.type === 'next') {
                            // Next week: scheduled only
                            const shift = this.parseShiftData(timeData, false);
                            if (shift) {
                                if (!currentJob.weeklyScheduledShifts[currentSection.weekKey]) {
                                    currentJob.weeklyScheduledShifts[currentSection.weekKey] = {};
                                }
                                currentJob.weeklyScheduledShifts[currentSection.weekKey][dayIndex] = shift;
                            }
                        } else {
                            // Previous/current week: both scheduled and worked
                            const shifts = this.parseShiftData(timeData, true);
                            if (shifts) {
                                if (!currentJob.weeklyScheduledShifts[currentSection.weekKey]) {
                                    currentJob.weeklyScheduledShifts[currentSection.weekKey] = {};
                                }
                                if (!currentJob.weeklyWorkedShifts[currentSection.weekKey]) {
                                    currentJob.weeklyWorkedShifts[currentSection.weekKey] = {};
                                }
                                currentJob.weeklyScheduledShifts[currentSection.weekKey][dayIndex] = shifts.scheduled;
                                currentJob.weeklyWorkedShifts[currentSection.weekKey][dayIndex] = shifts.worked;
                            }
                        }
                    }
                    continue;
                }
                
                // Parse settings
                if (line.startsWith('Week Start:')) {
                    const dayMatch = line.match(/Week Start:\s*(\w+)/);
                    if (dayMatch) {
                        const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                        settings.weekStartDay = dayMap[dayMatch[1]] || 1;
                    }
                    inHistoricalSection = false;
                    continue;
                }
                
                if (line.startsWith('Compact Cards:')) {
                    const compactMatch = line.match(/Compact Cards:\s*(ON|OFF)/);
                    if (compactMatch) {
                        settings.compactCards = compactMatch[1] === 'ON';
                    }
                    continue;
                }
            }
            
            // Add last job
            if (currentJob) {
                importedJobs.push(currentJob);
            }
            
            // Save historical totals directly to rollover state
            if (historicalTotals.length > 0 && importedJobs.length > 0) {
                const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
                const threeWeekSet = new Set([weekKeys.previous, weekKeys.current, weekKeys.next]);
                
                historicalTotals.forEach(({ weekKey, totalHours }) => {
                    // Skip weeks in three-week window (they have live data)
                    if (!threeWeekSet.has(weekKey)) {
                        // Distribute total across all jobs
                        const hoursPerJob = totalHours / importedJobs.length;
                        
                        importedJobs.forEach(job => {
                            WeekRolloverSystem.saveHistoricalWeekTotal(weekKey, job.id, hoursPerJob);
                        });
                    }
                });
            }
            
            return {
                success: true,
                jobs: importedJobs,
                settings: settings
            };
            
        } catch (error) {
            console.error('Import parsing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * Parse shift data from import line
     * @param {string} timeData - Time data string
     * @param {boolean} bothShifts - Whether to parse both scheduled/worked
     * @returns {Object} - Parsed shift data
     */
    parseShiftData(timeData, bothShifts) {
        if (bothShifts) {
            // Format: (scheduled)/(worked)
            const match = timeData.match(/\(([^)]+)\)\/\(([^)]+)\)/);
            if (match) {
                return {
                    scheduled: this.parseTimeRange(match[1]),
                    worked: this.parseTimeRange(match[2])
                };
            }
        } else {
            // Format: time or OFF or INCOMPLETE
            return this.parseTimeRange(timeData);
        }
        return null;
    },
    
    /**
     * Parse time range string
     * @param {string} timeStr - Time string
     * @returns {Object} - Shift object
     */
    parseTimeRange(timeStr) {
        timeStr = timeStr.trim();
        
        if (timeStr === 'OFF') {
            return { start: 'OFF', end: 'OFF', total: '00.00' };
        }
        
        if (timeStr === 'INCOMPLETE') {
            return { start: 'START', end: 'END', total: '00.00' };
        }
        
        // Parse time range: 09:00-17:00
        const match = timeStr.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (match) {
            const start = this.convertTo12Hour(match[1]);
            const end = this.convertTo12Hour(match[2]);
            const total = this.calculateTotal(match[1], match[2]);
            
            return { start, end, total };
        }
        
        return { start: 'START', end: 'END', total: '00.00' };
    },
    
    /**
     * Convert 24-hour time to 12-hour format
     * @param {string} time24 - Time in 24-hour format
     * @returns {string} - Time in 12-hour format
     */
    convertTo12Hour(time24) {
        const [hours24, minutes] = time24.split(':').map(Number);
        const period = hours24 >= 12 ? 'PM' : 'AM';
        let hours12 = hours24 % 12;
        if (hours12 === 0) hours12 = 12;
        
        return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    },
    
    /**
     * Calculate total hours from time range
     * @param {string} start - Start time
     * @param {string} end - End time
     * @returns {string} - Total in format xx.yy
     */
    calculateTotal(start, end) {
        const [startHours, startMinutes] = start.split(':').map(Number);
        const [endHours, endMinutes] = end.split(':').map(Number);
        
        let totalMinutes;
        const startMins = startHours * 60 + startMinutes;
        const endMins = endHours * 60 + endMinutes;
        
        if (endMins >= startMins) {
            totalMinutes = endMins - startMins;
        } else {
            // Overnight shift
            totalMinutes = (24 * 60) - startMins + endMins;
        }
        
        const decimalHours = totalMinutes / 60;
        return decimalHours.toFixed(2).padStart(5, '0');
    },
    
    // === WINDOW MANAGEMENT ===
    
    /**
     * Show export window with current data
     */
    openExportWindow() {
        const exportText = this.generateExportText();
        const textarea = document.getElementById('impexExportTextarea');
        if (textarea) {
            textarea.value = exportText;
        }
        
        if (typeof showWindow === 'function') {
            showWindow('impexExportWindow');
        }
    },
    
    /**
     * Show import window
     */
    openImportWindow() {
        const textarea = document.getElementById('impexImportTextarea');
        if (textarea) {
            textarea.value = '';
            setTimeout(() => {
                textarea.focus();
            }, 100);
        }
        
        if (typeof showWindow === 'function') {
            showWindow('impexImportWindow');
        }
    },
    
    /**
     * Copy export data to clipboard
     */
    copyExportData() {
        const textarea = document.getElementById('impexExportTextarea');
        if (textarea) {
            textarea.select();
            document.execCommand('copy');
            
            const button = document.getElementById('impexCopyButton');
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }
        }
    },
    
    /**
     * Execute import
     */
    executeImport() {
        const textarea = document.getElementById('impexImportTextarea');
        if (!textarea) return;
        
        const importText = textarea.value.trim();
        
        if (!importText) {
            alert('Please paste schedule data before importing.');
            return;
        }
        
        const result = this.parseImportText(importText);
        
        if (!result.success) {
            alert('Failed to import data: ' + result.error + '\n\nPlease check the format and try again.');
            return;
        }
        
        if (result.jobs.length === 0) {
            alert('No jobs found in import data.');
            return;
        }
        
        const confirmMsg = `Import ${result.jobs.length} job(s)?\n\nThis will REPLACE your current data.\n\nJobs to import:\n${result.jobs.map(j => '- ' + j.title).join('\n')}`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Replace jobs
        jobs.length = 0;
        jobs.push(...result.jobs);
        
        // Apply settings
        if (result.settings.compactCards !== undefined) {
            compactJobCards = result.settings.compactCards;
        }
        if (result.settings.weekStartDay !== undefined) {
            const currentSettings = WeekRolloverSystem.getSettings();
            currentSettings.weekStartDay = result.settings.weekStartDay;
            WeekRolloverSystem.saveSettings(currentSettings);
        }
        
        // Update next shifts
        jobs.forEach(job => {
            if (typeof updateNextShiftForJob === 'function') {
                updateNextShiftForJob(job);
            }
        });
        
        // Save and refresh
        if (typeof saveData === 'function') {
            saveData();
        }
        
        if (typeof renderJobs === 'function') {
            renderJobs();
        }
        
        alert(`Successfully imported ${result.jobs.length} job(s) with historical data!`);
        
        // Return to main window
        if (typeof returnToMain === 'function') {
            returnToMain();
        }
    },
    
    // === UI INJECTION ===
    
    /**
     * Inject windows into DOM
     */
    injectWindows() {
        const windowsHTML = `
            <!-- Export Window -->
            <div class="window" id="impexExportWindow">
                <div class="content impex-content">
                    <div class="impex-textarea-container">
                        <textarea class="impex-textarea" id="impexExportTextarea" readonly></textarea>
                    </div>
                    <div class="impex-button-row">
                        <button class="impex-button copy-btn" id="impexCopyButton" onclick="ImpexSystem.copyExportData()">Copy All</button>
                    </div>
                </div>
            </div>
            
            <!-- Import Window -->
            <div class="window" id="impexImportWindow">
                <div class="content impex-content">
                    <div class="impex-textarea-container">
                        <textarea class="impex-textarea" id="impexImportTextarea" placeholder="Paste your exported schedule data here...

Format should match the export:
- THREE-WEEK WINDOW section
- JOB sections with date ranges
- All 7 days shown (Mon-Sun) with times or OFF
- Format: (scheduled)/(worked) or just time for next week
- SETTINGS and HISTORICAL WEEK TOTALS at the end

Click Export to see the complete format."></textarea>
                    </div>
                    <div class="impex-button-row">
                        <button class="impex-button import-btn" onclick="ImpexSystem.executeImport()">Import Data</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', windowsHTML);
    },
    
    /**
     * Inject header cards for export/import windows
     */
    injectHeaderCards() {
        const frozenHeader = document.querySelector('.frozen-header');
        if (!frozenHeader) return;
        
        const headerCardsHTML = `
            <!-- Export Title Card -->
            <div class="settings-title-header-card" id="impexExportTitleHeaderCard">
                <div class="settings-header-back" onclick="returnToDataWindow()"></div>
                <div class="settings-header-center">Export Data</div>
                <div class="settings-header-unused"></div>
            </div>
            
            <!-- Import Title Card -->
            <div class="settings-title-header-card" id="impexImportTitleHeaderCard">
                <div class="settings-header-back" onclick="returnToDataWindow()"></div>
                <div class="settings-header-center">Import Data</div>
                <div class="settings-header-unused"></div>
            </div>
        `;
        
        frozenHeader.insertAdjacentHTML('beforeend', headerCardsHTML);
    },
    
    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('impex-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'impex-styles';
        style.textContent = `
            /* Impex Window Styles */
            .impex-content {
                display: flex;
                flex-direction: column;
                height: calc(100vh - 40px);
                padding: 4px 16px 16px 16px;
            }
            
            .impex-textarea-container {
                flex: 1;
        margin-top: 4px;
                margin-bottom: 4px;
                overflow: hidden;
                background: var(--bg3);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
            }
            
            .impex-textarea {
                width: 100%;
                height: 100%;
                background: var(--bg3);
                border: none;
                padding: 12px;
                font-size: 12px;
                color: var(--text1);
                font-family: 'Courier New', Courier, monospace;
                line-height: 1.4;
                resize: none;
                white-space: pre-wrap;
                overflow-wrap: break-word;
                overflow-x: auto;
                overflow-y: auto;
            }
            
            .impex-textarea:focus {
                outline: none;
            }
            
            .impex-textarea::placeholder {
                color: var(--text1);
                font-size: 12px;
            }
            
            .impex-button-row {
                display: flex;
                gap: 4px;
            }
            
            .impex-button {
                flex: 1;
                background: var(--bg4);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                height: 40px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
                color: var(--text1);
            }
            
            .impex-button:hover {
                background: var(--bg3);
            }
            
            .impex-button.copy-btn {
                background: var(--secondary);
                color: white;
            }
            
            .impex-button.copy-btn:hover {
                background: #4a7c95;
            }
            
            .impex-button.import-btn {
                background: var(--primary);
                color: white;
            }
            
            .impex-button.import-btn:hover {
                background: var(--primary-dark);
            }
            
            body.impex-export-mode,
            body.impex-import-mode {
                padding-top: 40px;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    /**
     * Replace placeholder cards in data window
     */
    replaceDataWindowContent() {
        const dataWindow = document.getElementById('dataWindow');
        if (!dataWindow) return;
        
        const content = dataWindow.querySelector('.content');
        if (!content) return;
        
        // Replace the content with functional cards
        content.innerHTML = `
            <div class="section-divider">Import / Export</div>
            
            <div class="job-card" onclick="ImpexSystem.openExportWindow()">
                <div class="job-title-section">
                    <div class="job-title">Export Schedule Data</div>
                </div>
                <div class="job-info-section">
                    <div class="next-shift-time">Copy data to share or backup</div>
                </div>
            </div>
            
            <div class="job-card" onclick="ImpexSystem.openImportWindow()">
                <div class="job-title-section">
                    <div class="job-title">Import Schedule Data</div>
                </div>
                <div class="job-info-section">
                    <div class="next-shift-time">Paste data to restore or merge</div>
                </div>
            </div>
            
            <div class="placeholder-section">
                Export creates a text backup of all your schedule data.<br>
                Import allows you to restore from a backup.
            </div>
        `;
    },
    
    /**
     * Initialize the impex system
     */
    initialize() {
        console.log('🚀 Initializing Import/Export System...');
        
        // Inject styles
        this.injectStyles();
        
        // Inject windows
        this.injectWindows();
        
        // Inject header cards
        this.injectHeaderCards();
        
        // Replace data window content
        this.replaceDataWindowContent();
        
        console.log('✅ Import/Export System initialized');
    }
};

// === GLOBAL HELPER FUNCTIONS ===

/**
 * Return to data window from export/import
 */
function returnToDataWindow() {
    if (typeof showWindow === 'function') {
        showWindow('dataWindow');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ImpexSystem.initialize();
    });
} else {
    ImpexSystem.initialize();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImpexSystem;
}