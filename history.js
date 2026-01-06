// === HISTORY SYSTEM ===
// Calculates and displays work history across all jobs with week rollover integration
// Seamlessly reads from both live 3-week data and archived historical totals

const HistorySystem = {
    
    // === CONFIGURATION ===
    config: {
        color: 'purple', // Header color
        showThisNextWeek: true, // Show THIS WEEK and NEXT WEEK cards
        showLastWeek: true, // Show LAST X WEEKS section
        weekCount: 5 // Number of weeks to show in LAST X WEEKS (1-8)
    },
    
    // === CORE CALCULATION FUNCTIONS ===
    
    /**
     * Calculate total hours for a specific week across all jobs
     * Intelligently checks if week is in live window or archived
     * @param {string} weekKey - Week key in YYYY-MM-DD format
     * @param {string} shiftType - 'scheduled' or 'worked'
     * @param {Array} jobs - Array of job objects
     * @returns {number} - Total hours for the week
     */
    calculateWeekTotalHours(weekKey, shiftType, jobs) {
        const threeWeekKeys = WeekRolloverSystem.getThreeWeekKeys();
        const isInLiveWindow = weekKey === threeWeekKeys.previous || 
                              weekKey === threeWeekKeys.current || 
                              weekKey === threeWeekKeys.next;
        
        if (isInLiveWindow) {
            // Use live shift data for three-week window
            let totalMinutes = 0;
            
            jobs.forEach(job => {
                const weekShifts = WeekRolloverSystem.getWeekShifts(job, weekKey, shiftType);
                
                // Sum up all days in the week
                for (let day = 0; day <= 6; day++) {
                    const dayShift = weekShifts[day];
                    if (dayShift && dayShift.total && dayShift.total !== '00.00') {
                        const hours = parseFloat(dayShift.total);
                        if (!isNaN(hours)) {
                            totalMinutes += Math.round(hours * 60);
                        }
                    }
                }
            });
            
            const totalHours = totalMinutes / 60;
            return totalHours;
        } else {
            // Use historical totals for archived weeks (worked hours only)
            if (shiftType === 'worked') {
                let totalHours = 0;
                
                jobs.forEach(job => {
                    totalHours += WeekRolloverSystem.getHistoricalWeekTotal(weekKey, job.id);
                });
                
                return totalHours;
            } else {
                // No historical scheduled data
                return 0;
            }
        }
    },
    
    
    
    /**
     * Get formatted total hours string
     * @param {number} totalHours - Total hours as decimal
     * @returns {string} - Formatted hours string (xx.yy)
     */
    formatTotalHours(totalHours) {
        if (totalHours === 0) return '00.00';
        return totalHours.toFixed(2).padStart(5, '0');
    },
    
    /**
 * Parse time string to minutes for comparison
 */
parseTimeToMinutes(timeString) {
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
},
    
 /**
 * Check if a shift has passed based on current time
 */
hasShiftPassed(weekKey, dayOfWeek, endTime) {
    if (!endTime || endTime === 'END' || endTime === 'OFF') {
        return false;
    }

    const now = new Date();
    const currentWeekKey = WeekRolloverSystem.getWeekKey();
    
    if (weekKey !== currentWeekKey) {
        const weekDate = new Date(weekKey + 'T00:00:00');
        const currentWeekDate = new Date(currentWeekKey + 'T00:00:00');
        
        if (weekDate < currentWeekDate) {
            return true;
        }
        return false;
    }
    
    const currentDayOfWeek = now.getDay();
    
    if (dayOfWeek < currentDayOfWeek) {
        return true;
    }
    
    if (dayOfWeek > currentDayOfWeek) {
        return false;
    }
    
    const shiftEndMinutes = this.parseTimeToMinutes(endTime);
    if (shiftEndMinutes === null) {
        return false;
    }
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= shiftEndMinutes;
},
    
 /**
 * Calculate predicted weekly total based on day-by-day analysis
 */
calculatePredictedWeekTotal(weekKey, jobs) {
    let totalMinutes = 0;
    
    for (let day = 0; day <= 6; day++) {
        let dayTotalMinutes = 0;
        
        jobs.forEach(job => {
            const scheduledShifts = WeekRolloverSystem.getWeekShifts(job, weekKey, 'scheduled');
            const workedShifts = WeekRolloverSystem.getWeekShifts(job, weekKey, 'worked');
            
            const scheduledShift = scheduledShifts[day];
            const workedShift = workedShifts[day];
            
            const shiftHasPassed = scheduledShift && scheduledShift.end ? 
                this.hasShiftPassed(weekKey, day, scheduledShift.end) : false;
            
            let hoursToUse = 0;
            
            if (shiftHasPassed && workedShift && workedShift.total && workedShift.total !== '00.00') {
                hoursToUse = parseFloat(workedShift.total);
            } else if (scheduledShift && scheduledShift.total && scheduledShift.total !== '00.00') {
                hoursToUse = parseFloat(scheduledShift.total);
            }
            
            if (!isNaN(hoursToUse) && hoursToUse > 0) {
                dayTotalMinutes += Math.round(hoursToUse * 60);
            }
        });
        
        totalMinutes += dayTotalMinutes;
    }
    
    return totalMinutes / 60;
},
    
    // === DATE FORMATTING FUNCTIONS ===
    
    /**
     * Get ordinal suffix for day
     * @param {number} day - Day number
     * @returns {string} - Ordinal suffix (st, nd, rd, th)
     */
    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'TH';
        switch (day % 10) {
            case 1: return 'ST';
            case 2: return 'ND';
            case 3: return 'RD';
            default: return 'TH';
        }
    },
    
    /**
     * Format date for premium display (THIS WEEK / NEXT WEEK)
     * @param {string} weekKey - Week key
     * @returns {Object} - Object with start and end date strings
     */
    formatPremiumDateRange(weekKey) {
        const weekStart = new Date(weekKey + 'T00:00:00');
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const startDay = weekStart.getDate();
        const startOrdinal = this.getOrdinalSuffix(startDay);
        
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const endDay = weekEnd.getDate();
        const endOrdinal = this.getOrdinalSuffix(endDay);
        
        return {
            start: `${startMonth} ${startDay}${startOrdinal}`,
            end: `${endMonth} ${endDay}${endOrdinal}`
        };
    },
    
    /**
     * Format date for compact display (LAST X WEEKS)
     * @param {Date} date - Date object
     * @returns {string} - Formatted date (mm/dd)
     */
    formatCompactDate(date) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
    },
    
    // === HTML GENERATION FUNCTIONS ===
    
    /**
     * Generate HTML for this week card with three-section layout
     * @param {Array} jobs - Array of job objects
     * @returns {string} - HTML string for the card
     */
    generateThisWeekCard(jobs) {
    const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
    
    const currentWeekWorked = this.calculateWeekTotalHours(weekKeys.current, 'worked', jobs);
    const currentWeekScheduled = this.calculateWeekTotalHours(weekKeys.current, 'scheduled', jobs);
    
    // NEW: Calculate predicted total
    const predictedTotal = this.calculatePredictedWeekTotal(weekKeys.current, jobs);
    
    const dateRange = this.formatPremiumDateRange(weekKeys.current);
    
    // CHANGED: Add predicted total in parentheses
    const currentWeekHours = `${this.formatTotalHours(currentWeekWorked)}/${this.formatTotalHours(currentWeekScheduled)} (${this.formatTotalHours(predictedTotal)})`;
        
    
    const colorClass = `color-${this.config.color}`;
    
// Only add this-week class when weekCount = 1 (all three cards in one row)
    const weekCount = this.config.weekCount || 5;
    const thisWeekClass = weekCount === 1 ? 'this-week' : '';
    
    return `
        <div class="history-entry-card ${thisWeekClass}">
            <div class="history-header ${colorClass}">THIS WEEK</div>
            <div class="history-content">
                ${dateRange.start}<br><div class="history-divider-line"></div>${dateRange.end}
            </div>
            <div class="history-hours ${colorClass}">
                ${currentWeekHours}
            </div>
        </div>
    `;
},
    
    /**
     * Generate HTML for next week card with three-section layout
     * @param {Array} jobs - Array of job objects
     * @returns {string} - HTML string for the card
     */
    generateNextWeekCard(jobs) {
        const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
        
        // Calculate totals for next week (scheduled only)
        const nextWeekTotal = this.calculateWeekTotalHours(weekKeys.next, 'scheduled', jobs);
        
        // Format date range
        const dateRange = this.formatPremiumDateRange(weekKeys.next);
        
        // Format total hours - next week as scheduled only
        const nextWeekHours = this.formatTotalHours(nextWeekTotal);
        
        const colorClass = `color-${this.config.color}`;
        
        return `
            <div class="history-entry-card">
                <div class="history-header ${colorClass}">NEXT WEEK</div>
                <div class="history-content">
                    ${dateRange.start}<br><div class="history-divider-line"></div>${dateRange.end}
                </div>
                <div class="history-hours ${colorClass}">
                    ${nextWeekHours}
                </div>
            </div>
        `;
    },
    
    /**
     * Generate HTML for last X weeks card with three-section layout
     * Seamlessly reads from live data or historical totals as needed
     * @param {Array} jobs - Array of job objects
     * @returns {string} - HTML string for the card
     */
    generateLastWeeksCard(jobs) {
        const currentWeekKey = WeekRolloverSystem.getWeekKey();
        const contentSections = [];
        const hoursSections = [];
        const weekCount = this.config.weekCount || 5;
        // Special handling for weekCount = 1: return single compact card
if (weekCount === 1) {
    const weekStart = new Date(currentWeekKey + 'T00:00:00');
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weekKey = WeekRolloverSystem.getWeekKey(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekTotal = this.calculateWeekTotalHours(weekKey, 'worked', jobs);
    const weekHours = this.formatTotalHours(weekTotal);
    
    const dateRange = this.formatPremiumDateRange(weekKey);
    const colorClass = `color-${this.config.color}`;
    
    // Return single card WITHOUT full-width class
    return `
        <div class="history-entry-card">
            <div class="history-header ${colorClass}">LAST WEEK</div>
            <div class="history-content">
                ${dateRange.start}<br><div class="history-divider-line"></div>${dateRange.end}
            </div>
            <div class="history-hours ${colorClass}">
                ${weekHours}
            </div>
        </div>
    `;
}
        
        // Handle weekCount = 1 as single card instead of multi-section
if (weekCount === 1) {
    // Calculate last week data
    const weekStart = new Date(currentWeekKey + 'T00:00:00');
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weekKey = WeekRolloverSystem.getWeekKey(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Calculate total hours (worked only)
    const weekTotal = this.calculateWeekTotalHours(weekKey, 'worked', jobs);
    const weekHours = this.formatTotalHours(weekTotal);
    
    // Format date range using premium format
    const dateRange = this.formatPremiumDateRange(weekKey);
    
    const colorClass = `color-${this.config.color}`;
    
    // Return single compact card (NO full-width class)
    return `
        <div class="history-entry-card">
            <div class="history-header ${colorClass}">LAST WEEK</div>
            <div class="history-content">
                ${dateRange.start}<br><div class="history-divider-line"></div>${dateRange.end}
            </div>
            <div class="history-hours ${colorClass}">
                ${weekHours}
            </div>
        </div>
    `;
}5
        
        // Generate weeks going backwards from current week (newest to oldest, left to right)
        for (let weeksBack = 1; weeksBack <= weekCount; weeksBack++) {
            const weekStart = new Date(currentWeekKey + 'T00:00:00');
            weekStart.setDate(weekStart.getDate() - (weeksBack * 7));
            
            const weekKey = WeekRolloverSystem.getWeekKey(weekStart);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            // Calculate total hours for this week (using worked hours)
            // This automatically checks live vs historical data
            const weekTotal = this.calculateWeekTotalHours(weekKey, 'worked', jobs);
            const weekHours = this.formatTotalHours(weekTotal);
            
            // Format dates
            const startDate = this.formatCompactDate(weekStart);
            const endDate = this.formatCompactDate(weekEnd);
            
            contentSections.push(`
                <div class="history-content-section">
                    ${startDate}<br><div class="history-divider-line"></div>${endDate}
                </div>
            `);
            
            hoursSections.push(`
                <div class="history-hours-section">${weekHours}</div>
            `);
        }
        
        // Determine header text based on week count
        let headerText;
        if (weekCount === 1) {
            headerText = 'LAST WEEK';
        } else {
            headerText = `LAST ${weekCount} WEEKS`;
        }
        
        const colorClass = `color-${this.config.color}`;
        const sectionClass = weekCount <= 5 ? 'five-section' : 'eight-section';
        
        return `
            <div class="history-entry-card full-width">
                <div class="history-header ${colorClass}">${headerText}</div>
                <div class="history-content ${sectionClass}">
                    ${contentSections.join('')}
                </div>
                <div class="history-hours ${colorClass} ${sectionClass}">
                    ${hoursSections.join('')}
                </div>
            </div>
        `;
    },
    
    // === MAIN RENDERING FUNCTION ===
    
    /**
     * Render complete history section
     * @param {Array} jobs - Array of job objects
     * @returns {string} - Complete HTML for history section
     */
    renderHistory(jobs) {
    if (!jobs || jobs.length === 0) {
        return `
            <div class="empty-state">
                No jobs found.<br>
                Add some jobs to see your work history here.
            </div>
        `;
    }
    
    let html = '';
    
    // Determine if all three cards should be in one row
    const weekCount = this.config.weekCount || 5;
    const showAllInRow = this.config.showThisNextWeek && this.config.showLastWeek && weekCount === 1;
    
    if (showAllInRow) {
        // Put LAST WEEK, THIS WEEK, and NEXT WEEK in one row
        const lastWeekCard = this.generateLastWeeksCard(jobs);
        const thisWeekCard = this.generateThisWeekCard(jobs);
        const nextWeekCard = this.generateNextWeekCard(jobs);
        
        html += `
            <div class="history-cards-row">
                ${lastWeekCard}
                ${thisWeekCard}
                ${nextWeekCard}
            </div>
        `;
    } else {
        // Original layout: THIS/NEXT in row, LAST below
        if (this.config.showThisNextWeek) {
            const thisWeekCard = this.generateThisWeekCard(jobs);
            const nextWeekCard = this.generateNextWeekCard(jobs);
            
            html += `
                <div class="history-cards-row">
                    ${thisWeekCard}
                    ${nextWeekCard}
                </div>
            `;
        }
        
        if (this.config.showLastWeek) {
            const lastWeeksCard = this.generateLastWeeksCard(jobs);
            html += lastWeeksCard;
        }
    }
    
    if (!this.config.showThisNextWeek && !this.config.showLastWeek) {
        html = `
            <div class="empty-state">
                History is disabled.<br>
                Enable history sections in Settings to see your work history.
            </div>
        `;
    }
    
    return html;
},
    
    // === INTEGRATION FUNCTIONS ===
    
    /**
     * Update history display in the DOM
     * @param {Array} jobs - Array of job objects
     */
    updateHistoryDisplay(jobs) {
        const historySection = document.getElementById('historySection');
        if (historySection) {
            historySection.innerHTML = this.renderHistory(jobs);
        }
    },
    
    /**
     * Initialize history system
     * @param {Array} jobs - Array of job objects
     */
    initialize(jobs) {
        console.log('🚀 Initializing History System...');
        
        // Add CSS for history cards if not already present
        this.injectHistoryStyles();
        
        // Initial render
        this.updateHistoryDisplay(jobs);
        
        console.log('✅ History System initialized');
    },
    
    /**
     * Inject necessary CSS styles for three-section history cards
     */
    injectHistoryStyles() {
        // Check if styles already exist
        if (document.getElementById('history-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'history-styles';
        style.textContent = `
            /* History Cards Row for Side-by-Side Layout */
            .history-cards-row {
    display: flex;
    gap: 4px;
    margin-bottom: var(--gap);
}

            /* History Entry Cards - THREE SECTION STRUCTURE */
            .history-entry-card {
    background: var(--bg2);
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    flex: 1;
    height: 83px;
}
        
        .history-entry-card.this-week {
    flex: 1.5;
}

            .history-entry-card.full-width {
                width: 100%;
                margin-left: 0;
                margin-right: 0;
                box-sizing: border-box;
            }

            /* SECTION 1: Header (20px) - Same as quick schedule */
            .history-header {
                height: 20px;
                background: var(--job-color-blue);
                border-bottom: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: var(--text1);
                flex-shrink: 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Color variations for history headers */
            .history-header.color-blue { background: var(--job-color-blue); }
            .history-header.color-green { background: var(--job-color-green); }
            .history-header.color-purple { background: var(--job-color-purple); }
            .history-header.color-red { background: var(--job-color-red); }
            .history-header.color-orange { background: var(--job-color-orange); }
            .history-header.color-teal { background: var(--job-color-teal); }
            .history-header.color-gold { background: var(--job-color-gold); }
            .history-header.color-brown { background: var(--job-color-brown); }

            /* SECTION 2: Middle Content (40px) */
            .history-content {
                height: 40px;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: var(--text1);
                line-height: 1.2;
                flex-shrink: 0;
                position: relative;
                overflow: hidden;
            }

            /* Multi-section content layout */
            .history-content.five-section,
            .history-content.eight-section {
                flex-direction: row;
                padding: 0;
            }

            .history-content-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 500;
                color: var(--text1);
                line-height: 1.1;
                height: 100%;
                position: relative;
            }

            .history-content-section:not(:last-child)::after {
                content: '';
                position: absolute;
                right: 0;
                top: 0;
                height: 100%;
                width: var(--b);
                background: var(--border);
            }

            /* Adjust font size for 8-section layout */
            .history-content.eight-section .history-content-section {
                font-size: 9px;
            }

            /* SECTION 3: Bottom Hours (20px) - Same height as header */
            .history-hours {
                height: 20px;
                background: var(--job-color-blue);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: var(--text1);
                flex-shrink: 0;
                position: relative;
                overflow: hidden;
            }

            /* Color variations for history hours */
            .history-hours.color-blue { background: var(--job-color-blue); }
            .history-hours.color-green { background: var(--job-color-green); }
            .history-hours.color-purple { background: var(--job-color-purple); }
            .history-hours.color-red { background: var(--job-color-red); }
            .history-hours.color-orange { background: var(--job-color-orange); }
            .history-hours.color-teal { background: var(--job-color-teal); }
            .history-hours.color-gold { background: var(--job-color-gold); }
            .history-hours.color-brown { background: var(--job-color-brown); }

            /* Multi-section hours layout */
            .history-hours.five-section,
            .history-hours.eight-section {
                padding: 0;
            }

            .history-hours-section {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: var(--text1);
                height: 100%;
                position: relative;
            }

            .history-hours-section:not(:last-child)::after {
                content: '';
                position: absolute;
                right: 0;
                top: 0;
                height: 100%;
                width: var(--b);
                background: var(--border);
            }

            /* Adjust font size for 8-section layout */
            .history-hours.eight-section .history-hours-section {
                font-size: 10px;
            }

            /* Divider lines for content sections */
            .history-divider-line {
                width: 75%;
                height: 2px;
                background: var(--border);
                margin: 2px 0;
            }
        `;
        
        document.head.appendChild(style);
    }
};

// === INTEGRATION WITH MAIN APP ===

/**
 * Function to be called from main app to render history section
 * @param {Array} jobs - Array of job objects
 */
function renderHistorySection(jobs) {
    return HistorySystem.renderHistory(jobs);
}

/**
 * Function to update history when week rollover occurs
 * @param {Array} jobs - Array of job objects
 */
function updateHistoryOnRollover(jobs) {
    console.log('📊 Updating history display after week rollover...');
    HistorySystem.updateHistoryDisplay(jobs);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistorySystem;
}