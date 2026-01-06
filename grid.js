// === QUICK SCHEDULE GRID SYSTEM ===
// Displays next 7 days of shifts across all jobs in a vertical timeline
// Shows "YOU HAVE THE DAY OFF!" for today, "NO SHIFTS SCHEDULED YET" for future days

const QuickScheduleGrid = {
    // === CONFIGURATION ===
    config: {
        fixedPaddingWidth: 10,   // Fixed padding width in pixels (same on both sides)
        daysToShow: 7,           // Show 7 days (today + next 6) - will be updated from settings
        color: 'purple'          // Header color - will be updated from settings
    },

    // === CORE DATA PROCESSING ===
    
    /**
 * Check if two shifts overlap in time
 * @param {Object} shift1 - First shift object
 * @param {Object} shift2 - Second shift object
 * @returns {boolean} - True if shifts overlap
 */
shiftsOverlap(shift1, shift2) {
    return shift1.start < shift2.end && shift2.start < shift1.end;
},

/**
 * Assign rows to shifts based on overlap detection
 * @param {Array} shifts - Array of shift objects
 * @returns {Object} - Object with shiftsWithRows array and totalRows count
 */
assignRows(shifts) {
    const rows = []; // Array of arrays, each containing shifts in that row
    const shiftsWithRows = [];

    shifts.forEach(shift => {
        let assignedRow = -1;

        // Try to find a row where this shift doesn't overlap with existing shifts
        for (let i = 0; i < rows.length; i++) {
            const rowShifts = rows[i];
            const hasOverlap = rowShifts.some(existingShift => 
                this.shiftsOverlap(shift, existingShift)
            );

            if (!hasOverlap) {
                assignedRow = i;
                break;
            }
        }

        // If no suitable row found, create a new row
        if (assignedRow === -1) {
            assignedRow = rows.length;
            rows.push([]);
        }

        // Add shift to the assigned row
        rows[assignedRow].push(shift);
        shiftsWithRows.push({ ...shift, row: assignedRow });
    });

    return { shiftsWithRows, totalRows: rows.length };
},
    
    /**
     * Get shifts for a specific day across all jobs
     * @param {Array} jobs - Array of job objects
     * @param {number} dayOffset - Day offset (0 = today, 1 = tomorrow, etc.)
     * @returns {Array} - Array of shift objects with job info
     */
    getShiftsForDay(jobs, dayOffset = 0) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const dayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, etc.
        const shifts = [];
        
        // Get week key for the target date
        let weekKey;
        if (dayOffset === 0) {
            weekKey = WeekRolloverSystem.getWeekKey(); // Today - current week
        } else {
            weekKey = WeekRolloverSystem.getWeekKey(targetDate); // Future - might be different week
        }
        
        jobs.forEach(job => {
            // Get scheduled shifts for the target week
            const weeklyShifts = WeekRolloverSystem.getWeekShifts(job, weekKey, 'scheduled');
            const dayShift = weeklyShifts[dayOfWeek];
            
            if (dayShift && dayShift.start && dayShift.end && 
                dayShift.start !== 'START' && dayShift.end !== 'END' && 
                dayShift.start !== 'OFF' && dayShift.end !== 'OFF') {
                
                const startHour = this.parseTimeToHour(dayShift.start);
                const endHour = this.parseTimeToHour(dayShift.end);
                
                if (startHour !== null && endHour !== null) {
                    let actualStart = startHour;
                    let actualEnd = endHour;
                    
                    // Handle overnight shifts
                    if (endHour < startHour) {
                        actualEnd = endHour + 24;
                    } else if (endHour === startHour) {
                        // 24-hour shift
                        actualEnd = endHour + 24;
                    }
                    
                    shifts.push({
                        jobId: job.id,
                        jobTitle: job.title,
                        jobColor: job.color || 'blue',
                        start: actualStart,
                        end: actualEnd,
                        startTime: dayShift.start,
                        endTime: dayShift.end,
                        duration: actualEnd - actualStart
                    });
                }
            }
        });
        
        return shifts;
    },
    
    /**
     * Check if a day is explicitly set to OFF across all jobs
     * @param {Array} jobs - Array of job objects
     * @param {number} dayOffset - Day offset (0 = today, 1 = tomorrow, etc.)
     * @returns {boolean} - True if day is OFF
     */
    isDayOff(jobs, dayOffset) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const dayOfWeek = targetDate.getDay();
        
        let weekKey;
        if (dayOffset === 0) {
            weekKey = WeekRolloverSystem.getWeekKey();
        } else {
            weekKey = WeekRolloverSystem.getWeekKey(targetDate);
        }
        
        let hasAnyScheduledShifts = false;
        let allAreOff = true;
        
        jobs.forEach(job => {
            const weeklyShifts = WeekRolloverSystem.getWeekShifts(job, weekKey, 'scheduled');
            const dayShift = weeklyShifts[dayOfWeek];
            
            if (dayShift && dayShift.start && dayShift.end) {
                if (dayShift.start === 'OFF' || dayShift.end === 'OFF') {
                    // This job is OFF
                    hasAnyScheduledShifts = true;
                } else if (dayShift.start !== 'START' && dayShift.end !== 'END') {
                    // This job has actual scheduled time
                    allAreOff = false;
                }
            }
        });
        
        // Day is OFF if there are scheduled jobs and all of them are OFF
        return hasAnyScheduledShifts && allAreOff;
    },
    
    /**
     * Get all shifts for the configured number of days
     * @param {Array} jobs - Array of job objects
     * @returns {Array} - Array of arrays, each containing shifts for that day
     */
    getAllWeekShifts(jobs) {
        const allShifts = [];
        for (let day = 0; day < this.config.daysToShow; day++) {
            allShifts.push(this.getShiftsForDay(jobs, day));
        }
        return allShifts;
    },
    
    /**
     * Parse time string to decimal hour
     * @param {string} timeString - Time in "HH:MM AM/PM" format
     * @returns {number|null} - Hour as decimal or null if invalid
     */
    parseTimeToHour(timeString) {
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
        
        return hours + (minutes / 60);
    },
    
    /**
     * Format hour as display time (no AM/PM)
     * @param {number} hour - Hour as decimal
     * @returns {string} - Formatted time
     */
    formatHour(hour) {
        const displayHour = Math.floor(hour % 24);
        
        // Convert 24-hour to 12-hour format without AM/PM
        if (displayHour === 0) {
            return '12'; // Midnight
        } else if (displayHour <= 12) {
            return `${displayHour}`;
        } else {
            return `${displayHour - 12}`;
        }
    },
    
/**
 * Check if an hour is during night time (6pm to 6am)
 * @param {number} hour - Hour in 24-hour format (can be > 24 for overnight shifts)
 * @returns {boolean} - True if night hour, false otherwise
 */
isNightHour(hour) {
    const normalizedHour = hour % 24;
    return normalizedHour >= 18 || normalizedHour <= 5;
},
    
    /**
     * Calculate timeline bounds based on all days of shifts
     * @param {Array} allShifts - Array of arrays of shift objects
     * @returns {Object} - Timeline bounds and metadata
     */
    calculateTimelineBounds(allShifts) {
        // Flatten all shifts from all days
        const allShiftsFlat = allShifts.flat();
        
        if (allShiftsFlat.length === 0) {
            return {
                start: 9,
                end: 20,
                isDefault: true,
                totalHours: 11
            };
        }
        
        const firstStart = Math.min(...allShiftsFlat.map(s => s.start));
        const lastEnd = Math.max(...allShiftsFlat.map(s => s.end));
        
        // Use floor for start and ceil for end to include full hours
        const start = Math.floor(firstStart);
        const end = Math.ceil(lastEnd);
        
        return {
            start: start,
            end: end,
            isDefault: false,
            totalHours: end - start
        };
    },
    
    /**
     * Format day header text
     * @param {number} dayOffset - Day offset (0 = today, 1 = tomorrow, etc.)
     * @returns {string} - Formatted header text
     */
    formatDayHeader(dayOffset) {
        if (dayOffset === 0) {
            return 'TODAY';
        }
        
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        
        const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const month = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = targetDate.getDate();
        
        return `${dayName} ${month} ${day}`;
    },
    
    // === HTML GENERATION ===
    
    /**
     * Generate timeline columns HTML
     * @param {Object} bounds - Timeline bounds
     * @returns {string} - HTML for timeline columns
     */
    generateTimelineColumns(bounds) {
        let html = '';
        
        for (let i = 0; i < bounds.totalHours; i++) {
            html += `<div class="timeline-column"></div>`;
        }
        
        return html;
    },
    
    /**
 * Generate shift bars HTML for a single day with dynamic row positioning
 * @param {Array} shifts - Array of shift objects for this day
 * @param {Object} bounds - Timeline bounds
 * @returns {Object} - Object with html and totalRows
 */
generateShiftBars(shifts, bounds) {
    if (shifts.length === 0) {
        return { html: '', totalRows: 0 };
    }

    const paddingGap = 1; // 1px gap from grid lines
    const ROW_HEIGHT = 22; // Height per row in pixels
    
    // Assign rows to shifts based on overlap
    const { shiftsWithRows, totalRows } = this.assignRows(shifts);
    
    let html = '';
    
    shiftsWithRows.forEach(shift => {
        // Calculate horizontal position within the content area
        const startOffset = shift.start - bounds.start;
        const endOffset = shift.end - bounds.start;
        const totalContentHours = bounds.totalHours;
        
        // Calculate percentages within the content area
        const startPercent = (startOffset / totalContentHours) * 100;
        const endPercent = ((totalContentHours - endOffset) / totalContentHours) * 100;
        
        // Position: horizontal percentage + vertical row position
        const leftPos = `calc(${startPercent}% + ${paddingGap}px)`;
        const rightPos = `calc(${endPercent}% + ${paddingGap}px)`;
        const topPos = shift.row * ROW_HEIGHT;
        
        const displayText = shift.jobTitle;
        
        html += `
            <div class="shift-bar shift-${shift.jobColor}" 
                 style="left: ${leftPos}; right: ${rightPos}; top: ${topPos}px;"
                 title="${shift.jobTitle}: ${shift.startTime} - ${shift.endTime} (${shift.duration.toFixed(1)}h)">
                ${displayText}
            </div>
        `;
    });
    
    return { html, totalRows };
},
    
    /**
 * Generate a single day row HTML with dynamic height
 * @param {number} dayOffset - Day offset (0 = today, 1 = tomorrow, etc.)
 * @param {Array} shifts - Shifts for this day
 * @param {Object} bounds - Timeline bounds
 * @param {Array} jobs - Array of job objects (to check OFF status)
 * @returns {string} - HTML for day row
 */
generateDayRow(dayOffset, shifts, bounds, jobs) {
    const headerText = this.formatDayHeader(dayOffset);
    const isToday = dayOffset === 0;
    const headerClass = isToday ? 'day-header current' : 'day-header';
    
    // Use the configured color for headers
    const colorClass = `color-${this.config.color}`;
    
    // Check if day is explicitly set to OFF
    const isDayOff = this.isDayOff(jobs, dayOffset);
    
    // If no shifts, show appropriate message (fixed height)
    if (shifts.length === 0) {
        const dayOffMessage = isDayOff 
            ? 'YOU HAVE THE DAY OFF!' 
            : 'NO SHIFTS SCHEDULED YET';
        
        return `
            <div class="${headerClass} ${colorClass}">${headerText}</div>
            <div class="day-timeline" style="height: 25px;">
                <div class="timeline-padding"></div>
                <div class="timeline-content day-off">
                    <div class="day-off-message">${dayOffMessage}</div>
                </div>
                <div class="timeline-padding"></div>
            </div>
        `;
    }
    
    // Generate timeline with dynamic row positioning
    const columnsHtml = this.generateTimelineColumns(bounds);
    const { html: shiftBarsHtml, totalRows } = this.generateShiftBars(shifts, bounds);
    
    // Calculate dynamic height: (rows * 22px) + 3px bottom padding
    const ROW_HEIGHT = 22;
    const BOTTOM_PADDING = 3;
    const timelineHeight = (totalRows * ROW_HEIGHT) + BOTTOM_PADDING;
    
    return `
        <div class="${headerClass} ${colorClass}">${headerText}</div>
        <div class="day-timeline" style="height: ${timelineHeight}px;">
            <div class="timeline-padding"></div>
            <div class="timeline-content">
                ${columnsHtml}
                ${shiftBarsHtml}
            </div>
            <div class="timeline-padding"></div>
        </div>
    `;
},
    
    /**
     * Generate hours section HTML (shared for all days at bottom)
     * @param {Object} bounds - Timeline bounds
     * @returns {string} - HTML for hours section
     */
    generateHoursSection(bounds) {
        let html = '<div class="hours-section">';
        
        // Use the configured color for hours section
        const colorClass = `color-${this.config.color}`;
        html = `<div class="hours-section ${colorClass}">`;
        
       // Left padding - check if first hour is night hour
const leftPaddingClass = this.isNightHour(bounds.start) ? 'hours-padding night-hours' : 'hours-padding';
html += `<div class="${leftPaddingClass}"></div>`;

// Hours content
html += `<div class="hours-content">`;

// Generate hour sections with night hour detection
for (let hour = bounds.start; hour < bounds.end; hour++) {
    const hourDisplay = this.formatHour(hour);
    const nightClass = this.isNightHour(hour) ? 'hour-section night-hours' : 'hour-section';
    html += `
        <div class="${nightClass}">
            <div class="hour-number">${hourDisplay}</div>
        </div>
    `;
}

// Add end hour marker
const endHourDisplay = this.formatHour(bounds.end);
const endNightClass = this.isNightHour(bounds.end) ? 'hour-section night-hours' : 'hour-section';
html += `
    <div class="${endNightClass}">
        <div class="hour-number">${endHourDisplay}</div>
    </div>
`;

html += `</div>`;

// Right padding - check if last hour is night hour
const rightPaddingClass = this.isNightHour(bounds.end) ? 'hours-padding night-hours' : 'hours-padding';
html += `<div class="${rightPaddingClass}"></div>`;
        
        html += '</div>';
        
        return html;
    },
    
    // === MAIN RENDERING FUNCTION ===
    
    /**
     * Render the complete quick schedule
     * @param {Array} jobs - Array of job objects
     * @returns {string} - Complete HTML for the schedule
     */
    renderQuickScheduleGrid(jobs) {
        if (!jobs || jobs.length === 0) {
            return this.renderEmptyState();
        }
        
        // Get all shifts for configured number of days
        const allShifts = this.getAllWeekShifts(jobs);
        
        // Calculate timeline bounds from all shifts
        const bounds = this.calculateTimelineBounds(allShifts);
        
        // Generate HTML
        let html = '<div class="schedule-card">';
        
        // Generate day rows (using configured daysToShow)
        for (let day = 0; day < this.config.daysToShow; day++) {
            html += this.generateDayRow(day, allShifts[day], bounds, jobs);
        }
        
        // Add hours section at bottom
        html += this.generateHoursSection(bounds);
        
        html += '</div>';
        
        return html;
    },
    
    /**
     * Render empty state when no jobs exist
     * @returns {string} - HTML for empty state
     */
    renderEmptyState() {
        const colorClass = `color-${this.config.color}`;
        
        return `
            <div class="schedule-card">
                <div class="day-header ${colorClass}">TODAY</div>
                <div class="day-timeline">
                    <div class="timeline-padding"></div>
                    <div class="timeline-content day-off">
                        <div class="day-off-message">NO JOBS FOUND</div>
                    </div>
                    <div class="timeline-padding"></div>
                </div>
            </div>
        `;
    },
    
    // === DOM UPDATE FUNCTIONS ===
    
    /**
     * Update the quick schedule display in the DOM
     * @param {Array} jobs - Array of job objects
     */
    updateQuickScheduleDisplay(jobs) {
        const quickScheduleSection = document.getElementById('quickScheduleSection');
        if (quickScheduleSection) {
            quickScheduleSection.innerHTML = this.renderQuickScheduleGrid(jobs);
        }
    },
    
    /**
     * Initialize the quick schedule system
     * @param {Array} jobs - Array of job objects
     */
    initialize(jobs) {
        console.log('🚀 Initializing Quick Schedule Grid...');
        
        // Add CSS if not already present
        this.injectGridStyles();
        
        // Initial render
        this.updateQuickScheduleDisplay(jobs);
        
        console.log('✅ Quick Schedule Grid initialized');
    },
    
    /**
     * Inject necessary CSS styles for the grid
     */
    injectGridStyles() {
        // Check if styles already exist
        if (document.getElementById('quick-schedule-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'quick-schedule-styles';
        style.textContent = `
            /* Quick Schedule Grid - Vertical Layout */
            .schedule-card {
                background: var(--bg2);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                margin-bottom: var(--gap);
                overflow: hidden;
            }

            /* Day Header Section */
            .day-header {
                height: 15px;
                background: var(--job-color-purple);
                border-bottom: var(--b) solid var(--border);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 700;
                color: var(--text1);
                text-transform: uppercase;
                letter-spacing: 0.2px;
                flex-shrink: 0;
            }

            .day-header.current {
                background: var(--job-color-green);
                color: var(--text1);
            }

            /* Color variations for day headers */
            .day-header.color-blue { background: var(--job-color-blue); }
            .day-header.color-green { background: var(--job-color-green); }
            .day-header.color-purple { background: var(--job-color-purple); }
            .day-header.color-red { background: var(--job-color-red); }
            .day-header.color-orange { background: var(--job-color-orange); }
            .day-header.color-teal { background: var(--job-color-teal); }
            .day-header.color-gold { background: var(--job-color-gold); }
            .day-header.color-brown { background: var(--job-color-brown); }

            /* Timeline Section */
            .day-timeline {
                height: 24px;
                position: relative;
                display: flex;
                overflow: hidden;
                border-bottom: var(--b) solid var(--border);
            }

            .day-timeline:last-of-type {
                border-bottom: none;
            }

            .timeline-padding {
                width: 10px;
                flex-shrink: 0;
                background: var(--bg4);
            }

            .timeline-content {
                flex: 1;
                background: var(--bg4);
                display: flex;
                position: relative;
            }

            .timeline-column {
                flex: 1;
                border-right: 1px solid var(--lines);
            }

            .timeline-column:first-child {
                border-left: 1px solid var(--lines);
            }

            /* Day Off State */
            .timeline-content.day-off {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .day-off-message {
                color: var(--text1);
                font-weight: 700;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                text-align: center;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }

            /* Shift Bars */
            .shift-bar {
    position: absolute;
    height: 22px;
    border-radius: 7px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--text2);
    background: var(--white);
    border: 3px solid var(--border);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 2px;
    box-sizing: border-box;
    text-transform: uppercase;
    letter-spacing: 0.2px;
}

           /* Shift bar colors - 3px colored borders */
.shift-bar.shift-blue { border: 3px solid var(--job-color-blue); }
.shift-bar.shift-green { border: 3px solid var(--job-color-green); }
.shift-bar.shift-purple { border: 3px solid var(--job-color-purple); }
.shift-bar.shift-red { border: 3px solid var(--job-color-red); }
.shift-bar.shift-orange { border: 3px solid var(--job-color-orange); }
.shift-bar.shift-teal { border: 3px solid var(--job-color-teal); }
.shift-bar.shift-gold { border: 3px solid var(--job-color-gold); }
.shift-bar.shift-brown { border: 3px solid var(--job-color-brown); }

            /* Hours Section - Bottom */
            .hours-section {
                height: 12px;
                background: var(--job-color-purple);
                display: flex;
                overflow: hidden;
                flex-shrink: 0;
            }

            /* Color variations for hours section */
            .hours-section.color-blue { background: var(--job-color-blue); }
            .hours-section.color-green { background: var(--job-color-green); }
            .hours-section.color-purple { background: var(--job-color-purple); }
            .hours-section.color-red { background: var(--job-color-red); }
            .hours-section.color-orange { background: var(--job-color-orange); }
            .hours-section.color-teal { background: var(--job-color-teal); }
            .hours-section.color-gold { background: var(--job-color-gold); }
            .hours-section.color-brown { background: var(--job-color-brown); }

            .hours-padding {
                width: 10px;
                flex-shrink: 0;
            }

            .hours-content {
                flex: 1;
                display: flex;
            }

            .hour-section {
                flex: 1;
                position: relative;
                display: flex;
                align-items: center;
            }

            .hour-section:last-child {
                flex: 0 0 1px;
            }

            .hour-number {
    position: absolute;
    left: 0;
    transform: translateX(-50%);
    font-size: 6px;
    font-weight: 900;
    color: var(--text1);
    position: relative;
    z-index: 1;
}

/* Night hours (6pm to 6am) - tone shifted darker background only */
.hour-section.night-hours::before,
.hours-padding.night-hours::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    pointer-events: none;
}

.hour-section.night-hours,
.hours-padding.night-hours {
    position: relative;
}

            /* Responsive adjustments for smaller screens */
            @media (max-width: 600px) {
                .day-off-message {
                    font-size: 11px;
                    letter-spacing: 0.2px;
                }
                
               
            }
        `;
        
        document.head.appendChild(style);
    }
};

// === INTEGRATION FUNCTIONS ===

/**
 * Function to be called from main app to render quick schedule
 * @param {Array} jobs - Array of job objects
 */
function renderQuickSchedule(jobs) {
    return QuickScheduleGrid.renderQuickScheduleGrid(jobs);
}

/**
 * Function to update quick schedule when data changes
 * @param {Array} jobs - Array of job objects
 */
function updateQuickScheduleOnChange(jobs) {
    console.log('📊 Updating quick schedule display...');
    QuickScheduleGrid.updateQuickScheduleDisplay(jobs);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickScheduleGrid;
}