// === WORK HISTORY SYSTEM WITH TIMELINE VIEW ===
// Manages career timeline with both list and visual timeline views
// Integrates with Schedule Manager app

const WorkHistorySystem = {
    
    // === CONFIGURATION ===
    config: {
        storageKey: 'workHistoryData',
        version: '2.1',
        longPressDelay: 500,
        timelineYearPadding: 1 // Years to add above/below for visual spacing
    },
    
    // === STATE ===
    state: {
        workHistory: [],
        currentEditingId: null,
        selectedColor: 'blue',
        expandedCards: new Set(),
        currentView: 'list', // 'list' or 'timeline'
        activeTimelineJob: null, // Which job is showing positions in timeline
        monthPickerState: {
            targetInputId: null,
            targetPositionId: null,
            selectedMonth: null,
            headerText: ''
        },
        modalPositions: [],
        modalPositionIdCounter: 0,
        longPressTimer: null,
        longPressTriggered: false,
        pressStartX: 0,
        pressStartY: 0,
        hasScrolled: false
    },
    
    // === CONSTANTS ===
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    
    // === DATA PERSISTENCE ===
    
    saveData() {
        try {
            const dataToSave = {
                workHistory: this.state.workHistory,
                lastUpdated: Date.now(),
                version: this.config.version
            };
            localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
            console.log('✅ Work history saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save work history:', error);
        }
    },
    
    loadData() {
        try {
            const savedData = localStorage.getItem(this.config.storageKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.workHistory && Array.isArray(parsedData.workHistory)) {
                    this.state.workHistory = parsedData.workHistory;
                    this.migrateOldFormat();
                    console.log('✅ Loaded work history from localStorage:', this.state.workHistory.length, 'entries');
                    return true;
                }
            }
            console.log('ℹ️ No saved work history found');
            return false;
        } catch (error) {
            console.error('❌ Failed to load work history:', error);
            return false;
        }
    },
    
    migrateOldFormat() {
        let migrated = false;
        this.state.workHistory = this.state.workHistory.map(entry => {
            if (!entry.positions && entry.startMonth) {
                migrated = true;
                return {
                    id: entry.id,
                    companyName: entry.companyName,
                    color: entry.color || 'blue',
                    positions: [{
                        id: 0,
                        title: 'Position',
                        startMonth: entry.startMonth,
                        startDay: entry.startDay,
                        startYear: entry.startYear,
                        endMonth: entry.endMonth,
                        endDay: entry.endDay,
                        endYear: entry.endYear,
                        isCurrent: entry.isCurrent
                    }]
                };
            }
            return entry;
        });
        
        if (migrated) {
            console.log('🔄 Migrated old work history format to multi-position format');
            this.saveData();
        }
    },
    
    // === DURATION CALCULATION ===
    
    calculateDuration(startMonth, startYear, startDay, endMonth, endYear, endDay, isCurrent) {
        const actualStartDay = startDay || 1;
        const startDate = new Date(startYear, startMonth - 1, actualStartDay);
        
        let endDate;
        if (isCurrent) {
            endDate = new Date();
        } else {
            const actualEndDay = endDay || 1;
            endDate = new Date(endYear, endMonth - 1, actualEndDay);
        }
        
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();
        
        if (days < 0) {
            months--;
            const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
            days += prevMonth.getDate();
        }
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        const shouldRound = !isCurrent && (years > 0 || months > 0);
        
        if (shouldRound && days >= 15) {
            months++;
            days = 0;
            
            if (months === 12) {
                years++;
                months = 0;
            }
        }
        
        if (years === 0 && months === 0) {
            return `${days} ${days === 1 ? 'day' : 'days'}`;
        }
        
        let duration = '';
        if (years > 0) {
            duration += `${years} ${years === 1 ? 'year' : 'years'}`;
        }
        if (months > 0) {
            if (duration) duration += ', ';
            duration += `${months} ${months === 1 ? 'month' : 'months'}`;
        }
        if (days > 0 && (isCurrent || !shouldRound)) {
            if (duration) duration += ', ';
            duration += `${days} ${days === 1 ? 'day' : 'days'}`;
        }
        
        return duration || '0 days';
    },
    
    calculateTotalCompanyDuration(positions) {
    if (!positions || positions.length === 0) return '0 days';
    
    // Calculate duration for each position and sum them up
    let totalYears = 0;
    let totalMonths = 0;
    let totalDays = 0;
    
    positions.forEach(position => {
        const actualStartDay = position.startDay || 1;
        const startDate = new Date(position.startYear, position.startMonth - 1, actualStartDay);
        
        let endDate;
        if (position.isCurrent) {
            endDate = new Date();
        } else {
            const actualEndDay = position.endDay || 1;
            endDate = new Date(position.endYear, position.endMonth - 1, actualEndDay);
        }
        
        // Calculate years, months, days for this position
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();
        
        if (days < 0) {
            months--;
            const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
            days += prevMonth.getDate();
        }
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        // Add to totals
        totalYears += years;
        totalMonths += months;
        totalDays += days;
    });
    
    // Normalize the totals (carry over days to months, months to years)
    if (totalDays >= 30) {
        totalMonths += Math.floor(totalDays / 30);
        totalDays = totalDays % 30;
    }
    
    if (totalMonths >= 12) {
        totalYears += Math.floor(totalMonths / 12);
        totalMonths = totalMonths % 12;
    }
    
    // Check if any position is current
    const hasCurrent = positions.some(p => p.isCurrent);
    const shouldRound = !hasCurrent && (totalYears > 0 || totalMonths > 0);
    
    // Round up if needed
    if (shouldRound && totalDays >= 15) {
        totalMonths++;
        totalDays = 0;
        
        if (totalMonths === 12) {
            totalYears++;
            totalMonths = 0;
        }
    }
    
    // Format output
    if (totalYears === 0 && totalMonths === 0) {
        return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
    }
    
    let duration = '';
    if (totalYears > 0) {
        duration += `${totalYears} ${totalYears === 1 ? 'year' : 'years'}`;
    }
    if (totalMonths > 0) {
        if (duration) duration += ', ';
        duration += `${totalMonths} ${totalMonths === 1 ? 'month' : 'months'}`;
    }
    if (totalDays > 0 && (hasCurrent || !shouldRound)) {
        if (duration) duration += ', ';
        duration += `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
    }
    
    return duration || '0 days';
},
    
    getEarliestStartDate(positions) {
        if (!positions || positions.length === 0) return null;
        
        const sortedPositions = [...positions].sort((a, b) => {
            const aDate = new Date(a.startYear, a.startMonth - 1, a.startDay || 1);
            const bDate = new Date(b.startYear, b.startMonth - 1, b.startDay || 1);
            return aDate - bDate;
        });
        
        const first = sortedPositions[0];
        return {
            month: first.startMonth,
            day: first.startDay,
            year: first.startYear
        };
    },
    
    getLatestEndDate(positions) {
        if (!positions || positions.length === 0) return null;
        
        const currentPosition = positions.find(p => p.isCurrent);
        if (currentPosition) {
            return { isCurrent: true };
        }
        
        const sortedPositions = [...positions].sort((a, b) => {
            const aDate = new Date(a.endYear, a.endMonth - 1, a.endDay || 1);
            const bDate = new Date(b.endYear, b.endMonth - 1, b.endDay || 1);
            return bDate - aDate;
        });
        
        const last = sortedPositions[0];
        return {
            month: last.endMonth,
            day: last.endDay,
            year: last.endYear,
            isCurrent: false
        };
    },
    
    formatDateRange(startMonth, startYear, startDay, endMonth, endYear, endDay, isCurrent) {
        const startMonthName = this.shortMonthNames[startMonth - 1];
        const startStr = startDay ? `${startMonthName} ${startDay}, ${startYear}` : `${startMonthName} ${startYear}`;
        
        if (isCurrent) {
            return `${startStr} - Present`;
        }
        
        const endMonthName = this.shortMonthNames[endMonth - 1];
        const endStr = endDay ? `${endMonthName} ${endDay}, ${endYear}` : `${endMonthName} ${endYear}`;
        
        return `${startStr} - ${endStr}`;
    },
    
    formatCompanyDateRange(positions) {
        const startDate = this.getEarliestStartDate(positions);
        const endDate = this.getLatestEndDate(positions);
        
        if (!startDate || !endDate) return '';
        
        return this.formatDateRange(
            startDate.month,
            startDate.year,
            startDate.day,
            endDate.isCurrent ? null : endDate.month,
            endDate.isCurrent ? null : endDate.year,
            endDate.isCurrent ? null : endDate.day,
            endDate.isCurrent
        );
    },
    
    // === TIMELINE CALCULATIONS ===
    
    /**
     * Get the year range for the timeline
     */
    getTimelineYearRange() {
        if (this.state.workHistory.length === 0) {
            const currentYear = new Date().getFullYear();
            return {
                minYear: currentYear - 5,
                maxYear: currentYear
            };
        }
        
        let minYear = Infinity;
        let maxYear = -Infinity;
        
        this.state.workHistory.forEach(entry => {
            entry.positions.forEach(pos => {
                minYear = Math.min(minYear, pos.startYear);
                
                if (pos.isCurrent) {
                    maxYear = Math.max(maxYear, new Date().getFullYear());
                } else {
                    maxYear = Math.max(maxYear, pos.endYear);
                }
            });
        });
        
        // No padding - show exactly from oldest year to current year
        return { minYear, maxYear };
    },
    
    /**
     * Convert date to percentage position on timeline
     */
    dateToPercentage(month, year, day, yearRange) {
        const date = new Date(year, month - 1, day || 1);
        const startDate = new Date(yearRange.maxYear + 1, 0, 1); // Start of year after maxYear
        const endDate = new Date(yearRange.minYear, 0, 1); // Start of minYear
        
        const totalMs = startDate - endDate;
        const dateMs = startDate - date;
        
        return (dateMs / totalMs) * 100;
    },
    
    /**
     * Get all years for timeline labels
     */
    getTimelineYears() {
        const { minYear, maxYear } = this.getTimelineYearRange();
        const years = [];
        
        for (let year = maxYear; year >= minYear; year--) {
            years.push(year);
        }
        
        return years;
    },
    
    // === VIEW SWITCHING ===
    
    switchView(view) {
        this.state.currentView = view;
        this.state.activeTimelineJob = null; // Reset timeline state
        this.updateDisplay();
    },
    
    toggleTimelineJob(jobId) {
        if (this.state.activeTimelineJob === jobId) {
            this.state.activeTimelineJob = null;
        } else {
            this.state.activeTimelineJob = jobId;
        }
        this.updateDisplay();
    },
    
    // === LONG PRESS HANDLING ===
    
    handlePressStart(id, event) {
        this.state.longPressTriggered = false;
        this.state.hasScrolled = false;
        
        if (event.type === 'touchstart') {
            this.state.pressStartX = event.touches[0].clientX;
            this.state.pressStartY = event.touches[0].clientY;
        } else {
            this.state.pressStartX = event.clientX;
            this.state.pressStartY = event.clientY;
        }
        
        this.state.longPressTimer = setTimeout(() => {
            if (!this.state.hasScrolled) {
                this.state.longPressTriggered = true;
                this.openActionModal(id);
                
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }, this.config.longPressDelay);
    },
    
    handlePressMove(event) {
        let currentX, currentY;
        if (event.type === 'touchmove') {
            currentX = event.touches[0].clientX;
            currentY = event.touches[0].clientY;
        } else {
            currentX = event.clientX;
            currentY = event.clientY;
        }
        
        const deltaX = Math.abs(currentX - this.state.pressStartX);
        const deltaY = Math.abs(currentY - this.state.pressStartY);
        
        if (deltaX > 5 || deltaY > 5) {
            this.state.hasScrolled = true;
            this.handlePressCancel();
        }
    },
    
    handlePressEnd(id, event) {
        if (this.state.longPressTimer) {
            clearTimeout(this.state.longPressTimer);
            this.state.longPressTimer = null;
        }
        
        if (event.type === 'touchend' && event.changedTouches && event.changedTouches.length > 0) {
            const endX = event.changedTouches[0].clientX;
            const endY = event.changedTouches[0].clientY;
            const deltaX = Math.abs(endX - this.state.pressStartX);
            const deltaY = Math.abs(endY - this.state.pressStartY);
            
            if (deltaX > 5 || deltaY > 5) {
                this.state.hasScrolled = true;
            }
        }
        
        if (!this.state.longPressTriggered && !this.state.hasScrolled) {
            event.preventDefault();
            event.stopPropagation();
            
            if (this.state.currentView === 'list') {
                this.toggleDropdown(id);
            } else {
                this.toggleTimelineJob(id);
            }
        }
        
        this.state.longPressTriggered = false;
        this.state.hasScrolled = false;
    },
    
    handlePressCancel() {
        if (this.state.longPressTimer) {
            clearTimeout(this.state.longPressTimer);
            this.state.longPressTimer = null;
        }
        this.state.longPressTriggered = false;
        this.state.hasScrolled = false;
    },
    
    // === RENDERING - LIST VIEW ===
    
    renderListView() {
        if (this.state.workHistory.length === 0) {
            return `
                <div class="empty-state">
                    No work history added yet.<br>
                    Use the "+ Add Work History" button above to track your career timeline.
                </div>
            `;
        }
        
        const sortedHistory = [...this.state.workHistory].sort((a, b) => {
    const aHasCurrent = a.positions.some(p => p.isCurrent);
    const bHasCurrent = b.positions.some(p => p.isCurrent);
    
    // Current jobs come first
    if (aHasCurrent && !bHasCurrent) return -1;
    if (!aHasCurrent && bHasCurrent) return 1;
    
    // Sort by start date (most recent first) for both current and completed jobs
    const aStart = this.getEarliestStartDate(a.positions);
    const bStart = this.getEarliestStartDate(b.positions);
    const aDate = new Date(aStart.year, aStart.month - 1, aStart.day || 1);
    const bDate = new Date(bStart.year, bStart.month - 1, bStart.day || 1);
    return bDate - aDate; // Most recent start date first
});
        
        return sortedHistory.map(entry => {
            const duration = this.calculateTotalCompanyDuration(entry.positions);
            const dateRange = this.formatCompanyDateRange(entry.positions);
            const hasCurrent = entry.positions.some(p => p.isCurrent);
            const currentBadge = hasCurrent ? ' • Current' : '';
            const isExpanded = this.state.expandedCards.has(entry.id);
            
            const positionsList = entry.positions
                .sort((a, b) => {
                    if (a.isCurrent && !b.isCurrent) return -1;
                    if (!a.isCurrent && b.isCurrent) return 1;
                    
                    const aDate = new Date(a.startYear, a.startMonth - 1, a.startDay || 1);
                    const bDate = new Date(b.startYear, b.startMonth - 1, b.startDay || 1);
                    return bDate - aDate;
                })
                .map(position => {
                    const posDuration = this.calculateDuration(
                        position.startMonth,
                        position.startYear,
                        position.startDay,
                        position.endMonth,
                        position.endYear,
                        position.endDay,
                        position.isCurrent
                    );
                    const posDateRange = this.formatDateRange(
                        position.startMonth,
                        position.startYear,
                        position.startDay,
                        position.endMonth,
                        position.endYear,
                        position.endDay,
                        position.isCurrent
                    );
                    const currentLabel = position.isCurrent ? ' • Current' : '';
                    
                    return `
                        <div class="position-item">
                            <div class="position-title">${position.title}${currentLabel}</div>
                            <div class="position-dates">${posDateRange}</div>
                            <div class="position-duration">${posDuration}</div>
                        </div>
                    `;
                }).join('');
            
            const positionsCount = entry.positions.length;
            const positionsLabel = positionsCount === 1 ? '1 position' : `${positionsCount} positions`;
            
            return `
                <div class="work-history-card ${isExpanded ? 'expanded' : ''}" id="wh-card-${entry.id}">
                    <div class="work-history-main" 
                         onmousedown="WorkHistorySystem.handlePressStart(${entry.id}, event)"
                         onmousemove="WorkHistorySystem.handlePressMove(event)"
                         onmouseup="WorkHistorySystem.handlePressEnd(${entry.id}, event)"
                         onmouseleave="WorkHistorySystem.handlePressCancel()"
                         ontouchstart="WorkHistorySystem.handlePressStart(${entry.id}, event)"
                         ontouchmove="WorkHistorySystem.handlePressMove(event)"
                         ontouchend="WorkHistorySystem.handlePressEnd(${entry.id}, event)"
                         ontouchcancel="WorkHistorySystem.handlePressCancel()">
                        <div class="work-history-title-section color-${entry.color}">
                            <div class="work-history-title">${entry.companyName.toUpperCase()}</div>
                        </div>
                        <div class="work-history-info-section">
                            <div class="work-history-duration">${duration}${currentBadge}</div>
                            <div class="work-history-dates">${positionsLabel} • ${dateRange}</div>
                        </div>
                    </div>
                    <div class="positions-list">
                        ${positionsList}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // === RENDERING - TIMELINE VIEW ===
    
    renderTimelineView() {
        if (this.state.workHistory.length === 0) {
            return `
                <div class="empty-state">
                    No work history added yet.<br>
                    Use the "+ Add Work History" button above to track your career timeline.
                </div>
            `;
        }
        
        const years = this.getTimelineYears();
        const yearRange = this.getTimelineYearRange();
        
        // Create year cells HTML
        const yearsHTML = years.map(year => `<div class="year-label">${year}</div>`).join('');
        
        // Create month lines for each year
        const monthLinesHTML = Array(12).fill().map(() => '<div class="month-line"></div>').join('');
        const yearCellsHTML = years.map(() => `<div class="year-cell">${monthLinesHTML}</div>`).join('');
        
        // Sort jobs: current jobs first, then by most recent start date
        const sortedHistory = [...this.state.workHistory].sort((a, b) => {
            const aHasCurrent = a.positions.some(p => p.isCurrent);
            const bHasCurrent = b.positions.some(p => p.isCurrent);
            
            // Current jobs come first
            if (aHasCurrent && !bHasCurrent) return -1;
            if (!aHasCurrent && bHasCurrent) return 1;
            
            // Within same current/not-current group, sort by start date (most recent first)
            const aStart = this.getEarliestStartDate(a.positions);
            const bStart = this.getEarliestStartDate(b.positions);
            const aDate = new Date(aStart.year, aStart.month - 1, aStart.day || 1);
            const bDate = new Date(bStart.year, bStart.month - 1, bStart.day || 1);
            return bDate - aDate;
        });
        
        // Generate job bars and title bars - separate left and right
        let leftJobBarsHTML = '';
        let rightJobBarsHTML = '';
        
        sortedHistory.forEach((entry, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const sideClass = side === 'left' ? 'left-side' : 'right-side';
            const extendClass = side === 'left' ? 'left-extend' : 'right-extend';
            
            // Sort positions by date
            const sortedPositions = [...entry.positions].sort((a, b) => {
                const aDate = new Date(a.startYear, a.startMonth - 1, a.startDay || 1);
                const bDate = new Date(b.startYear, b.startMonth - 1, b.startDay || 1);
                return aDate - bDate;
            });
            
            // Group positions into continuous employment periods (gaps > 1 month = separate bars)
            const employmentPeriods = [];
            let currentPeriod = [sortedPositions[0]];
            
            for (let i = 1; i < sortedPositions.length; i++) {
                const prevPosition = sortedPositions[i - 1];
                const currentPosition = sortedPositions[i];
                
                // Calculate gap in days between previous end and current start
                const prevEndDate = prevPosition.isCurrent 
                    ? new Date()
                    : new Date(prevPosition.endYear, prevPosition.endMonth - 1, prevPosition.endDay || 1);
                const currentStartDate = new Date(currentPosition.startYear, currentPosition.startMonth - 1, currentPosition.startDay || 1);
                
                const gapDays = (currentStartDate - prevEndDate) / (1000 * 60 * 60 * 24);
                
                // If gap is more than ~31 days, start a new period
                if (gapDays > 31) {
                    employmentPeriods.push(currentPeriod);
                    currentPeriod = [currentPosition];
                } else {
                    currentPeriod.push(currentPosition);
                }
            }
            employmentPeriods.push(currentPeriod);
            
            // Create separate bar for each employment period
            let jobBarHTML = '';
            employmentPeriods.forEach(period => {
                const firstPosition = period[0];
                const lastPosition = period[period.length - 1];
                
                const periodStartPercentage = this.dateToPercentage(
                    firstPosition.startMonth,
                    firstPosition.startYear,
                    firstPosition.startDay,
                    yearRange
                );
                
                let periodEndPercentage;
                if (lastPosition.isCurrent) {
                    const now = new Date();
                    periodEndPercentage = this.dateToPercentage(
                        now.getMonth() + 1,
                        now.getFullYear(),
                        now.getDate(),
                        yearRange
                    );
                } else {
                    periodEndPercentage = this.dateToPercentage(
                        lastPosition.endMonth,
                        lastPosition.endYear,
                        lastPosition.endDay,
                        yearRange
                    );
                }
                
                const periodHeight = periodStartPercentage - periodEndPercentage;
                
                // Add dividers for position changes within the period
                let dividersHTML = '';
                if (period.length > 1) {
                    for (let i = 1; i < period.length; i++) {
                        const pos = period[i];
                        const dividerPercentage = this.dateToPercentage(
                            pos.startMonth,
                            pos.startYear,
                            pos.startDay,
                            yearRange
                        );
                        const dividerTop = ((dividerPercentage - periodEndPercentage) / periodHeight) * 100;
                        dividersHTML += `<div class="job-bar-divider" style="top: ${dividerTop}%"></div>`;
                    }
                }
                
                jobBarHTML += `
                    <div class="job-bar ${sideClass} color-${entry.color}" 
                         style="top: ${periodEndPercentage}%; height: ${periodHeight}%;"
                         data-job-id="${entry.id}"
                         onmousedown="WorkHistorySystem.handlePressStart(${entry.id}, event)"
                         onmousemove="WorkHistorySystem.handlePressMove(event)"
                         onmouseup="WorkHistorySystem.handlePressEnd(${entry.id}, event)"
                         onmouseleave="WorkHistorySystem.handlePressCancel()"
                         ontouchstart="WorkHistorySystem.handlePressStart(${entry.id}, event)"
                         ontouchmove="WorkHistorySystem.handlePressMove(event)"
                         ontouchend="WorkHistorySystem.handlePressEnd(${entry.id}, event)"
                         ontouchcancel="WorkHistorySystem.handlePressCancel()">
                        ${dividersHTML}
                    </div>
                `;
            });
            
            // Calculate center point for company title (between earliest start and latest end)
            const earliestStart = sortedPositions[0];
            const latestEnd = sortedPositions[sortedPositions.length - 1];
            
            const overallStartPercentage = this.dateToPercentage(
                earliestStart.startMonth,
                earliestStart.startYear,
                earliestStart.startDay,
                yearRange
            );
            
            let overallEndPercentage;
            if (latestEnd.isCurrent) {
                const now = new Date();
                overallEndPercentage = this.dateToPercentage(
                    now.getMonth() + 1,
                    now.getFullYear(),
                    now.getDate(),
                    yearRange
                );
            } else {
                overallEndPercentage = this.dateToPercentage(
                    latestEnd.endMonth,
                    latestEnd.endYear,
                    latestEnd.endDay,
                    yearRange
                );
            }
            
            const centerPercentage = overallEndPercentage + ((overallStartPercentage - overallEndPercentage) / 2);
            const isActive = this.state.activeTimelineJob === entry.id;
            
            const titleBarHTML = `
                <div class="title-bar ${extendClass} color-${entry.color} ${isActive ? 'hidden' : ''}" 
                     style="top: calc(${centerPercentage}% - 7px);"
                     data-job-id="${entry.id}"
                     onmousedown="WorkHistorySystem.handlePressStart(${entry.id}, event)"
                     onmousemove="WorkHistorySystem.handlePressMove(event)"
                     onmouseup="WorkHistorySystem.handlePressEnd(${entry.id}, event)"
                     onmouseleave="WorkHistorySystem.handlePressCancel()"
                     ontouchstart="WorkHistorySystem.handlePressStart(${entry.id}, event)"
                     ontouchmove="WorkHistorySystem.handlePressMove(event)"
                     ontouchend="WorkHistorySystem.handlePressEnd(${entry.id}, event)"
                     ontouchcancel="WorkHistorySystem.handlePressCancel()">
                    ${entry.companyName.toUpperCase()}
                </div>
            `;
            
            // Position title bars (shown when active)
            let positionTitleBarsHTML = '';
            sortedPositions.forEach(position => {
                const posStartPercentage = this.dateToPercentage(
                    position.startMonth,
                    position.startYear,
                    position.startDay,
                    yearRange
                );
                
                let posEndPercentage;
                if (position.isCurrent) {
                    const now = new Date();
                    posEndPercentage = this.dateToPercentage(
                        now.getMonth() + 1,
                        now.getFullYear(),
                        now.getDate(),
                        yearRange
                    );
                } else {
                    posEndPercentage = this.dateToPercentage(
                        position.endMonth,
                        position.endYear,
                        position.endDay,
                        yearRange
                    );
                }
                
                const posCenterPercentage = posEndPercentage + ((posStartPercentage - posEndPercentage) / 2);
                
                positionTitleBarsHTML += `
                    <div class="position-title-bar ${extendClass} color-${entry.color} ${isActive ? 'visible' : ''}" 
                         style="top: calc(${posCenterPercentage}% - 7px);"
                         data-job-id="${entry.id}">
                        ${position.title}
                    </div>
                `;
            });
            
            // Add to appropriate side
            if (side === 'left') {
                leftJobBarsHTML += jobBarHTML + titleBarHTML + positionTitleBarsHTML;
            } else {
                rightJobBarsHTML += jobBarHTML + titleBarHTML + positionTitleBarsHTML;
            }
        });
        
        return `
            <div class="timeline-container">
                <div class="years-section">
                    ${yearsHTML}
                </div>
                <div class="timeline-section">
                    <div class="timeline-half">
                        ${yearCellsHTML}
                        ${leftJobBarsHTML}
                    </div>
                    <div class="timeline-half">
                        ${yearCellsHTML}
                        ${rightJobBarsHTML}
                    </div>
                </div>
            </div>
        `;
    },
    
    // === RENDERING - MAIN ===
    
    renderWorkHistory() {
        const viewToggle = `
            <div class="view-toggle">
                <button class="view-btn ${this.state.currentView === 'list' ? 'active' : ''}" 
                        onclick="WorkHistorySystem.switchView('list')">List View</button>
                <button class="view-btn ${this.state.currentView === 'timeline' ? 'active' : ''}" 
                        onclick="WorkHistorySystem.switchView('timeline')">Timeline View</button>
            </div>
        `;
        
        const content = this.state.currentView === 'list' 
            ? this.renderListView() 
            : this.renderTimelineView();
        
        return viewToggle + content;
    },
    
    updateDisplay() {
        const workHistoryList = document.getElementById('workHistoryList');
        if (workHistoryList) {
            workHistoryList.innerHTML = this.renderWorkHistory();
        }
    },
    
    toggleDropdown(id) {
        if (this.state.expandedCards.has(id)) {
            this.state.expandedCards.delete(id);
        } else {
            this.state.expandedCards.clear();
            this.state.expandedCards.add(id);
        }
        this.updateDisplay();
    },
    
    // === MODAL MANAGEMENT ===
    
    openActionModal(id) {
        this.state.currentEditingId = id;
        document.getElementById('workHistoryActionModal').style.display = 'flex';
        document.body.classList.add('modal-open');
    },
    
    closeActionModal() {
        document.getElementById('workHistoryActionModal').style.display = 'none';
        document.body.classList.remove('modal-open');
        this.state.currentEditingId = null;
    },
    
    handleEditFromAction() {
        const id = this.state.currentEditingId;
        this.closeActionModal();
        if (id) {
            this.openEditModal(id);
        }
    },
    
    handleDeleteFromAction() {
        if (this.state.currentEditingId && confirm('Are you sure you want to delete this work history entry? All positions will be removed.')) {
            this.state.workHistory = this.state.workHistory.filter(e => e.id !== this.state.currentEditingId);
            this.saveData();
            this.updateDisplay();
            this.closeActionModal();
        }
    },
    
    openAddModal() {
        this.state.currentEditingId = null;
        this.state.modalPositions = [];
        this.state.modalPositionIdCounter = 0;
        
        document.getElementById('workHistoryModalHeader').textContent = 'Add Work History';
        this.clearModalForm();
        
        this.addModalPosition();
        
        document.getElementById('workHistoryModal').style.display = 'flex';
        document.body.classList.add('modal-open');
    },
    
    openEditModal(id) {
        this.state.currentEditingId = id;
        this.state.modalPositions = [];
        this.state.modalPositionIdCounter = 0;
        
        document.getElementById('workHistoryModalHeader').textContent = 'Edit Work History';
        
        const entry = this.state.workHistory.find(e => e.id === id);
        if (entry) {
            this.populateModalForm(entry);
        }
        
        document.getElementById('workHistoryModal').style.display = 'flex';
        document.body.classList.add('modal-open');
    },
    
    closeModal() {
        document.getElementById('workHistoryModal').style.display = 'none';
        document.body.classList.remove('modal-open');
        this.state.currentEditingId = null;
        this.state.modalPositions = [];
        this.clearModalForm();
    },
    
    clearModalForm() {
    document.getElementById('workHistoryCompanyInput').value = '';
    this.selectColor('blue'); // This now also updates the header color
    this.state.modalPositions = [];
    this.renderModalPositions();
},
    
    populateModalForm(entry) {
        document.getElementById('workHistoryCompanyInput').value = entry.companyName || '';
        this.selectColor(entry.color);
        
        this.state.modalPositions = entry.positions.map((pos, index) => ({
            id: this.state.modalPositionIdCounter++,
            title: pos.title || '',
            startMonth: pos.startMonth,
            startDay: pos.startDay || '',
            startYear: pos.startYear,
            endMonth: pos.endMonth || '',
            endDay: pos.endDay || '',
            endYear: pos.endYear || '',
            isCurrent: pos.isCurrent || false
        }));
        
        this.renderModalPositions();
    },
    
    addModalPosition(data = {}) {
        const position = {
            id: this.state.modalPositionIdCounter++,
            title: data.title || '',
            startMonth: data.startMonth || '',
            startDay: data.startDay || '',
            startYear: data.startYear || '',
            endMonth: data.endMonth || '',
            endDay: data.endDay || '',
            endYear: data.endYear || '',
            isCurrent: data.isCurrent || false
        };
        
        this.state.modalPositions.push(position);
        this.renderModalPositions();
    },
    
    deleteModalPosition(id) {
        this.state.modalPositions = this.state.modalPositions.filter(p => p.id !== id);
        this.renderModalPositions();
    },
    
    updateModalPosition(id, field, value) {
        const position = this.state.modalPositions.find(p => p.id === id);
        if (position) {
            position[field] = value;
            
            if (field === 'isCurrent') {
                this.renderModalPositions();
            }
        }
    },
    
    
toggleCurrentPosition(id) {
    const position = this.state.modalPositions.find(p => p.id === id);
    if (position) {
        position.isCurrent = !position.isCurrent;
        this.renderModalPositions();
    }
},
    
    renderModalPositions() {
    const container = document.getElementById('workHistoryPositionsManager');
    if (!container) return;
    
    container.innerHTML = '';
    
    const sortedPositions = [...this.state.modalPositions].sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        
        const aDate = new Date(a.startYear || 2000, (a.startMonth || 1) - 1, a.startDay || 1);
        const bDate = new Date(b.startYear || 2000, (b.startMonth || 1) - 1, b.startDay || 1);
        return bDate - aDate;
    });
    
    sortedPositions.forEach((position, index) => {
        const checkedClass = position.isCurrent ? 'checked' : '';
        
        const positionHtml = `
            <div class="current-position-card">
                <div class="checkbox-section ${checkedClass}" onclick="WorkHistorySystem.toggleCurrentPosition(${position.id})"></div>
                <div class="checkbox-filler"></div>
                <div class="checkbox-label">CURRENT POSITION</div>
            </div>
            
            <div class="position-entry">
                <button class="delete-position-btn" onclick="WorkHistorySystem.deleteModalPosition(${position.id})">Delete Position</button>
                
                <input type="text" class="modal-input" placeholder="Position Title" value="${position.title}" 
                       onchange="WorkHistorySystem.updateModalPosition(${position.id}, 'title', this.value)">
                
                <div class="modal-row">
                    <input type="number" class="modal-input" placeholder="Start Month" value="${position.startMonth}" 
                           min="1" max="12"
                           onchange="WorkHistorySystem.updateModalPosition(${position.id}, 'startMonth', this.value)">
                    <input type="number" class="modal-input modal-input-day" placeholder="Day" value="${position.startDay}" 
                           min="1" max="31"
                           onchange="WorkHistorySystem.updateModalPosition(${position.id}, 'startDay', this.value)">
                    <input type="number" class="modal-input" placeholder="Year" value="${position.startYear}" 
                           min="1950" max="2030"
                           onchange="WorkHistorySystem.updateModalPosition(${position.id}, 'startYear', this.value)">
                </div>
                
                <div class="modal-row">
                    <input type="number" class="modal-input" placeholder="End Month" value="${position.endMonth}" 
                           ${position.isCurrent ? 'disabled' : ''} 
                           min="1" max="12"
                           onchange="WorkHistorySystem.updateModalPosition(${position.id}, 'endMonth', this.value)">
                    <input type="number" class="modal-input modal-input-day" placeholder="Day" value="${position.endDay}" 
                           ${position.isCurrent ? 'disabled' : ''} 
                           min="1" max="31"
                           onchange="WorkHistorySystem.updateModalPosition(${position.id}, 'endDay', this.value)">
                    <input type="number" class="modal-input" placeholder="Year" value="${position.endYear}" 
                           ${position.isCurrent ? 'disabled' : ''} 
                           min="1" max="2030"
                           onchange="WorkHistorySystem.updateModalPosition(${position.id}, 'endYear', this.value)">
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', positionHtml);
    });
},
    
    selectColor(color) {
    this.state.selectedColor = color;
    
    // Update color option selection
    document.querySelectorAll('#workHistoryModal .color-option').forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`#workHistoryModal .color-option.${color}`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Update modal header background color
    const colorMap = {
        blue: 'var(--job-color-blue)',
        green: 'var(--job-color-green)',
        purple: 'var(--job-color-purple)',
        red: 'var(--job-color-red)',
        orange: 'var(--job-color-orange)',
        teal: 'var(--job-color-teal)',
        gold: 'var(--job-color-gold)',
        brown: 'var(--job-color-brown)'
    };
    
    const modalHeader = document.getElementById('workHistoryModalHeader');
    if (modalHeader && colorMap[color]) {
        modalHeader.style.backgroundColor = colorMap[color];
    }
},
    
    saveWorkHistory() {
        const companyName = document.getElementById('workHistoryCompanyInput').value.trim();
        
        if (!companyName) {
            alert('Please enter a company name');
            return;
        }
        
        if (this.state.modalPositions.length === 0) {
            alert('Please add at least one position');
            return;
        }
        
        for (let i = 0; i < this.state.modalPositions.length; i++) {
            const position = this.state.modalPositions[i];
            
            if (!position.title.trim()) {
                alert(`Please enter a title for Position ${i + 1}`);
                return;
            }
            
            if (!position.startMonth || position.startMonth < 1 || position.startMonth > 12) {
                alert(`Please select a start month for Position ${i + 1}`);
                return;
            }
            
            if (!position.startYear || position.startYear < 1950 || position.startYear > 2030) {
                alert(`Please enter a valid start year (1950-2030) for Position ${i + 1}`);
                return;
            }
            
            if (!position.isCurrent) {
                if (!position.endMonth || position.endMonth < 1 || position.endMonth > 12) {
                    alert(`Please select an end month for Position ${i + 1}`);
                    return;
                }
                
                if (!position.endYear || position.endYear < 1950 || position.endYear > 2030) {
                    alert(`Please enter a valid end year (1950-2030) for Position ${i + 1}`);
                    return;
                }
                
                const startDate = new Date(position.startYear, position.startMonth - 1, position.startDay || 1);
                const endDate = new Date(position.endYear, position.endMonth - 1, position.endDay || 1);
                if (endDate <= startDate) {
                    alert(`End date must be after start date for Position ${i + 1}`);
                    return;
                }
            }
        }
        
        const positions = this.state.modalPositions.map(pos => ({
            id: pos.id,
            title: pos.title.trim(),
            startMonth: parseInt(pos.startMonth),
            startDay: pos.startDay ? parseInt(pos.startDay) : null,
            startYear: parseInt(pos.startYear),
            endMonth: pos.isCurrent ? null : parseInt(pos.endMonth),
            endDay: pos.isCurrent ? null : (pos.endDay ? parseInt(pos.endDay) : null),
            endYear: pos.isCurrent ? null : parseInt(pos.endYear),
            isCurrent: pos.isCurrent
        }));
        
        const workHistoryEntry = {
            id: this.state.currentEditingId || Date.now(),
            companyName: companyName,
            positions: positions,
            color: this.state.selectedColor
        };
        
        if (this.state.currentEditingId) {
            const index = this.state.workHistory.findIndex(e => e.id === this.state.currentEditingId);
            if (index !== -1) {
                this.state.workHistory[index] = workHistoryEntry;
            }
        } else {
            this.state.workHistory.push(workHistoryEntry);
        }
        
        this.saveData();
        this.updateDisplay();
        this.closeModal();
    },
    
    // === MONTH PICKER ===
    
    openMonthPicker(inputId, positionId, field, headerText) {
        this.state.monthPickerState.targetInputId = inputId;
        this.state.monthPickerState.targetPositionId = positionId;
        this.state.monthPickerState.targetField = field;
        this.state.monthPickerState.headerText = headerText;
        
        const position = this.state.modalPositions.find(p => p.id === positionId);
        const currentValue = position ? position[field] : null;
        this.state.monthPickerState.selectedMonth = currentValue ? parseInt(currentValue) : null;
        
        document.getElementById('workHistoryMonthPickerHeader').textContent = headerText;
        this.updateMonthButtons();
        document.getElementById('workHistoryMonthPickerModal').style.display = 'flex';
    },
    
    closeMonthPicker() {
        document.getElementById('workHistoryMonthPickerModal').style.display = 'none';
        this.state.monthPickerState.targetInputId = null;
        this.state.monthPickerState.targetPositionId = null;
        this.state.monthPickerState.selectedMonth = null;
    },
    
    selectMonth(month) {
        this.state.monthPickerState.selectedMonth = month;
        this.updateMonthButtons();
    },
    
    updateMonthButtons() {
        document.querySelectorAll('#workHistoryMonthPickerModal .month-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (this.state.monthPickerState.selectedMonth && 
                parseInt(btn.getAttribute('data-month')) === this.state.monthPickerState.selectedMonth) {
                btn.classList.add('selected');
            }
        });
    },
    
    clearMonth() {
        if (this.state.monthPickerState.targetPositionId !== null) {
            this.updateModalPosition(
                this.state.monthPickerState.targetPositionId, 
                this.state.monthPickerState.targetField, 
                ''
            );
            this.renderModalPositions();
        }
        this.closeMonthPicker();
    },
    
    setMonth() {
        if (this.state.monthPickerState.selectedMonth && this.state.monthPickerState.targetPositionId !== null) {
            this.updateModalPosition(
                this.state.monthPickerState.targetPositionId, 
                this.state.monthPickerState.targetField, 
                this.state.monthPickerState.selectedMonth
            );
            this.renderModalPositions();
        }
        this.closeMonthPicker();
    },
    
    // === WINDOW MANAGEMENT ===
    
    openWindow() {
        if (typeof showWindow === 'function') {
            showWindow('workHistoryWindow');
        }
    },
    
    returnToDataWindow() {
        if (typeof showWindow === 'function') {
            showWindow('dataWindow');
        }
    },
    
    // === INITIALIZATION ===
    
    injectHTML() {
        const windowHTML = `
            <div class="window" id="workHistoryWindow">
                <div class="content work-history-content">
                    <div class="add-work-history-card" onclick="WorkHistorySystem.openAddModal()">
                        + Add Work History
                    </div>
                    
                    <div id="workHistoryList"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', windowHTML);
        
        const modalsHTML = `
            <div class="modal-overlay" id="workHistoryActionModal">
                <div class="action-modal-content">
                    <button class="action-modal-btn edit" onclick="WorkHistorySystem.handleEditFromAction()">Edit</button>
                    <button class="action-modal-btn delete" onclick="WorkHistorySystem.handleDeleteFromAction()">Delete</button>
                    <button class="action-modal-btn cancel" onclick="WorkHistorySystem.closeActionModal()">Cancel</button>
                </div>
            </div>
            
           <div class="modal-overlay" id="workHistoryModal">
    <div class="modal-content">
        <div class="modal-header" id="workHistoryModalHeader">Add Work History</div>
        <div class="modal-body">
            <input type="text" class="modal-input" id="workHistoryCompanyInput" placeholder="Company Name">
            
            <div class="positions-manager" id="workHistoryPositionsManager">
            </div>
            
            <button class="add-position-btn" onclick="WorkHistorySystem.addModalPosition()">+ Add Position</button>
            
            <div class="color-picker-section">
                <div class="color-picker-row">
                    <div class="color-option blue selected" onclick="WorkHistorySystem.selectColor('blue')"></div>
                    <div class="color-option green" onclick="WorkHistorySystem.selectColor('green')"></div>
                    <div class="color-option purple" onclick="WorkHistorySystem.selectColor('purple')"></div>
                    <div class="color-option red" onclick="WorkHistorySystem.selectColor('red')"></div>
                    <div class="color-option orange" onclick="WorkHistorySystem.selectColor('orange')"></div>
                    <div class="color-option teal" onclick="WorkHistorySystem.selectColor('teal')"></div>
                    <div class="color-option gold" onclick="WorkHistorySystem.selectColor('gold')"></div>
                    <div class="color-option brown" onclick="WorkHistorySystem.selectColor('brown')"></div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="modal-btn cancel" onclick="WorkHistorySystem.closeModal()">Cancel</button>
            <button class="modal-btn save" onclick="WorkHistorySystem.saveWorkHistory()">Save</button>
        </div>
    </div>
</div>
            
            <div class="month-picker-modal" id="workHistoryMonthPickerModal">
                <div class="month-picker-content">
                    <div class="month-picker-header" id="workHistoryMonthPickerHeader">Select Month</div>
                    <div class="month-picker-body">
                        <div class="month-grid">
                            <button class="month-btn" data-month="1" onclick="WorkHistorySystem.selectMonth(1)">JAN</button>
                            <button class="month-btn" data-month="2" onclick="WorkHistorySystem.selectMonth(2)">FEB</button>
                            <button class="month-btn" data-month="3" onclick="WorkHistorySystem.selectMonth(3)">MAR</button>
                            <button class="month-btn" data-month="4" onclick="WorkHistorySystem.selectMonth(4)">APR</button>
                            <button class="month-btn" data-month="5" onclick="WorkHistorySystem.selectMonth(5)">MAY</button>
                            <button class="month-btn" data-month="6" onclick="WorkHistorySystem.selectMonth(6)">JUN</button>
                            <button class="month-btn" data-month="7" onclick="WorkHistorySystem.selectMonth(7)">JUL</button>
                            <button class="month-btn" data-month="8" onclick="WorkHistorySystem.selectMonth(8)">AUG</button>
                            <button class="month-btn" data-month="9" onclick="WorkHistorySystem.selectMonth(9)">SEP</button>
                            <button class="month-btn" data-month="10" onclick="WorkHistorySystem.selectMonth(10)">OCT</button>
                            <button class="month-btn" data-month="11" onclick="WorkHistorySystem.selectMonth(11)">NOV</button>
                            <button class="month-btn" data-month="12" onclick="WorkHistorySystem.selectMonth(12)">DEC</button>
                        </div>
                    </div>
                    <div class="month-picker-footer">
                        <button class="month-action-btn clear" onclick="WorkHistorySystem.clearMonth()">Clear</button>
                        <button class="month-action-btn" onclick="WorkHistorySystem.closeMonthPicker()">Cancel</button>
                        <button class="month-action-btn set" onclick="WorkHistorySystem.setMonth()">Set</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalsHTML);
        
        const frozenHeader = document.querySelector('.frozen-header');
        if (frozenHeader) {
            const headerCardHTML = `
                <div class="settings-title-header-card" id="workHistoryTitleHeaderCard">
                    <div class="settings-header-back" onclick="WorkHistorySystem.returnToDataWindow()"></div>
                    <div class="settings-header-center">Work History</div>
                    <div class="settings-header-unused"></div>
                </div>
            `;
            frozenHeader.insertAdjacentHTML('beforeend', headerCardHTML);
        }
    },
    
    injectStyles() {
        if (document.getElementById('work-history-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'work-history-styles';
        style.textContent = `
            /* Work History System Styles */
            
            .work-history-content {
    overflow: hidden;
    padding-bottom: 4px !important;
}
            
            /* View Toggle */
            .view-toggle {
                display: flex;
                gap: 4px;
                margin-bottom: 4px;
            }
            
            .view-btn {
                flex: 1;
                background: var(--bg4);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                padding: 12px;
                font-size: 14px;
                font-weight: 700;
                color: var(--text1);
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .view-btn:hover {
                background: var(--bg3);
            }
            
            .view-btn.active {
                background: var(--job-color-green);
                color: var(--text2);
            }
            
            /* Timeline Container */
           .timeline-container {
    background: var(--bg2);
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    display: flex;
    height: calc(100vh - 150px);
    overflow: hidden;
    margin-top: 4px;
    margin-bottom: 0px;
}

.years-section {
    width: 60px;
    background: var(--bg1);
    border-right: var(--b) solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
}
            
            .year-label {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: var(--text1);
                border-bottom: var(--b) solid var(--border);
                min-height: 0;
                box-sizing: border-box;
            }
            
            .year-label:last-child {
                border-bottom: none;
            }
            
            .timeline-section {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
}
            
            .timeline-half {
    flex: 1;
    border-right: var(--b) solid var(--border);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}
            
            .timeline-half:last-child {
                border-right: none;
            }
            
            .year-cell {
                flex: 1;
                background: var(--bg4);
                border-bottom: var(--b) solid var(--border);
                display: flex;
                flex-direction: column;
                min-height: 0;
                box-sizing: border-box;
                margin-bottom: calc(var(--b) * -1);
            }
            
            .year-cell:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            
            .month-line {
    flex: 1;
    border-bottom: 1px solid var(--lines);
    min-height: 0;
    box-sizing: border-box;
}
            
            .month-line:last-child {
                border-bottom: none;
            }
            
            /* Job Bars */
            .job-bar {
                position: absolute;
                width: 20px;
                border: 2px solid var(--border);
                border-radius: 4px;
                z-index: 100;
                cursor: pointer;
                user-select: none;
            }
            
            .job-bar.left-side {
                right: 5px;
            }
            
            .job-bar.right-side {
                left: 5px;
            }
            
            .job-bar.color-blue { background: var(--job-color-blue); }
            .job-bar.color-green { background: var(--job-color-green); }
            .job-bar.color-purple { background: var(--job-color-purple); }
            .job-bar.color-red { background: var(--job-color-red); }
            .job-bar.color-orange { background: var(--job-color-orange); }
            .job-bar.color-teal { background: var(--job-color-teal); }
            .job-bar.color-gold { background: var(--job-color-gold); }
            .job-bar.color-brown { background: var(--job-color-brown); }
            
            .job-bar-divider {
                position: absolute;
                left: 0;
                right: 0;
                height: 1px;
                background: var(--border);
            }
            
            /* Title Bars */
            .title-bar {
                position: absolute;
                height: 14px;
                border: 2px solid var(--border);
                border-radius: 4px;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                font-weight: 700;
                color: var(--text1);
                padding: 0 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                cursor: pointer;
                user-select: none;
            }
            
            .title-bar.hidden {
                display: none;
            }
            
            .title-bar.left-extend {
                left: 10px;
                right: 30px;
            }
            
            .title-bar.right-extend {
                left: 30px;
                right: 10px;
            }
            
            .title-bar.color-blue { background: var(--job-color-blue); }
            .title-bar.color-green { background: var(--job-color-green); }
            .title-bar.color-purple { background: var(--job-color-purple); }
            .title-bar.color-red { background: var(--job-color-red); }
            .title-bar.color-orange { background: var(--job-color-orange); }
            .title-bar.color-teal { background: var(--job-color-teal); }
            .title-bar.color-gold { background: var(--job-color-gold); }
            .title-bar.color-brown { background: var(--job-color-brown); }
            
            /* Position Title Bars */
            .position-title-bar {
                position: absolute;
                height: 14px;
                border: 2px solid var(--border);
                border-radius: 4px;
                z-index: 101;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                font-weight: 700;
                color: var(--text1);
                padding: 0 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                user-select: none;
            }
            
            .position-title-bar.visible {
                display: flex;
            }
            
            .position-title-bar.left-extend {
                left: 10px;
                right: 30px;
            }
            
            .position-title-bar.right-extend {
                left: 30px;
                right: 10px;
            }
            
            .position-title-bar.color-blue { background: var(--job-color-blue); }
            .position-title-bar.color-green { background: var(--job-color-green); }
            .position-title-bar.color-purple { background: var(--job-color-purple); }
            .position-title-bar.color-red { background: var(--job-color-red); }
            .position-title-bar.color-orange { background: var(--job-color-orange); }
            .position-title-bar.color-teal { background: var(--job-color-teal); }
            .position-title-bar.color-gold { background: var(--job-color-gold); }
            .position-title-bar.color-brown { background: var(--job-color-brown); }
            
            /* Action Modal */
            .action-modal-content {
                background: var(--bg2);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                width: 90%;
                max-width: 300px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                gap: var(--b);
            }
            
            .action-modal-btn {
                background: var(--bg4);
                border: none;
                padding: 16px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text1);
                font-family: inherit;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .action-modal-btn:first-child {
                border-radius: var(--r) var(--r) 0 0;
            }
            
            .action-modal-btn:last-child {
                border-radius: 0 0 var(--r) var(--r);
            }
            
            .action-modal-btn:hover {
                background: var(--bg3);
            }
            
            .action-modal-btn.edit {
                background: var(--primary);
                color: var(--white);
            }
            
            .action-modal-btn.edit:hover {
                background: var(--primary-dark);
            }
            
            .action-modal-btn.delete {
                background: var(--error);
                color: var(--white);
            }
            
            .action-modal-btn.delete:hover {
                background: #dc2626;
            }
            
            .action-modal-btn.cancel {
                background: var(--bg4);
                color: var(--text1);
            }
            
            .action-modal-btn.cancel:hover {
                background: var(--bg3);
            }
            
            /* Work History Cards (List View) */
            .work-history-card {
                background: var(--bg2);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                margin-bottom: var(--gap);
                overflow: hidden;
                user-select: none;
            }
            
            .work-history-main {
                display: flex;
                flex-direction: column;
                cursor: pointer;
                transition: all 0.2s ease;
                user-select: none;
            }
            
            .work-history-main:active {
                opacity: 0.8;
            }
            
            .work-history-title-section {
                background: var(--job-color-blue);
                padding: 4px 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 28px;
                border-bottom: 3px solid var(--border);
                user-select: none;
            }
            
            .work-history-title-section.color-blue { background: var(--job-color-blue); }
            .work-history-title-section.color-green { background: var(--job-color-green); }
            .work-history-title-section.color-purple { background: var(--job-color-purple); }
            .work-history-title-section.color-red { background: var(--job-color-red); }
            .work-history-title-section.color-orange { background: var(--job-color-orange); }
            .work-history-title-section.color-teal { background: var(--job-color-teal); }
            .work-history-title-section.color-gold { background: var(--job-color-gold); }
            .work-history-title-section.color-brown { background: var(--job-color-brown); }
            
            .work-history-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text1);
                user-select: none;
            }
            
            .work-history-info-section {
                background: var(--bg4);
                padding: 4px 8px;
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-height: 36px;
                align-items: center;
                text-align: center;
                user-select: none;
            }
            
            .work-history-duration {
                font-size: 13px;
                color: var(--text1);
                font-weight: 600;
                user-select: none;
            }
            
            .work-history-dates {
                font-size: 11px;
                color: var(--text2);
                user-select: none;
            }
            
            .positions-list {
                display: none;
                border-top: var(--b) solid var(--border);
            }
            
            .work-history-card.expanded .positions-list {
                display: block;
            }
            
            .position-item {
                background: var(--bg2);
                border-bottom: var(--b) solid var(--border);
                padding: 6px 12px;
                display: flex;
                flex-direction: column;
                gap: 2px;
                align-items: center;
                text-align: center;
                user-select: none;
            }
            
            .position-item:last-child {
                border-bottom: none;
            }
            
            .position-title {
                font-size: 12px;
                font-weight: 600;
                color: var(--text1);
                user-select: none;
            }
            
            .position-dates {
                font-size: 10px;
        font-weight: 600;
                color: var(--text2);
                user-select: none;
            }
            
            .position-duration {
                font-size: 10px;
        font-weight: 600;
                color: var(--text1);
                user-select: none;
            }
            
            /* Add Work History Card */
            .add-work-history-card {
                background: var(--primary);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                height: var(--h);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: var(--gap);
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text2);
                font-weight: 600;
                font-size: 14px;
            }
            
            .add-work-history-card:hover {
                background: var(--primary-dark);
                transform: translateY(-1px);
            }
            
            /* Modal Styles */
            #workHistoryModal .modal-body {
    padding: 4px !important;
    overflow-x: hidden;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}
        
#workHistoryModal .section-header {
    display: none !important;
}
            
            #workHistoryModal .modal-header {
                padding: 8px 16px !important;
                font-size: 14px !important;
                flex-shrink: 0;
            }
            
            #workHistoryModal .modal-body {
                padding: 8px 16px !important;
                overflow-x: hidden;
                overflow-y: auto;
                flex: 1;
                min-height: 0;
            }
            
            #workHistoryModal .modal-input {
                padding: 8px 12px !important;
                font-size: 14px !important;
                margin-bottom: 4px !important;
                min-height: 32px !important;
                height: 32px !important;
                min-width: 0;
            }
            
            #workHistoryModal .modal-row {
                gap: 4px !important;
                margin-bottom: 4px !important;
                min-width: 0;
                display: flex !important;
            }
            
            #workHistoryModal .modal-row .modal-input {
                margin-bottom: 0 !important;
                min-width: 0;
                flex: 1;
            }
            
            #workHistoryModal .modal-input-day {
                flex: 0 0 50px !important;
                max-width: 50px !important;
                text-align: center;
                padding: 8px 4px !important;
            }
            
            #workHistoryModal .checkbox-container {
                margin-bottom: 4px !important;
                min-height: 24px !important;
                height: 24px !important;
                min-width: 0;
                gap: 8px !important;
                flex-shrink: 0;
            }
            
            #workHistoryModal .checkbox-container label {
                font-size: 12px !important;
                white-space: nowrap;
            }
            
            #workHistoryModal .color-picker-section {
    margin-bottom: 4px !important;
    margin-top: 4px !important;
}

#workHistoryModal .color-picker-row {
    height: 24px;
    background: var(--bg4);
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    display: flex;
    overflow: hidden;
}

#workHistoryModal .color-option {
    flex: 1;
    border-right: var(--b) solid var(--border);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.2s ease;
}

#workHistoryModal .color-option:last-child {
    border-right: none;
}

#workHistoryModal .color-option:hover {
    opacity: 0.8;
}

#workHistoryModal .color-option.selected::after {
    content: '';
    width: 8px;
    height: 8px;
    background: var(--white);
    border-radius: 50%;
}
            
            #workHistoryModal .modal-footer {
                gap: 4px !important;
                padding: 8px 16px !important;
                min-width: 0;
                flex-shrink: 0;
            }
            
            #workHistoryModal .modal-btn {
                padding: 8px 4px !important;
                font-size: 13px !important;
                min-height: 32px !important;
                height: 32px !important;
                min-width: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .section-header {
                font-size: 12px;
                font-weight: 700;
                color: var(--text1);
                margin-top: 8px;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .section-header:first-child {
                margin-top: 0;
            }
            
            .positions-manager {
                margin-top: 0;
            }
            
            .position-entry {
                background: var(--bg3);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                padding: 8px;
                margin-bottom: 4px;
            }
            
            .position-entry-header {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 4px;
            }
            
            .delete-position-btn {
                background: var(--error);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                padding: 4px 8px;
                font-size: 11px;
                font-weight: 700;
                color: var(--white);
                cursor: pointer;
            }
            
            .add-position-btn {
                width: 100%;
                background: var(--primary);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                padding: 8px;
                font-size: 13px;
                font-weight: 700;
                color: var(--white);
                cursor: pointer;
                margin-top: 4px;
                margin-bottom: 8px;
            }
        
     #workHistoryModal .current-position-card {
    background: var(--bg1);
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    margin-bottom: 4px;
    height: 32px;
    display: flex;
    overflow: hidden;
    position: relative;
}

#workHistoryModal .checkbox-section {
    flex: 0 0 12.5%;
    background: var(--bg1);
    border-right: var(--b) solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;
    position: relative;
    z-index: 2;
}

#workHistoryModal .checkbox-section:hover {
    background: var(--bg2);
}

#workHistoryModal .checkbox-section.checked {
    background: var(--primary);
}

#workHistoryModal .checkbox-section.checked::after {
    content: '✓';
    color: var(--text1);
    font-size: 20px;
    font-weight: 900;
    position: absolute;
}

#workHistoryModal .checkbox-label {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--text1);
    pointer-events: none;
    z-index: 1;
}

#workHistoryModal .checkbox-filler {
    flex: 1;
    background: var(--bg1);
}   
        
#workHistoryModal .position-entry {
    background: var(--bg1);
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    padding: 4px;
    margin-bottom: 4px;
}

#workHistoryModal .delete-position-btn {
    width: 100%;
    background: var(--error);
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    padding: 8px;
    font-size: 11px;
    font-weight: 700;
    color: var(--white);
    cursor: pointer;
    font-family: inherit;
    margin-bottom: 4px;
}

#workHistoryModal .add-position-btn {
    width: 100%;
    background: var(--primary);
    border: var(--b) solid var(--border);
    border-radius: var(--r);
    padding: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--white);
    cursor: pointer;
    font-family: inherit;
    margin-bottom: 4px;
}
        
        
            
            /* Month Picker Modal */
            .month-picker-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000000;
                z-index: 10001;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .month-picker-content {
                background: var(--bg2);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                width: 100%;
                max-width: 300px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                overflow: hidden;
            }
            
            .month-picker-header {
                background: var(--bg1);
                color: var(--text1);
                padding: 12px 16px;
                font-weight: 700;
                font-size: 15px;
                text-align: center;
                border-bottom: var(--b) solid var(--border);
            }
            
            .month-picker-body {
                padding: 16px;
            }
            
            .month-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            
            .month-btn {
                background: var(--bg4);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                padding: 12px 8px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text1);
                display: flex;
                align-items: center;
                justify-content: center;
                height: 44px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .month-btn:hover {
                background: var(--bg3);
            }
            
            .month-btn.selected {
                background: var(--primary);
                color: var(--white);
            }
            
            .month-picker-footer {
                display: flex;
                gap: 8px;
                padding: 12px 16px;
                border-top: var(--b) solid var(--border);
            }
            
            .month-action-btn {
                flex: 1;
                background: var(--bg4);
                border: var(--b) solid var(--border);
                border-radius: var(--r);
                padding: 10px 12px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text1);
            }
            
            .month-action-btn:hover {
                background: var(--bg3);
            }
            
            .month-action-btn.clear {
                background: var(--secondary);
                color: var(--white);
            }
            
            .month-action-btn.clear:hover {
                background: #4a7c95;
            }
            
            .month-action-btn.set {
                background: var(--primary);
                color: var(--white);
            }
            
            .month-action-btn.set:hover {
                background: var(--primary-dark);
            }
            
            body.work-history-mode {
                padding-top: 40px;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    addDataWindowCard() {
        const dataWindow = document.getElementById('dataWindow');
        if (!dataWindow) return;
        
        const content = dataWindow.querySelector('.content');
        if (!content) return;
        
        const cards = content.querySelectorAll('.job-card');
        if (cards.length >= 2) {
            const cardHTML = `
                <div class="job-card" onclick="WorkHistorySystem.openWindow()" style="cursor: pointer;">
                    <div class="job-title-section">
                        <div class="job-title">Work History</div>
                    </div>
                    <div class="job-info-section">
                        <div class="next-shift-time">Track your career timeline</div>
                    </div>
                </div>
            `;
            cards[1].insertAdjacentHTML('afterend', cardHTML);
        }
    },
    
    integrateWithShowWindow() {
        const originalShowWindow = window.showWindow;
        if (typeof originalShowWindow === 'function') {
            window.showWindow = function(windowId) {
                originalShowWindow(windowId);
                
                const body = document.body;
                const workHistoryCard = document.getElementById('workHistoryTitleHeaderCard');
                
                if (windowId === 'workHistoryWindow') {
                    body.classList.add('work-history-mode');
                    if (workHistoryCard) workHistoryCard.classList.add('active');
                    WorkHistorySystem.updateDisplay();
                } else {
                    body.classList.remove('work-history-mode');
                    if (workHistoryCard) workHistoryCard.classList.remove('active');
                }
            };
        }
    },
    
    initialize() {
        console.log('🚀 Initializing Work History System with Timeline View...');
        
        this.injectStyles();
        this.injectHTML();
        this.loadData();
        this.addDataWindowCard();
        this.integrateWithShowWindow();
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.getElementById('workHistoryModal').style.display === 'flex') {
                this.saveWorkHistory();
            }
            if (e.key === 'Escape') {
                if (document.getElementById('workHistoryActionModal').style.display === 'flex') {
                    this.closeActionModal();
                }
                if (document.getElementById('workHistoryModal').style.display === 'flex') {
                    this.closeModal();
                }
                if (document.getElementById('workHistoryMonthPickerModal').style.display === 'flex') {
                    this.closeMonthPicker();
                }
            }
        });
        
        const actionModal = document.getElementById('workHistoryActionModal');
        if (actionModal) {
            actionModal.addEventListener('click', (e) => {
                if (e.target.id === 'workHistoryActionModal') {
                    this.closeActionModal();
                }
            });
        }
        
        const workHistoryModal = document.getElementById('workHistoryModal');
        if (workHistoryModal) {
            workHistoryModal.addEventListener('click', (e) => {
                if (e.target.id === 'workHistoryModal') {
                    this.closeModal();
                }
            });
        }
        
        const monthPickerModal = document.getElementById('workHistoryMonthPickerModal');
        if (monthPickerModal) {
            monthPickerModal.addEventListener('click', (e) => {
                if (e.target.id === 'workHistoryMonthPickerModal') {
                    this.closeMonthPicker();
                }
            });
        }
        
        console.log('✅ Work History System initialized with Timeline View (Tap to Toggle / Long Press to Edit)');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        WorkHistorySystem.initialize();
    });
} else {
    WorkHistorySystem.initialize();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkHistorySystem;
}