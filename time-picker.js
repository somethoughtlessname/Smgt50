// === SHIFT ANALYTICS SYSTEM ===
const ShiftAnalytics = {
    /**
     * Get all historical SCHEDULED shifts from all weeks for current job
     * @returns {Array} Array of shift objects {start, end, count}
     */
    getAllHistoricalShifts() {
        if (!currentJobId) return [];
        
        const job = jobs.find(j => j.id === currentJobId);
        if (!job) return [];
        
        const shiftPatterns = {};
        
        // ONLY collect from SCHEDULED shifts (all weeks)
        if (job.weeklyScheduledShifts) {
            Object.values(job.weeklyScheduledShifts).forEach(weekData => {
                Object.values(weekData).forEach(dayShift => {
                    if (dayShift && dayShift.start && dayShift.end && 
                        dayShift.start !== 'START' && dayShift.end !== 'END' &&
                        dayShift.start !== 'OFF' && dayShift.end !== 'OFF') {
                        
                        const key = `${dayShift.start}|${dayShift.end}`;
                        if (!shiftPatterns[key]) {
                            shiftPatterns[key] = {
                                start: dayShift.start,
                                end: dayShift.end,
                                count: 0
                            };
                        }
                        shiftPatterns[key].count++;
                    }
                });
            });
        }
        
        return Object.values(shiftPatterns);
    },
    
    /**
     * Get top 4 most used shifts
     * @returns {Array} Top 4 shifts sorted by frequency
     */
    getTopShifts() {
        const allShifts = this.getAllHistoricalShifts();
        
        // Sort by count descending, then by start time
        const sorted = allShifts.sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            // Secondary sort by start time for consistency
            return this.compareTime(a.start, b.start);
        });
        
        // Return top 4, or fill with default shifts if less than 4
        const top4 = sorted.slice(0, 4);
        
        // If we don't have 4 shifts, add defaults
        const defaults = [
            { start: '09:00 AM', end: '05:00 PM', count: 0 },
            { start: '05:00 PM', end: '01:00 AM', count: 0 },
            { start: '10:00 PM', end: '06:00 AM', count: 0 },
            { start: '06:00 AM', end: '02:00 PM', count: 0 }
        ];
        
        while (top4.length < 4) {
            const nextDefault = defaults[top4.length];
            // Only add if not already in top4
            const exists = top4.some(s => s.start === nextDefault.start && s.end === nextDefault.end);
            if (!exists) {
                top4.push(nextDefault);
            } else {
                top4.push(defaults[top4.length + 1] || defaults[0]);
            }
        }
        
        return top4.slice(0, 4);
    },
    
    /**
     * Compare two time strings for sorting
     * @param {string} time1 
     * @param {string} time2 
     * @returns {number}
     */
    compareTime(time1, time2) {
        const parse = (time) => {
            const match = time.match(/(\d+):(\d+)\s*(AM|PM)/);
            if (!match) return 0;
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const period = match[3];
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            return hours * 60 + minutes;
        };
        
        return parse(time1) - parse(time2);
    }
};

// === TIME PICKER STATE ===
let timePickerState = {
    currentDay: null,
    currentField: null,
    timeInput: '',
    isAm: true,
    isPrePopulated: false  // Track if time was loaded from existing value
};

let overnightShiftState = {
    pendingData: null
};

// === TIME PICKER FUNCTIONS ===
function openTimePicker(day, field) {
    timePickerState.currentDay = day;
    timePickerState.currentField = field;
    
    // Get the current time value from the field to pre-populate
    const dayCards = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
    };
    
    const dayNumber = dayCards[day];
    const job = jobs.find(j => j.id === currentJobId);
    
    // Default to blank and AM
    timePickerState.timeInput = '';
    timePickerState.isAm = true;
    
    // Try to get existing time value
    if (job) {
        const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
        if (shiftsData[dayNumber]) {
            const existingTime = shiftsData[dayNumber][field];
            
            // If there's a valid time (not START, END, or OFF), parse it
            if (existingTime && 
                existingTime !== 'START' && 
                existingTime !== 'END' && 
                existingTime !== 'OFF') {
                
                const match = existingTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (match) {
                    const hours = match[1].padStart(2, '0');
                    const minutes = match[2];
                    const period = match[3].toUpperCase();
                    
                    // Set the time input (without colons or spaces)
                    timePickerState.timeInput = hours + minutes;
                    
                    // Set AM/PM
                    timePickerState.isAm = (period === 'AM');
                    
                    // Mark as pre-populated so first keypress clears it
                    timePickerState.isPrePopulated = true;
                }
            }
        }
    }
    
    updateTimeDisplay();
    updateAmPmButtons();
    
    const modal = document.getElementById('timePickerModal');
    
    // Add scheduled mode class if in scheduled tab
    if (currentSubTab === 'scheduled') {
        modal.classList.add('scheduled-mode');
        populateQuickRanges();
    } else {
        modal.classList.remove('scheduled-mode');
    }
    
    modal.style.display = 'flex';
}

// === QUICK RANGE BUTTONS ===
function populateQuickRanges() {
    const container = document.getElementById('quickRangesRow');
    if (!container) return;
    
    const topShifts = ShiftAnalytics.getTopShifts();
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create buttons with data attributes and add event listeners
    topShifts.forEach((shift, index) => {
        const button = document.createElement('button');
        button.className = 'quick-range-btn';
        button.setAttribute('data-start', shift.start);
        button.setAttribute('data-end', shift.end);
        
        button.innerHTML = `
            <div class="quick-range-time">${shift.start}</div>
            <div class="quick-range-divider">
                <div class="quick-range-divider-line"></div>
                <div class="quick-range-break">00</div>
                <div class="quick-range-divider-line"></div>
            </div>
            <div class="quick-range-time">${shift.end}</div>
        `;
        
        // Add click event listener
        button.addEventListener('click', function() {
            const startTime = this.getAttribute('data-start');
            const endTime = this.getAttribute('data-end');
            selectQuickRange(startTime, endTime);
        });
        
        container.appendChild(button);
    });
}

function selectQuickRange(startTime, endTime) {
    const dayCards = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
    };
    
    const dayNumber = dayCards[timePickerState.currentDay];
    const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
    
    if (!dayCard) {
        closeTimePicker();
        return;
    }
    
    const startField = dayCard.querySelector('.time-field.start');
    const endField = dayCard.querySelector('.time-field.end');
    const breakField = dayCard.querySelector('.time-field.break');
    const totalField = dayCard.querySelector('.time-field.total');
    
    const job = jobs.find(j => j.id === currentJobId);
    if (!job) {
        closeTimePicker();
        return;
    }
    
    const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
    
    if (!shiftsData[dayNumber]) {
        shiftsData[dayNumber] = { start: 'START', end: 'END', total: '00.00', break: 0 };
    }
    
    shiftsData[dayNumber].start = startTime;
    shiftsData[dayNumber].end = endTime;
    
    if (startField) {
        startField.textContent = startTime;
        startField.removeAttribute('data-state');
    }
    if (endField) {
        endField.textContent = endTime;
        endField.removeAttribute('data-state');
    }
    
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const breakMinutes = shiftsData[dayNumber].break || 0;
    
    if (startMinutes !== null && endMinutes !== null) {
        let totalMinutes;
        
        if (endMinutes < startMinutes) {
            totalMinutes = (24 * 60 - startMinutes) + endMinutes;
        } else if (endMinutes === startMinutes) {
            totalMinutes = 24 * 60;
        } else {
            totalMinutes = endMinutes - startMinutes;
        }
        
        totalMinutes = Math.max(0, totalMinutes - breakMinutes);
        
        shiftsData[dayNumber].total = minutesToHoursDisplay(totalMinutes);
        if (totalField) {
            totalField.textContent = shiftsData[dayNumber].total;
            totalField.removeAttribute('data-state');
        }
    } else {
        shiftsData[dayNumber].total = '00.00';
        if (totalField) {
            totalField.textContent = '00.00';
        }
    }
    
    if (breakField) {
        breakField.removeAttribute('data-state');
    }
    
    setShiftsForActiveWeek(job, currentSubTab, shiftsData);
    updateNextShiftForJob(job);
    renderJobs();
    saveData();
    updateTotalHoursDisplay();
    
    if (typeof updateQuickScheduleOnShiftChange === 'function') {
        updateQuickScheduleOnShiftChange();
    }
    
    closeTimePicker();
}

function calculateHoursForDay(startTime, endTime) {
    if (!startTime || !endTime || 
        startTime === 'START' || endTime === 'END' || 
        startTime === 'OFF' || endTime === 'OFF') {
        return null;
    }
    
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    if (startMinutes === null || endMinutes === null) {
        return null;
    }
    
    let totalMinutes;
    if (endMinutes < startMinutes) {
        // Overnight shift
        totalMinutes = (24 * 60 - startMinutes) + endMinutes;
    } else if (endMinutes === startMinutes) {
        // 24-hour shift
        totalMinutes = 24 * 60;
    } else {
        // Normal shift
        totalMinutes = endMinutes - startMinutes;
    }
    
    return totalMinutes / 60;
}

function closeTimePicker() {
    const modal = document.getElementById('timePickerModal');
    modal.style.display = 'none';
    modal.classList.remove('scheduled-mode');
    timePickerState.currentDay = null;
    timePickerState.currentField = null;
    timePickerState.timeInput = '';
    timePickerState.isPrePopulated = false;  // Reset flag
}

function timeInput(digit) {
    const display = document.getElementById('timeDisplay');
    if (display.textContent === 'INVALID') {
        timePickerState.timeInput = '';
    }
    
    // If this is pre-populated time, clear it on first keypress
    if (timePickerState.isPrePopulated) {
        timePickerState.timeInput = '';
        timePickerState.isPrePopulated = false;
    }
    
    if (timePickerState.timeInput.length < 5) {
        timePickerState.timeInput += digit;
        updateTimeDisplay();
    }
}

function timeBackspace() {
    const display = document.getElementById('timeDisplay');
    if (display.textContent === 'INVALID') {
        timePickerState.timeInput = '';
        updateTimeDisplay();
        return;
    }
    
    if (timePickerState.timeInput.length > 0) {
        timePickerState.timeInput = timePickerState.timeInput.slice(0, -1);
        updateTimeDisplay();
    }
}

function timeClear() {
    const display = document.getElementById('timeDisplay');
    if (display.textContent === 'INVALID') {
        timePickerState.timeInput = '';
        updateTimeDisplay();
        return;
    }
    
    timePickerState.timeInput = '';
    updateTimeDisplay();
}

function toggleAmPm(period) {
    const display = document.getElementById('timeDisplay');
    if (display.textContent === 'INVALID') {
        timePickerState.timeInput = '';
        updateTimeDisplay();
        return;
    }
    
    timePickerState.isAm = (period === 'am');
    updateAmPmButtons();
    updateTimeDisplay();
}

function updateAmPmButtons() {
    const amBtn = document.getElementById('amBtn');
    const pmBtn = document.getElementById('pmBtn');
    
    if (timePickerState.isAm) {
        amBtn.classList.add('active');
        pmBtn.classList.remove('active');
    } else {
        amBtn.classList.remove('active');
        pmBtn.classList.add('active');
    }
}

function updateTimeDisplay() {
    const display = document.getElementById('timeDisplay');
    
    if (timePickerState.timeInput.length === 0) {
        display.textContent = timePickerState.isAm ? '12:00 AM' : '12:00 PM';
        return;
    }
    
    let timeArray = ['0', '0', '0', '0'];
    let input = timePickerState.timeInput;
    
    if (input.length === 1) {
        timeArray[1] = input[0];
    } else if (input.length === 2) {
        timeArray[1] = input[0];
        timeArray[2] = input[1];
    } else if (input.length === 3) {
        timeArray[1] = input[0];
        timeArray[2] = input[1];
        timeArray[3] = input[2];
    } else if (input.length >= 4) {
        let recentDigits = input.slice(-4);
        timeArray[0] = recentDigits[0];
        timeArray[1] = recentDigits[1];
        timeArray[2] = recentDigits[2];
        timeArray[3] = recentDigits[3];
    }
    
    let hours = timeArray[0] + timeArray[1];
    let minutes = timeArray[2] + timeArray[3];
    
    display.textContent = `${hours}:${minutes} ${timePickerState.isAm ? 'AM' : 'PM'}`;
}

function setTime() {
    let timeText;
    let isValid = true;
    
    if (timePickerState.timeInput.length === 0) {
        timeText = timePickerState.isAm ? '12:00 AM' : '12:00 PM';
    } else {
        let timeArray = ['0', '0', '0', '0'];
        let input = timePickerState.timeInput;
        
        if (input.length === 1) {
            timeArray[1] = input[0];
        } else if (input.length === 2) {
            timeArray[1] = input[0];
            timeArray[2] = input[1];
        } else if (input.length === 3) {
            timeArray[1] = input[0];
            timeArray[2] = input[1];
            timeArray[3] = input[2];
        } else if (input.length >= 4) {
            let recentDigits = input.slice(-4);
            timeArray[0] = recentDigits[0];
            timeArray[1] = recentDigits[1];
            timeArray[2] = recentDigits[2];
            timeArray[3] = recentDigits[3];
        }
        
        let hours = parseInt(timeArray[0] + timeArray[1]);
        let minutes = parseInt(timeArray[2] + timeArray[3]);
        
        if (hours > 12 || hours === 0 || minutes > 59) {
            document.getElementById('timeDisplay').textContent = 'INVALID';
            isValid = false;
            return;
        }
        
        let formattedHours = hours.toString().padStart(2, '0');
        let formattedMinutes = minutes.toString().padStart(2, '0');
        timeText = `${formattedHours}:${formattedMinutes} ${timePickerState.isAm ? 'AM' : 'PM'}`;  // ← FIX THIS LINE
    }
    
    if (isValid) {
        updateTimeField(timeText);
        closeTimePicker();
    }
}

function setTimeOff() {
    // Set both start and end to OFF for the day
    const dayCards = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
    };
    
    const dayNumber = dayCards[timePickerState.currentDay];
    const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
    
    if (dayCard) {
        const startField = dayCard.querySelector('.time-field.start');
        const endField = dayCard.querySelector('.time-field.end');
        const breakField = dayCard.querySelector('.time-field.break');
        const totalField = dayCard.querySelector('.time-field.total');
        
        // Update DOM and set blue styling for all fields
        if (startField) {
            startField.textContent = 'OFF';
            startField.setAttribute('data-state', 'off');
        }
        if (endField) {
            endField.textContent = 'OFF';
            endField.setAttribute('data-state', 'off');
        }
       if (breakField) {
    breakField.setAttribute('data-state', 'off');
    // CLEAR BREAK VALUE AND DISPLAY
    breakField.classList.remove('has-value');
    breakField.innerHTML = '';
}
        if (totalField) {
            totalField.textContent = '00.00';
            totalField.setAttribute('data-state', 'off');
        }
        // Day number stays normal - no OFF state styling
        
        // Update job data
        const job = jobs.find(j => j.id === currentJobId);
        if (job) {
            const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
            
            if (!shiftsData[dayNumber]) {
                shiftsData[dayNumber] = { start: 'START', end: 'END', total: '00.00' };
            }
            
            shiftsData[dayNumber].start = 'OFF';
shiftsData[dayNumber].end = 'OFF';
shiftsData[dayNumber].total = '00.00';
shiftsData[dayNumber].break = 0;  // ← ADD THIS LINE
            
            // Save back to job
            setShiftsForActiveWeek(job, currentSubTab, shiftsData);
            
            updateNextShiftForJob(job);
            renderJobs();
            saveData();
            
            // Update Quick Schedule since today's shifts may have changed
            updateQuickScheduleOnShiftChange();
        }
    }
    
    closeTimePicker();
}

function setTimeNone() {
    const defaultText = timePickerState.currentField === 'start' ? 'START' : 'END';
    updateTimeField(defaultText);
    closeTimePicker();
}

// === TIME FIELD UPDATE ===
function updateTimeField(timeText) {
    const dayCards = {
        'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
        'friday': 5, 'saturday': 6, 'sunday': 0
    };
    
    const dayNumber = dayCards[timePickerState.currentDay];
    const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
    
    if (dayCard) {
        const field = dayCard.querySelector(`.time-field.${timePickerState.currentField}`);
        const startField = dayCard.querySelector('.time-field.start');
        const endField = dayCard.querySelector('.time-field.end');
        const breakField = dayCard.querySelector('.time-field.break');
        const totalField = dayCard.querySelector('.time-field.total');
        
        if (field) {
            const job = jobs.find(j => j.id === currentJobId);
            
            if (job) {
                const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
                
                if (!shiftsData[dayNumber]) {
                    shiftsData[dayNumber] = { start: 'START', end: 'END', total: '00.00' };
                }
                
                const currentStartValue = shiftsData[dayNumber].start;
                const currentEndValue = shiftsData[dayNumber].end;
                const otherField = timePickerState.currentField === 'start' ? 'end' : 'start';
                const otherFieldElement = dayCard.querySelector(`.time-field.${otherField}`);
                const otherCurrentValue = shiftsData[dayNumber][otherField];
                
                shiftsData[dayNumber][timePickerState.currentField] = timeText;
                field.textContent = timeText;
                
                if (timeText !== 'OFF' && otherCurrentValue === 'OFF') {
                    const otherDefaultText = otherField === 'start' ? 'START' : 'END';
                    shiftsData[dayNumber][otherField] = otherDefaultText;
                    if (otherFieldElement) {
                        otherFieldElement.textContent = otherDefaultText;
                        otherFieldElement.removeAttribute('data-state');
                    }
                }
                
                setShiftsForActiveWeek(job, currentSubTab, shiftsData);
                
                const finalStartValue = shiftsData[dayNumber].start;
                const finalEndValue = shiftsData[dayNumber].end;
                const bothOff = finalStartValue === 'OFF' && finalEndValue === 'OFF';
                
                if (bothOff) {
                    if (startField) startField.setAttribute('data-state', 'off');
                    if (endField) endField.setAttribute('data-state', 'off');
                    if (breakField) breakField.setAttribute('data-state', 'off');
                    if (totalField) totalField.setAttribute('data-state', 'off');
                } else {
                    if (startField) startField.removeAttribute('data-state');
                    if (endField) endField.removeAttribute('data-state');
                    if (breakField) breakField.removeAttribute('data-state');
                    if (totalField) totalField.removeAttribute('data-state');
                }
                
                const startTime = finalStartValue;
                const endTime = finalEndValue;
                const hasValidStart = startTime && startTime !== 'START' && parseTimeToMinutes(startTime) !== null;
                const hasValidEnd = endTime && endTime !== 'END' && parseTimeToMinutes(endTime) !== null;
                
                if (hasValidStart && hasValidEnd) {
                    const startMinutes = parseTimeToMinutes(startTime);
                    const endMinutes = parseTimeToMinutes(endTime);
                    
                    if (endMinutes < startMinutes) {
                        overnightShiftState.pendingData = { dayNumber, job, shiftsData };
                        showOvernightConfirmation(startTime, endTime);
                        return;
                    }
                }
                
                calculateAndUpdateShift(job, dayNumber, dayCard, false, shiftsData);
            }
        }
    }
}

// === HELPER: Parse time to minutes ===
function parseTimeToMinutes(timeStr) {
    if (!timeStr || timeStr === 'START' || timeStr === 'END' || timeStr === 'OFF') {
        return null;
    }
    
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return hours * 60 + minutes;
}

function calculateAndUpdateShift(job, dayNumber, dayCard, isOvernightConfirmed = false, shiftsData = null) {
    if (!shiftsData) {
        shiftsData = getShiftsForActiveWeek(job, currentSubTab);
    }
    
    const startTime = shiftsData[dayNumber].start;
    const endTime = shiftsData[dayNumber].end;
    const hasValidStart = startTime && startTime !== 'START' && parseTimeToMinutes(startTime) !== null;
    const hasValidEnd = endTime && endTime !== 'END' && parseTimeToMinutes(endTime) !== null;
    
    if (hasValidStart && hasValidEnd) {
        const startMinutes = parseTimeToMinutes(startTime);
        const endMinutes = parseTimeToMinutes(endTime);
        let totalMinutes;
        
        if (endMinutes >= startMinutes || isOvernightConfirmed) {
            if (endMinutes >= startMinutes) {
                totalMinutes = endMinutes - startMinutes;
            } else {
                totalMinutes = (24 * 60) - startMinutes + endMinutes;
            }
            shiftsData[dayNumber].total = minutesToHoursDisplay(totalMinutes);
        } else {
            shiftsData[dayNumber].total = '00.00';
        }
    } else {
        shiftsData[dayNumber].total = '00.00';
    }
    
    const totalField = dayCard.querySelector('.time-field.total');
    if (totalField) {
        totalField.textContent = shiftsData[dayNumber].total;
    }
    
    setShiftsForActiveWeek(job, currentSubTab, shiftsData);
    updateNextShiftForJob(job);
    saveData();
}

// === OVERNIGHT SHIFT HANDLING ===
function showOvernightConfirmation(startTime, endTime) {
    document.getElementById('overnightTimes').textContent = `${startTime} to ${endTime}`;
    document.getElementById('overnightModal').style.display = 'flex';
}

function confirmOvernightShift() {
    if (overnightShiftState.pendingData) {  // Changed from overnightShiftData.dayNumber
        const { dayNumber, job, shiftsData } = overnightShiftState.pendingData;  // Destructure the data
        
        if (!job) return;
        
        const startTime = shiftsData[dayNumber].start;
        const endTime = shiftsData[dayNumber].end;
        const breakMinutes = shiftsData[dayNumber].break || 0;
        
        const hasValidStart = startTime && startTime !== 'START' && parseTimeToMinutes(startTime) !== null;
        const hasValidEnd = endTime && endTime !== 'END' && parseTimeToMinutes(endTime) !== null;
        
        if (hasValidStart && hasValidEnd) {
            const startMinutes = parseTimeToMinutes(startTime);
            const endMinutes = parseTimeToMinutes(endTime);
            let totalMinutes;
            
            totalMinutes = (24 * 60) - startMinutes + endMinutes;
            totalMinutes = Math.max(0, totalMinutes - breakMinutes);
            
            shiftsData[dayNumber].total = minutesToHoursDisplay(totalMinutes);
        } else {
            shiftsData[dayNumber].total = '00.00';
        }
        
        const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
        const totalField = dayCard ? dayCard.querySelector('.time-field.total') : null;
        if (totalField) {
            totalField.textContent = shiftsData[dayNumber].total;
        }
        
        setShiftsForActiveWeek(job, currentSubTab, shiftsData);
        updateNextShiftForJob(job);
        saveData();
        updateTotalHoursDisplay();
    }
    
    document.getElementById('overnightModal').style.display = 'none';
    overnightShiftState.pendingData = null;  // Clear the pending data
}

function rejectOvernightShift() {
    if (overnightShiftState.pendingData) {
        const { dayNumber, job, shiftsData } = overnightShiftState.pendingData;
        
        if (job && dayNumber !== null) {
            const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
            
            if (dayCard) {
                // Clear the end time field back to default
                const endField = dayCard.querySelector('.time-field.end');
                if (endField) {
                    endField.textContent = 'END';
                    endField.removeAttribute('data-state');
                }
                
                // Update the data
                shiftsData[dayNumber].end = 'END';
                shiftsData[dayNumber].total = '00.00';
                
                // Update total field
                const totalField = dayCard.querySelector('.time-field.total');
                if (totalField) {
                    totalField.textContent = '00.00';
                }
                
                // Save changes
                setShiftsForActiveWeek(job, currentSubTab, shiftsData);
                updateNextShiftForJob(job);
                saveData();
                updateTotalHoursDisplay();
            }
        }
    }
    
    // Close the modal and clear pending data
    document.getElementById('overnightModal').style.display = 'none';
    overnightShiftState.pendingData = null;
}

// === TIME UTILITIES ===
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

function minutesToHoursDisplay(totalMinutes) {
    if (totalMinutes === null || totalMinutes < 0) return '00.00';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const decimalHours = hours + (minutes / 60);
    
    // Format with leading zero for single digit hours
    return decimalHours.toFixed(2).padStart(5, '0');
}