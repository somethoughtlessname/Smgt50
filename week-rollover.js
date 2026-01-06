// === WEEK ROLLOVER SYSTEM ===
// Manages three-week sliding window with automatic rollover detection and data preservation
// Archives weeks to historical totals when they leave the 3-week window

const WeekRolloverSystem = {
    // === CONFIGURATION ===
    config: {
        weekStartDay: 1,           // 0=Sunday, 1=Monday, 2=Tuesday, etc.
        retentionWeeks: 12,        // How many weeks to keep DETAILED shift data (deprecated - only for old archive system)
        checkIntervalMinutes: 30,  // How often to check for rollover
        storageKey: 'weekRolloverState',
        settingsKey: 'scheduleManagerSettings'
    },

    // === SETTINGS MANAGEMENT ===
    /**
     * Get app settings
     * @returns {Object} - Current settings
     */
    getSettings() {
        try {
            const stored = localStorage.getItem(this.config.settingsKey);
            if (stored) {
                const settings = JSON.parse(stored);
                // Update config with saved week start day
                if (typeof settings.weekStartDay === 'number') {
                    this.config.weekStartDay = settings.weekStartDay;
                }
                return settings;
            }
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
        }
        
        return {
            weekStartDay: this.config.weekStartDay,
            version: '1.0'
        };
    },

    /**
     * Save app settings
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.config.settingsKey, JSON.stringify(settings));
            // Update config
            if (typeof settings.weekStartDay === 'number') {
                this.config.weekStartDay = settings.weekStartDay;
            }
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
        }
    },

    /**
     * Change week start day and migrate existing data
     * @param {number} newWeekStartDay - New week start day (0=Sunday, 1=Monday, etc.)
     * @param {Array} jobs - Jobs array to migrate
     * @returns {Array} - Migrated jobs array
     */
    changeWeekStartDay(newWeekStartDay, jobs) {
        const oldWeekStartDay = this.config.weekStartDay;
        
        if (oldWeekStartDay === newWeekStartDay) {
            return jobs; // No change needed
        }
        
        console.log(`🔄 Changing week start day from ${this.getDayName(oldWeekStartDay)} to ${this.getDayName(newWeekStartDay)}`);
        
        // Update config temporarily for new calculations
        const originalWeekStartDay = this.config.weekStartDay;
        this.config.weekStartDay = newWeekStartDay;
        
        try {
            // Migrate all jobs
            const migratedJobs = jobs.map(job => this.migrateJobWeekStartDay(job, originalWeekStartDay, newWeekStartDay));
            
            // Save new setting
            const settings = this.getSettings();
            settings.weekStartDay = newWeekStartDay;
            this.saveSettings(settings);
            
            // CRITICAL FIX: Get fresh state AFTER archiving to avoid overwriting historical totals
    const freshState = this.getRolloverState();
    freshState.lastKnownCurrentWeek = currentWeekKey;
    freshState.lastCheckTime = Date.now();
    this.saveRolloverState(freshState);
            
            console.log('✅ Week start day changed successfully');
            return migratedJobs;
            
        } catch (error) {
            // Rollback on error
            this.config.weekStartDay = originalWeekStartDay;
            console.error('❌ Failed to change week start day:', error);
            throw error;
        }
    },

    /**
     * Migrate a single job's data for new week start day
     * @param {Object} job - Job to migrate
     * @param {number} oldWeekStartDay - Previous week start day
     * @param {number} newWeekStartDay - New week start day
     * @returns {Object} - Migrated job
     */
    migrateJobWeekStartDay(job, oldWeekStartDay, newWeekStartDay) {
        const migratedJob = { ...job };
        
        // Migrate scheduled shifts
        if (job.weeklyScheduledShifts) {
            migratedJob.weeklyScheduledShifts = this.migrateWeeklyShifts(
                job.weeklyScheduledShifts, 
                oldWeekStartDay, 
                newWeekStartDay
            );
        }
        
        // Migrate worked shifts
        if (job.weeklyWorkedShifts) {
            migratedJob.weeklyWorkedShifts = this.migrateWeeklyShifts(
                job.weeklyWorkedShifts, 
                oldWeekStartDay, 
                newWeekStartDay
            );
        }
        
        return migratedJob;
    },

    /**
     * Migrate weekly shifts data structure for new week start day
     * @param {Object} weeklyShifts - Weekly shifts data
     * @param {number} oldWeekStartDay - Previous week start day
     * @param {number} newWeekStartDay - New week start day
     * @returns {Object} - Migrated weekly shifts
     */
    migrateWeeklyShifts(weeklyShifts, oldWeekStartDay, newWeekStartDay) {
        const migratedShifts = {};
        
        // For each week in the data
        for (const [oldWeekKey, weekData] of Object.entries(weeklyShifts)) {
            // Convert old week key to actual date
            const oldWeekStart = new Date(oldWeekKey + 'T00:00:00');
            
            // For each day in that week
            for (const [dayIndex, shiftData] of Object.entries(weekData)) {
                if (!shiftData || typeof shiftData !== 'object') continue;
                
                // Calculate the actual calendar date for this shift
                const dayOffset = parseInt(dayIndex);
                const actualDate = new Date(oldWeekStart);
                actualDate.setDate(actualDate.getDate() + dayOffset);
                
                // Calculate which week this date belongs to under the new week start day
                const newWeekKey = this.getWeekKeyForDate(actualDate, newWeekStartDay);
                const newDayIndex = this.getDayIndexInWeek(actualDate, newWeekStartDay);
                
                // Create the new week if it doesn't exist
                if (!migratedShifts[newWeekKey]) {
                    migratedShifts[newWeekKey] = {};
                }
                
                // Move the shift to its new position
                migratedShifts[newWeekKey][newDayIndex] = { ...shiftData };
            }
        }
        
        return migratedShifts;
    },

    /**
     * Get week key for a specific date with custom week start day
     * @param {Date} date - Date to get week key for
     * @param {number} weekStartDay - Week start day override
     * @returns {string} - Week key
     */
    getWeekKeyForDate(date, weekStartDay = null) {
        const startDay = weekStartDay !== null ? weekStartDay : this.config.weekStartDay;
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        const daysFromStart = (dayOfWeek - startDay + 7) % 7;
        
        d.setDate(d.getDate() - daysFromStart);
        d.setHours(0, 0, 0, 0);
        
        return d.toISOString().split('T')[0];
    },

    /**
     * Get day index within a week for a specific date
     * @param {Date} date - Date to get day index for
     * @param {number} weekStartDay - Week start day override
     * @returns {number} - Day index (0-6)
     */
    getDayIndexInWeek(date, weekStartDay = null) {
        const startDay = weekStartDay !== null ? weekStartDay : this.config.weekStartDay;
        const dayOfWeek = date.getDay();
        return (dayOfWeek - startDay + 7) % 7;
    },

    /**
     * Get day name from day number
     * @param {number} dayNumber - Day number (0=Sunday, 1=Monday, etc.)
     * @returns {string} - Day name
     */
    getDayName(dayNumber) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNumber] || 'Unknown';
    },

    // === WEEK IDENTIFICATION ===
    /**
     * Calculate week start date for any given date
     * @param {Date} date - Input date
     * @returns {Date} - Start of week (normalized to midnight)
     */
    getWeekStart(date = new Date()) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        const daysFromStart = (dayOfWeek - this.config.weekStartDay + 7) % 7;
        
        d.setDate(d.getDate() - daysFromStart);
        d.setHours(0, 0, 0, 0); // Normalize to midnight
        
        return d;
    },

    /**
     * Generate unique week key for any date
     * @param {Date} date - Input date
     * @returns {string} - Week key in YYYY-MM-DD format
     */
    getWeekKey(date = new Date()) {
        const weekStart = this.getWeekStart(date);
        return weekStart.toISOString().split('T')[0];
    },

    /**
     * Get week keys for the three-week window
     * @param {Date} referenceDate - Reference date (usually current date)
     * @returns {Object} - Keys for previous, current, and next weeks
     */
    getThreeWeekKeys(referenceDate = new Date()) {
        const currentWeekStart = this.getWeekStart(referenceDate);
        
        const previousWeek = new Date(currentWeekStart);
        previousWeek.setDate(previousWeek.getDate() - 7);
        
        const nextWeek = new Date(currentWeekStart);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        return {
            previous: this.getWeekKey(previousWeek),
            current: this.getWeekKey(currentWeekStart),
            next: this.getWeekKey(nextWeek)
        };
    },

    /**
     * Get date offset from week key
     * @param {string} weekKey - Week key in YYYY-MM-DD format
     * @param {number} dayOffset - Day offset from week start (0-6)
     * @returns {Date} - Actual date for that day
     */
    getDateFromWeekKey(weekKey, dayOffset = 0) {
        const weekStart = new Date(weekKey + 'T00:00:00');
        weekStart.setDate(weekStart.getDate() + dayOffset);
        return weekStart;
    },

    // === ROLLOVER STATE MANAGEMENT ===
    /**
     * Get stored rollover state
     * @returns {Object} - Current rollover state
     */
    getRolloverState() {
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('❌ Failed to load rollover state:', error);
        }
        
        // Default state
        return {
            lastKnownCurrentWeek: this.getWeekKey(),
            lastCheckTime: Date.now(),
            weekPosition: 'current', // which week tab is currently active
            historicalArchive: {},
            historicalWeekTotals: {} // NEW: { weekKey: { jobId: totalHours } }
        };
    },

    /**
     * Save rollover state
     * @param {Object} state - State to save
     */
    saveRolloverState(state) {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(state));
        } catch (error) {
            console.error('❌ Failed to save rollover state:', error);
        }
    },

    // === HISTORICAL TOTALS MANAGEMENT ===
    // Historical week totals are stored INDEFINITELY in localStorage
    // Organized by year for better long-term management
    // Format: { "2024": { weekKey: { jobId: totalHours } }, "2025": { ... } }
    // Since they're just simple numbers, storage is minimal even after years
    
    /**
     * Get year from week key
     * @param {string} weekKey - Week key (YYYY-MM-DD)
     * @returns {string} - Year (YYYY)
     */
    getYearFromWeekKey(weekKey) {
        return weekKey.split('-')[0];
    },
    
    /**
     * Get historical total for a specific week and job
     * @param {string} weekKey - Week key
     * @param {string} jobId - Job ID
     * @returns {number} - Total hours or 0
     */
    getHistoricalWeekTotal(weekKey, jobId) {
        const state = this.getRolloverState();
        if (!state.historicalWeekTotals) return 0;
        
        const year = this.getYearFromWeekKey(weekKey);
        if (state.historicalWeekTotals[year] && 
            state.historicalWeekTotals[year][weekKey]) {
            return state.historicalWeekTotals[year][weekKey][jobId] || 0;
        }
        return 0;
    },

    /**
     * Save historical total for a week and job
     * @param {string} weekKey - Week key
     * @param {string} jobId - Job ID
     * @param {number} totalHours - Total hours
     */
    saveHistoricalWeekTotal(weekKey, jobId, totalHours) {
        const state = this.getRolloverState();
        if (!state.historicalWeekTotals) {
            state.historicalWeekTotals = {};
        }
        
        const year = this.getYearFromWeekKey(weekKey);
        
        // Create year if it doesn't exist
        if (!state.historicalWeekTotals[year]) {
            state.historicalWeekTotals[year] = {};
        }
        
        // Create week if it doesn't exist
        if (!state.historicalWeekTotals[year][weekKey]) {
            state.historicalWeekTotals[year][weekKey] = {};
        }
        
        state.historicalWeekTotals[year][weekKey][jobId] = totalHours;
        this.saveRolloverState(state);
    },

    /**
     * Get all historical week keys that have data
     * @returns {Array} - Array of week keys sorted
     */
    getHistoricalWeekKeys() {
        const state = this.getRolloverState();
        if (!state.historicalWeekTotals) return [];
        
        const allWeekKeys = [];
        
        // Iterate through all years
        for (const year in state.historicalWeekTotals) {
            // Get all week keys for this year
            const yearWeeks = Object.keys(state.historicalWeekTotals[year]);
            allWeekKeys.push(...yearWeeks);
        }
        
        return allWeekKeys.sort();
    },
    
    /**
     * Get all years that have historical data
     * @returns {Array} - Array of years sorted
     */
    getHistoricalYears() {
        const state = this.getRolloverState();
        if (!state.historicalWeekTotals) return [];
        
        return Object.keys(state.historicalWeekTotals).sort();
    },

    // === ROLLOVER DETECTION ===
    /**
     * Check if a week rollover has occurred
     * @returns {boolean} - True if rollover detected
     */
    detectRollover() {
        const state = this.getRolloverState();
        const currentWeekKey = this.getWeekKey();
        const lastKnownWeek = state.lastKnownCurrentWeek;
        
        console.log(`🔍 Checking rollover: last known=${lastKnownWeek}, current=${currentWeekKey}`);
        
        return currentWeekKey !== lastKnownWeek;
    },

    /**
     * Calculate how many weeks have passed since last check
     * @param {string} lastKnownWeek - Last known week key
     * @param {string} currentWeek - Current week key
     * @returns {number} - Number of weeks elapsed
     */
    calculateWeeksElapsed(lastKnownWeek, currentWeek) {
        const lastDate = new Date(lastKnownWeek + 'T00:00:00');
        const currentDate = new Date(currentWeek + 'T00:00:00');
        const timeDiff = currentDate - lastDate;
        const weeksDiff = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
        
        return Math.max(0, weeksDiff);
    },

    // === DATA MIGRATION ===
    /**
     * Migrate legacy day-based data to week-based structure
     * @param {Object} job - Job object with legacy shift data
     * @returns {Object} - Migrated job with week-based data
     */
    migrateLegacyJobData(job) {
        // Check if already migrated
        if (job.weeklyScheduledShifts || job.weeklyWorkedShifts) {
            return job;
        }

        console.log(`🔄 Migrating legacy data for job: ${job.title}`);
        
        const currentWeekKey = this.getWeekKey();
        const migratedJob = { ...job };
        
        // Initialize week-based structure
        migratedJob.weeklyScheduledShifts = {};
        migratedJob.weeklyWorkedShifts = {};
        
        // Migrate scheduled shifts
        if (job.scheduledShifts && Object.keys(job.scheduledShifts).length > 0) {
            migratedJob.weeklyScheduledShifts[currentWeekKey] = { ...job.scheduledShifts };
        }
        
        // Migrate worked shifts
        if (job.workedShifts && Object.keys(job.workedShifts).length > 0) {
            migratedJob.weeklyWorkedShifts[currentWeekKey] = { ...job.workedShifts };
        }
        
        // Keep legacy data for backward compatibility during transition
        migratedJob.legacyScheduledShifts = job.scheduledShifts || {};
        migratedJob.legacyWorkedShifts = job.workedShifts || {};
        
        return migratedJob;
    },

    /**
     * Get shift data for specific week and type
     * @param {Object} job - Job object
     * @param {string} weekKey - Week key
     * @param {string} shiftType - 'scheduled' or 'worked'
     * @returns {Object} - Shift data for that week
     */
    getWeekShifts(job, weekKey, shiftType = 'scheduled') {
        const propertyName = shiftType === 'scheduled' ? 'weeklyScheduledShifts' : 'weeklyWorkedShifts';
        
        if (!job[propertyName]) {
            job[propertyName] = {};
        }
        
        if (!job[propertyName][weekKey]) {
            job[propertyName][weekKey] = {};
        }
        
        return job[propertyName][weekKey];
    },

    /**
     * Set shift data for specific week and type
     * @param {Object} job - Job object
     * @param {string} weekKey - Week key
     * @param {string} shiftType - 'scheduled' or 'worked'
     * @param {Object} shiftData - Shift data to set
     */
    setWeekShifts(job, weekKey, shiftType, shiftData) {
        const propertyName = shiftType === 'scheduled' ? 'weeklyScheduledShifts' : 'weeklyWorkedShifts';
        
        if (!job[propertyName]) {
            job[propertyName] = {};
        }
        
        job[propertyName][weekKey] = { ...shiftData };
    },

    // === ROLLOVER EXECUTION ===
    /**
     * Execute week rollover process - archives weeks leaving the 3-week window
     * @param {Array} jobs - Array of job objects
     * @returns {Array} - Updated jobs array
     */
    executeRollover(jobs) {
        console.log('🔄 Executing week rollover...');
        
        const state = this.getRolloverState();
        const currentWeekKey = this.getWeekKey();
        const lastKnownWeek = state.lastKnownCurrentWeek;
        const weeksElapsed = this.calculateWeeksElapsed(lastKnownWeek, currentWeekKey);
        
        console.log(`📅 Weeks elapsed: ${weeksElapsed}`);
        
        // Get the current three-week window
        const threeWeekKeys = this.getThreeWeekKeys();
        const threeWeekSet = new Set([threeWeekKeys.previous, threeWeekKeys.current, threeWeekKeys.next]);
        
        // Migrate all jobs and archive weeks outside the window
        const migratedJobs = jobs.map(job => {
            const migratedJob = this.migrateLegacyJobData(job);
            this.archiveWeeksOutsideWindow(migratedJob, threeWeekSet, state);
            return migratedJob;
        });
        
        // NOTE: Historical totals are kept indefinitely (no cleanup)
        // They're just simple numbers (weekKey -> hours) so storage is minimal
        
        // Update rollover state
        state.lastKnownCurrentWeek = currentWeekKey;
        state.lastCheckTime = Date.now();
        this.saveRolloverState(state);
        
        console.log('✅ Week rollover completed');
        
        return migratedJobs;
    },

    /**
     * Archive weeks that are outside the three-week window
     * @param {Object} job - Job object
     * @param {Set} threeWeekSet - Set of week keys in the three-week window
     * @param {Object} state - Rollover state
     */
    archiveWeeksOutsideWindow(job, threeWeekSet, state) {
    // Archive worked shifts - calculate and save totals
    if (job.weeklyWorkedShifts) {
        for (const weekKey in job.weeklyWorkedShifts) {
            // If week is NOT in the three-week window, archive it
            if (!threeWeekSet.has(weekKey)) {
                // CRITICAL FIX: Check if week is already archived - DON'T RECALCULATE OR OVERWRITE
                const existingTotal = this.getHistoricalWeekTotal(weekKey, job.id);
                
                if (existingTotal > 0) {
                    console.log(`✓ Week ${weekKey} for job ${job.title} already archived with ${existingTotal.toFixed(2)} hours - preserving existing data`);
                    // Still clean up the detailed shift data if it exists
                    delete job.weeklyWorkedShifts[weekKey];
                    continue; // Skip to next week - don't recalculate
                }
                
                // Only calculate and archive if NOT already in historical totals
                let totalMinutes = 0;
                const weekShifts = job.weeklyWorkedShifts[weekKey];
                
                for (let day = 0; day <= 6; day++) {
                    const dayShift = weekShifts[day];
                    if (dayShift && dayShift.total && dayShift.total !== '00.00') {
                        const hours = parseFloat(dayShift.total);
                        if (!isNaN(hours)) {
                            totalMinutes += Math.round(hours * 60);
                        }
                    }
                }
                
                const totalHours = totalMinutes / 60;
                
                // Save to historical totals if there are hours
                if (totalHours > 0) {
                    console.log(`📦 Archiving ${weekKey} for job ${job.title}: ${totalHours.toFixed(2)} hours (NEW)`);
                    this.saveHistoricalWeekTotal(weekKey, job.id, totalHours);
                } else {
                    console.log(`⚠️ Week ${weekKey} for job ${job.title} has 0 hours - not archiving`);
                }
                
                // Delete the detailed shift data
                delete job.weeklyWorkedShifts[weekKey];
            }
        }
    }
        
        // Archive scheduled shifts (just remove, we only track worked totals)
        if (job.weeklyScheduledShifts) {
            for (const weekKey in job.weeklyScheduledShifts) {
                if (!threeWeekSet.has(weekKey)) {
                    delete job.weeklyScheduledShifts[weekKey];
                }
            }
        }
    },

    // === WEEK NAVIGATION ===
    /**
     * Get current week position (which tab is active)
     * @returns {string} - 'previous', 'current', or 'next'
     */
    getCurrentWeekPosition() {
        const state = this.getRolloverState();
        return state.weekPosition || 'current';
    },

    /**
     * Set current week position
     * @param {string} position - 'previous', 'current', or 'next'
     */
    setCurrentWeekPosition(position) {
        const state = this.getRolloverState();
        state.weekPosition = position;
        this.saveRolloverState(state);
    },

    /**
     * Get week key for current position
     * @returns {string} - Week key for active tab
     */
    getActiveWeekKey() {
        const position = this.getCurrentWeekPosition();
        const keys = this.getThreeWeekKeys();
        return keys[position];
    },

    // === INTEGRATION HELPERS ===
    /**
     * Get shift data for currently active week and tab
     * @param {Object} job - Job object
     * @param {string} shiftType - 'scheduled' or 'worked'
     * @returns {Object} - Shift data for active week
     */
    getActiveWeekShifts(job, shiftType) {
        const weekKey = this.getActiveWeekKey();
        return this.getWeekShifts(job, weekKey, shiftType);
    },

    /**
     * Set shift data for currently active week and tab
     * @param {Object} job - Job object
     * @param {string} shiftType - 'scheduled' or 'worked'
     * @param {Object} shiftData - Shift data to set
     */
    setActiveWeekShifts(job, shiftType, shiftData) {
        const weekKey = this.getActiveWeekKey();
        this.setWeekShifts(job, weekKey, shiftType, shiftData);
    },

    /**
     * Initialize week rollover system
     * @param {Array} jobs - Array of job objects
     * @returns {Array} - Processed jobs array
     */
    initialize(jobs) {
        console.log('🚀 Initializing Week Rollover System...');
        
        // Load settings first
        this.getSettings();
        
        // Check for rollover
        if (this.detectRollover()) {
            jobs = this.executeRollover(jobs);
        } else {
            // Still migrate any legacy data
            jobs = jobs.map(job => this.migrateLegacyJobData(job));
        }
        
        // Set up periodic checks
        this.startPeriodicChecks(jobs);
        
        console.log('✅ Week Rollover System initialized');
        
        return jobs;
    },

    /**
     * Start periodic rollover checks
     * @param {Array} jobs - Jobs array reference
     */
    startPeriodicChecks(jobs) {
        const checkInterval = this.config.checkIntervalMinutes * 60 * 1000;
        
        setInterval(() => {
            if (this.detectRollover()) {
                console.log('⏰ Periodic rollover check triggered');
                const updatedJobs = this.executeRollover(jobs);
                
                // Only trigger app refresh if we're on the main window
                const mainWindow = document.getElementById('mainWindow');
                if (mainWindow && mainWindow.classList.contains('active')) {
                    if (typeof renderJobs === 'function') {
                        renderJobs(); // This will update jobs, history, and quick schedule
                    }
                    
                    // Also update systems directly in case renderJobs doesn't cover them
                    if (typeof updateHistoryDisplay === 'function') {
                        updateHistoryDisplay();
                    }
                    
                    if (typeof updateQuickScheduleDisplay === 'function') {
                        updateQuickScheduleDisplay();
                    }
                }
                
                // Update jobs array reference
                jobs.splice(0, jobs.length, ...updatedJobs);
                
                // Save updated data
                if (typeof saveData === 'function') {
                    saveData();
                }
            }
        }, checkInterval);
    },

    // === UTILITY FUNCTIONS ===
    /**
     * Get human-readable week label
     * @param {string} weekKey - Week key
     * @returns {string} - Human-readable label
     */
    getWeekLabel(weekKey) {
        const weekStart = new Date(weekKey + 'T00:00:00');
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const options = { month: 'short', day: 'numeric' };
        const startStr = weekStart.toLocaleDateString(undefined, options);
        const endStr = weekEnd.toLocaleDateString(undefined, options);
        
        return `${startStr} - ${endStr}`;
    },

    /**
     * Check if a date is in the current week
     * @param {Date} date - Date to check
     * @returns {boolean} - True if in current week
     */
    isCurrentWeek(date) {
        const currentWeekKey = this.getWeekKey();
        const dateWeekKey = this.getWeekKey(date);
        return currentWeekKey === dateWeekKey;
    },

    /**
     * Get all week keys that have data for a job
     * @param {Object} job - Job object
     * @param {string} shiftType - 'scheduled' or 'worked'
     * @returns {Array} - Array of week keys with data
     */
    getWeeksWithData(job, shiftType = 'scheduled') {
        const propertyName = shiftType === 'scheduled' ? 'weeklyScheduledShifts' : 'weeklyWorkedShifts';
        
        if (!job[propertyName]) {
            return [];
        }
        
        return Object.keys(job[propertyName])
            .filter(weekKey => {
                const weekData = job[propertyName][weekKey];
                return weekData && Object.keys(weekData).length > 0;
            })
            .sort();
    },

    /**
     * Debug function to log current state
     */
    debugState() {
        console.log('=== WEEK ROLLOVER DEBUG ===');
        console.log('Config:', this.config);
        console.log('Current Week Key:', this.getWeekKey());
        console.log('Three Week Keys:', this.getThreeWeekKeys());
        console.log('Rollover State:', this.getRolloverState());
        console.log('Active Week Position:', this.getCurrentWeekPosition());
        console.log('Active Week Key:', this.getActiveWeekKey());
        console.log('Historical Week Keys:', this.getHistoricalWeekKeys());
        console.log('=========================');
    }
};

// === INTEGRATION WITH EXISTING APP ===
// These functions bridge the week rollover system with the existing app structure

/**
 * Enhanced function to get shift data with week awareness
 * @param {Object} job - Job object
 * @param {string} shiftType - 'scheduled' or 'worked'
 * @returns {Object} - Shift data for current active week
 */
function getShiftsForActiveWeek(job, shiftType) {
    return WeekRolloverSystem.getActiveWeekShifts(job, shiftType);
}

/**
 * Enhanced function to set shift data with week awareness
 * @param {Object} job - Job object
 * @param {string} shiftType - 'scheduled' or 'worked'
 * @param {Object} shiftData - Shift data to set
 */
function setShiftsForActiveWeek(job, shiftType, shiftData) {
    WeekRolloverSystem.setActiveWeekShifts(job, shiftType, shiftData);
}

/**
 * Update week tabs UI to show active week
 * @param {string} activePosition - 'previous', 'current', or 'next'
 */
function updateWeekTabsUI(activePosition) {
    const tabs = document.querySelectorAll('.job-tabs .tab');
    tabs.forEach((tab, index) => {
        tab.classList.remove('active');
        const positions = ['previous', 'current', 'next'];
        if (positions[index] === activePosition) {
            tab.classList.add('active');
        }
    });
    
    // Update tab labels with actual dates
    const weekKeys = WeekRolloverSystem.getThreeWeekKeys();
    if (tabs.length >= 3) {
        tabs[0].textContent = `Previous Week`;
        tabs[1].textContent = `This Week`;
        tabs[2].textContent = `Next Week`;
    }
}

/**
 * Function to update history when week rollover occurs
 * @param {Array} jobs - Array of job objects
 */
function updateHistoryOnRollover(jobs) {
    console.log('📊 Updating history display after week rollover...');
    if (typeof HistorySystem !== 'undefined' && HistorySystem.updateHistoryDisplay) {
        HistorySystem.updateHistoryDisplay(jobs);
    }
}

/**
 * Function to update quick schedule when week rollover occurs
 * @param {Array} jobs - Array of job objects
 */
function updateQuickScheduleOnRollover(jobs) {
    console.log('📅 Updating quick schedule display after week rollover...');
    if (typeof QuickScheduleGrid !== 'undefined' && QuickScheduleGrid.updateQuickScheduleDisplay) {
        QuickScheduleGrid.updateQuickScheduleDisplay(jobs);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeekRolloverSystem;
}