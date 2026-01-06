// === BREAK.JS ===
// Manages break time selection modal with save functionality

// === BREAK STATE ===
let breakState = {
    currentDay: null,
    currentMinutes: 15,
    isOpen: false
};

// === INITIALIZATION ===
function initializeBreakSystem() {
    console.log('🚀 Initializing Break System...');
    injectBreakStyles();
    createBreakModal();
    attachBreakClickHandlers();
    console.log('✅ Break System initialized');
}

// === INJECT STYLES ===
function injectBreakStyles() {
    if (document.getElementById('break-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'break-styles';
    style.textContent = `
        /* Break Modal Overlay */
        .break-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: #000000;
            background-color: rgb(0, 0, 0);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .break-modal-overlay.show {
            display: flex;
        }

        /* Break Modal Content */
        .break-modal-content {
            background: var(--bg2);
            border: var(--b) solid var(--border);
            border-radius: var(--r);
            width: 100%;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            overflow: hidden;
        }

        /* Break Modal Header */
        .break-modal-header {
            background: var(--bg1);
            color: var(--text1);
            padding: 12px;
            font-weight: 700;
            font-size: 14px;
            text-align: center;
            border-bottom: var(--b) solid var(--border);
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Break Settings Card */
        .break-settings-card {
            background: var(--bg3);
            overflow: hidden;
        }

        /* Preset Row */
        .break-preset-row {
            height: 32px;
            display: flex;
            border-bottom: var(--b) solid var(--border);
        }

        .break-preset-btn {
            flex: 1;
            background: var(--bg3);
            border-right: var(--b) solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            color: var(--text1);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .break-preset-btn:last-child {
            border-right: none;
        }

        .break-preset-btn:hover {
            background: var(--bg2);
        }

        .break-preset-btn.active {
            background: var(--primary);
            color: var(--text1);
        }

        /* Readout Row */
        .break-readout-row {
            height: 56px;
            background: var(--bg1);
            border-bottom: var(--b) solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }

        .break-readout-time {
            font-size: 32px;
            font-weight: 700;
            color: var(--primary);
            line-height: 1;
        }

        .break-readout-label {
            font-size: 9px;
            font-weight: 600;
            color: var(--text3);
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Adjustment Row */
        .break-adjustment-row {
            height: 32px;
            display: flex;
            border-bottom: var(--b) solid var(--border);
        }

        .break-adjustment-btn {
            flex: 1;
            background: var(--bg3);
            border-right: var(--b) solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            color: var(--text1);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .break-adjustment-btn:last-child {
            border-right: none;
        }

        .break-adjustment-btn:hover {
            background: var(--bg2);
        }

        .break-adjustment-btn:active {
            transform: scale(0.95);
        }

        /* Break Modal Footer */
        .break-modal-footer {
            display: flex;
            gap: var(--gap);
            padding: 12px;
        }

        .break-modal-btn {
            flex: 1;
            background: var(--bg4);
            border: var(--b) solid var(--border);
            border-radius: var(--r);
            padding: 10px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
            color: var(--text1);
        }

        .break-modal-btn:hover {
            background: var(--bg3);
        }

        .break-modal-btn.save {
            background: var(--primary);
            color: var(--text1);
        }

        .break-modal-btn.save:hover {
            opacity: 0.9;
        }

       /* Make break fields clickable */
.time-field.break {
    cursor: none !important;
    transition: all 0.2s ease;
}

.time-field.break:none {
    background: rgba(72, 169, 13, 0.2) !important;
}

/* Disable break field when shift is OFF */
.time-field.break[data-state="off"] {
    cursor: default !important;
    pointer-events: none !important;
}

.time-field.break[data-state="off"]:hover {
    background: transparent !important;
}
    `;
    document.head.appendChild(style);
}

// === CREATE MODAL ===
function createBreakModal() {
    if (document.getElementById('breakModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'breakModal';
    modal.className = 'break-modal-overlay';
    modal.innerHTML = `
        <div class="break-modal-content">
            <div class="break-modal-header">Break Time</div>
            
            <div class="break-settings-card">
                <!-- Preset Row -->
                <div class="break-preset-row">
                    <div class="break-preset-btn" data-minutes="0">None</div>
                    <div class="break-preset-btn" data-minutes="15">15m</div>
                    <div class="break-preset-btn" data-minutes="30">30m</div>
                    <div class="break-preset-btn" data-minutes="45">45m</div>
                    <div class="break-preset-btn" data-minutes="60">1h</div>
                </div>

                <!-- Readout Display -->
                <div class="break-readout-row">
                    <div class="break-readout-time" id="breakReadoutTime">15</div>
                    <div class="break-readout-label">Minutes</div>
                </div>

                <!-- Adjustment Row -->
                <div class="break-adjustment-row">
                    <div class="break-adjustment-btn" data-adjust="-10">-10</div>
                    <div class="break-adjustment-btn" data-adjust="-5">-5</div>
                    <div class="break-adjustment-btn" data-adjust="5">+5</div>
                    <div class="break-adjustment-btn" data-adjust="10">+10</div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="break-modal-footer">
                <button class="break-modal-btn cancel">Cancel</button>
                <button class="break-modal-btn save">Save Break</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✅ Break modal created and added to DOM');
    attachBreakModalHandlers();
}

// === ATTACH MODAL HANDLERS ===
function attachBreakModalHandlers() {
    const modal = document.getElementById('breakModal');
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBreakPicker();
        }
    });
    
    // Preset buttons
    document.querySelectorAll('.break-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.break-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            breakState.currentMinutes = parseInt(btn.dataset.minutes);
            updateBreakDisplay();
        });
    });
    
    // Adjustment buttons
    document.querySelectorAll('.break-adjustment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const adjust = parseInt(btn.dataset.adjust);
            breakState.currentMinutes += adjust;
            breakState.currentMinutes = Math.max(0, Math.min(999, breakState.currentMinutes));
            updateBreakDisplay();
            document.querySelectorAll('.break-preset-btn').forEach(b => b.classList.remove('active'));
        });
    });
    
    // Cancel button
    modal.querySelector('.break-modal-btn.cancel').addEventListener('click', closeBreakPicker);
    
    // Save button - NOW FUNCTIONAL!
    modal.querySelector('.break-modal-btn.save').addEventListener('click', saveBreakTime);
}

// === ATTACH CLICK HANDLERS TO BREAK FIELDS ===
function attachBreakClickHandlers() {
    console.log('⚙️ Attaching break field click handlers...');
    
    // Use event delegation from document level
    document.addEventListener('click', (e) => {
        // Find break field (could be the target itself or a parent)
        let breakField = null;
        if (e.target.classList && e.target.classList.contains('time-field') && e.target.classList.contains('break')) {
            breakField = e.target;
        } else if (e.target.closest) {
            breakField = e.target.closest('.time-field.break');
        }
        
        if (!breakField) return;
        
        const dayCard = breakField.closest('.day-card');
        if (!dayCard) return;
        
        const dayNumber = parseInt(dayCard.dataset.day);
        
        // Check if the shift is OFF - don't do anything
        const job = jobs.find(j => j.id === currentJobId);
        if (!job) return;
        
        const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
        const dayShift = shiftsData[dayNumber];
        
        // Don't do anything if both start and end are OFF
        if (dayShift && dayShift.start === 'OFF' && dayShift.end === 'OFF') {
            console.log('⚠️ Shift is OFF - break interaction blocked');
            return;
        }
        
        // Check which view mode we're in
        const content = document.querySelector('#jobEntryWindow .content');
        const isSimpleView = content && content.classList.contains('simple-view');
        
        if (isSimpleView) {
            // SIMPLE VIEW: Cycle through values
            console.log('🔄 Simple view: cycling break value');
            cycleSimpleViewBreak(dayNumber);
        } else {
            // STANDARD/DETAILED VIEW: Open modal
            console.log('📱 Standard view: opening break modal');
            openBreakPicker(dayNumber);
        }
    }, true);
    
    console.log('✅ Break field click handlers attached');
}

// === SIMPLE VIEW BREAK CYCLING ===
function cycleSimpleViewBreak(dayNumber) {
    const job = jobs.find(j => j.id === currentJobId);
    if (!job) return;
    
    const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
    
    if (!shiftsData[dayNumber]) {
        shiftsData[dayNumber] = { start: 'START', end: 'END', total: '0.0H', break: 0 };
    }
    
    const dayShift = shiftsData[dayNumber];
    const values = [0, 5, 60, 120];
    const currentValue = dayShift.break || 0;
    const currentIndex = values.indexOf(currentValue);
    const nextIndex = (currentIndex + 1) % values.length;
    const nextValue = values[nextIndex];
    
    console.log(`🔄 Cycling break for day ${dayNumber}: ${currentValue} -> ${nextValue}`);
    
    // Update shift data
    dayShift.break = nextValue;
    
    // Recalculate total
    recalculateDayTotal(job, currentSubTab, dayNumber);
    
    // Update display
    updateSimpleViewBreakDisplay(dayNumber, nextValue);
    
    // Save
    setShiftsForActiveWeek(job, currentSubTab, shiftsData);
    saveData();
    updateTotalHoursDisplay();
    updateNextShiftForJob(job);
}

function updateSimpleViewBreakDisplay(dayNumber, value) {
    const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
    if (!dayCard) return;
    
    const breakField = dayCard.querySelector('.time-field.break');
    if (!breakField) return;
    
    if (value === 0) {
        breakField.classList.remove('has-value');
        breakField.innerHTML = '';
    } else {
        breakField.classList.add('has-value');
        breakField.innerHTML = `<div class="break-value-box">${value}</div>`;
    }
}

// === OPEN BREAK PICKER ===
function openBreakPicker(dayNumber) {
    console.log('🔓 Opening break picker for day:', dayNumber);
    
    breakState.currentDay = dayNumber;
    breakState.isOpen = true;
    
    // Load existing break value if available
    const job = jobs.find(j => j.id === currentJobId);
    if (job) {
        const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
        const dayShift = shiftsData[dayNumber];
        
        if (dayShift && dayShift.break !== undefined) {
            breakState.currentMinutes = dayShift.break;
        } else {
            breakState.currentMinutes = 0;
        }
    } else {
        breakState.currentMinutes = 0;
    }
    
    // Update display
    updateBreakDisplay();
    
    // Update preset buttons
    document.querySelectorAll('.break-preset-btn').forEach(btn => {
        if (parseInt(btn.dataset.minutes) === breakState.currentMinutes) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show modal
    const modal = document.getElementById('breakModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        console.log('✅ Break modal displayed');
    } else {
        console.error('❌ Break modal not found!');
    }
}

// === CLOSE BREAK PICKER ===
function closeBreakPicker() {
    console.log('🔒 Closing break picker');
    breakState.isOpen = false;
    breakState.currentDay = null;
    const modal = document.getElementById('breakModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// === SAVE BREAK TIME ===
function saveBreakTime() {
    const dayNumber = breakState.currentDay;
    const breakMinutes = breakState.currentMinutes;
    
    console.log(`💾 Saving break: ${breakMinutes} minutes for day ${dayNumber}`);
    
    // Get current job and shift data
    const job = jobs.find(j => j.id === currentJobId);
    if (!job) {
        console.error('❌ No job found');
        closeBreakPicker();
        return;
    }
    
    const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
    
    // Initialize shift data if it doesn't exist
    if (!shiftsData[dayNumber]) {
        shiftsData[dayNumber] = { start: 'START', end: 'END', total: '00.00', break: 0 };
    }
    
    // Save break value
    shiftsData[dayNumber].break = breakMinutes;
    
    // Recalculate total hours with break deducted
    recalculateDayTotal(job, currentSubTab, dayNumber);
    
   // Update the break field display
const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
if (dayCard) {
    const breakField = dayCard.querySelector('.time-field.break');
    if (breakField) {
        const content = document.querySelector('#jobEntryWindow .content');
        const isSimpleView = content && content.classList.contains('simple-view');
        
        if (isSimpleView) {
            // Simple view: Use new design with box
            if (breakMinutes === 0) {
                breakField.classList.remove('has-value');
                breakField.innerHTML = '';
            } else {
                breakField.classList.add('has-value');
                breakField.innerHTML = `<div class="break-value-box">${breakMinutes}</div>`;
            }
        } else {
            // Standard/Full view: Use old text display
            if (breakMinutes === 0) {
                breakField.textContent = 'BREAK';
            } else {
                breakField.textContent = `${breakMinutes}m`;
            }
        }
    }
}
    
    // Save and update displays
    setShiftsForActiveWeek(job, currentSubTab, shiftsData);
    saveData();
    updateTotalHoursDisplay();
    updateNextShiftForJob(job);
    
    console.log('✅ Break saved successfully');
    closeBreakPicker();
}

// === RECALCULATE DAY TOTAL (with break deduction) ===
function recalculateDayTotal(job, shiftType, dayNumber) {
    const shiftsData = getShiftsForActiveWeek(job, shiftType);
    const dayShift = shiftsData[dayNumber];
    
    if (!dayShift) return;
    
    const startTime = dayShift.start;
    const endTime = dayShift.end;
    const breakMinutes = dayShift.break || 0;
    
    // Check if we have valid start and end times
    const hasValidStart = startTime && startTime !== 'START' && startTime !== 'OFF' && parseTimeToMinutes(startTime) !== null;
    const hasValidEnd = endTime && endTime !== 'END' && endTime !== 'OFF' && parseTimeToMinutes(endTime) !== null;
    
    if (hasValidStart && hasValidEnd) {
        const startMinutes = parseTimeToMinutes(startTime);
        const endMinutes = parseTimeToMinutes(endTime);
        let totalMinutes;
        
        // Calculate work time
        if (endMinutes >= startMinutes) {
            totalMinutes = endMinutes - startMinutes;
        } else {
            // Overnight shift
            totalMinutes = (24 * 60) - startMinutes + endMinutes;
        }
        
        // Deduct break time
        totalMinutes = Math.max(0, totalMinutes - breakMinutes);
        
        // Update total
        shiftsData[dayNumber].total = minutesToHoursDisplay(totalMinutes);
        
        // Update DOM
        const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
        if (dayCard) {
            const totalField = dayCard.querySelector('.time-field.total');
            if (totalField) {
                totalField.textContent = shiftsData[dayNumber].total;
            }
        }
    }
}

// === UPDATE DISPLAY ===
function updateBreakDisplay() {
    const minutes = Math.floor(breakState.currentMinutes);
    const timeDisplay = document.getElementById('breakReadoutTime');
    if (timeDisplay) {
        timeDisplay.textContent = minutes;
    }
}

// === AUTO-INITIALIZE ===
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBreakSystem);
} else {
    initializeBreakSystem();
    
    // === SIMPLE VIEW BREAK CYCLING ===
function initSimpleViewBreakCycling() {
    console.log('🔄 Initializing simple view break cycling...');
    
    document.addEventListener('click', (e) => {
        // Only handle clicks in simple view
        const content = document.querySelector('#jobEntryWindow .content');
        if (!content || !content.classList.contains('simple-view')) {
            return;
        }
        
        const breakField = e.target.closest('.time-field.break');
        if (!breakField) return;
        
        const dayCard = breakField.closest('.day-card');
        if (!dayCard) return;
        
        const dayNumber = parseInt(dayCard.dataset.day);
        const job = jobs.find(j => j.id === currentJobId);
        
        if (!job) return;
        
        // Check if shift is OFF
        const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
        const dayShift = shiftsData[dayNumber];
        
        if (dayShift && dayShift.start === 'OFF' && dayShift.end === 'OFF') {
            console.log('⚠️ Shift is OFF - break cycling blocked');
            return;
        }
        
        cycleSimpleViewBreak(dayNumber);
    }, true);
    
    console.log('✅ Simple view break cycling initialized');
}

function cycleSimpleViewBreak(dayNumber) {
    const job = jobs.find(j => j.id === currentJobId);
    if (!job) return;
    
    const shiftsData = getShiftsForActiveWeek(job, currentSubTab);
    
    if (!shiftsData[dayNumber]) {
        shiftsData[dayNumber] = { start: 'START', end: 'END', total: '0.0H', break: 0 };
    }
    
    const dayShift = shiftsData[dayNumber];
    const values = [0, 5, 60, 120];
    const currentValue = dayShift.break || 0;
    const currentIndex = values.indexOf(currentValue);
    const nextIndex = (currentIndex + 1) % values.length;
    const nextValue = values[nextIndex];
    
    console.log(`🔄 Cycling break for day ${dayNumber}: ${currentValue} -> ${nextValue}`);
    
    // Update shift data
    dayShift.break = nextValue;
    
    // Recalculate total
    recalculateDayTotal(job, currentSubTab, dayNumber);
    
    // Update display
    updateSimpleViewBreakDisplay(dayNumber, nextValue);
    
    // Save
    setShiftsForActiveWeek(job, currentSubTab, shiftsData);
    saveData();
    updateTotalHoursDisplay();
    updateNextShiftForJob(job);
}

function updateSimpleViewBreakDisplay(dayNumber, value) {
    const dayCard = document.querySelector(`[data-day="${dayNumber}"]`);
    if (!dayCard) return;
    
    const breakField = dayCard.querySelector('.time-field.break');
    if (!breakField) return;
    
    if (value === 0) {
        breakField.classList.remove('has-value');
        breakField.innerHTML = '';
    } else {
        breakField.classList.add('has-value');
        breakField.innerHTML = `<div class="break-value-box">${value}</div>`;
    }
}

// Initialize when Break system loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimpleViewBreakCycling);
} else {
    initSimpleViewBreakCycling();
}
    
}