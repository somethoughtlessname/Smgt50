// === SPLASH.JS ===
// Manages splash screen animations on app startup

const SplashSystem = {
    // === CONFIGURATION ===
    config: {
        enabled: true,
        type: 'circle', // 'circle' or 'puzzle'
        duration: 3, // 2, 3, 4, or 5 seconds
        loop: false // Loop until tapped
    },

    /**
     * Get colors from CSS variables
     */
    getColors() {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        
        return [
            style.getPropertyValue('--job-color-green').trim() || '#48a971',
            style.getPropertyValue('--job-color-blue').trim() || '#5A8DB8',
            style.getPropertyValue('--job-color-purple').trim() || '#8a7ca8',
            style.getPropertyValue('--job-color-red').trim() || '#B85A7C',
            style.getPropertyValue('--job-color-orange').trim() || '#B8835A',
            style.getPropertyValue('--job-color-teal').trim() || '#5AB8A8',
            style.getPropertyValue('--job-color-gold').trim() || '#A8A85A',
            style.getPropertyValue('--job-color-brown').trim() || '#A8875A'
        ];
    },

    /**
     * Initialize and show splash screen
     */
    initialize() {
        if (!this.config.enabled) {
            this.hideSplash();
            return;
        }

        console.log('🎨 Initializing Splash System...');
        this.injectStyles();
        this.createSplashContainer();
        
        // Add click handler for tap-to-close (especially for loop mode)
        const container = document.getElementById('splashContainer');
        if (container) {
            container.style.cursor = 'pointer';
            container.addEventListener('click', () => {
                console.log('💥 Splash tapped - closing');
                this.hideSplash();
            });
        }
        
        if (this.config.type === 'circle') {
            this.runCircleSplash();
        } else if (this.config.type === 'puzzle') {
            this.runPuzzleSplash();
        }

        // Hide splash after duration ONLY if NOT in loop mode
        if (!this.config.loop) {
            setTimeout(() => {
                this.hideSplash();
            }, this.config.duration * 1000);
        } else {
            // Loop mode: restart animation after it completes
            setTimeout(() => {
                // Clear container and restart
                const container = document.getElementById('splashContainer');
                if (container) {
                    container.innerHTML = '';
                    if (this.config.type === 'circle') {
                        this.runCircleSplash();
                    } else if (this.config.type === 'puzzle') {
                        this.runPuzzleSplash();
                    }
                    // Recursive call to keep looping
                    setTimeout(() => {
                        if (this.config.loop && document.getElementById('splashContainer')) {
                            this.initialize();
                        }
                    }, 100);
                }
            }, this.config.duration * 1000);
        }

        console.log('✅ Splash System initialized' + (this.config.loop ? ' (LOOP MODE)' : ''));
    },

    /**
     * Inject CSS styles for splash animations
     */
    injectStyles() {
        if (document.getElementById('splash-styles')) return;

        const style = document.createElement('style');
        style.id = 'splash-styles';
        style.textContent = `
            #splashContainer {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--bg3);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.3s ease-out;
                cursor: pointer;
            }

            .splash-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            /* ===== CIRCLE SPLASH ===== */
            .calendar-grid {
                display: grid;
                grid-template-columns: repeat(3, 60px);
                grid-template-rows: repeat(3, 60px);
                gap: 8px;
                margin-bottom: 40px;
            }

            .calendar-cell {
                border-radius: 12px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                animation: cellPop 0.4s ease-out, cellFloat 2s ease-in-out infinite;
            }

            @keyframes cellPop {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 0;
                }
                100% {
                    transform: scale(1) rotate(360deg);
                    opacity: 1;
                }
            }

            @keyframes cellFloat {
                0%, 100% {
                    transform: translateY(0px);
                }
                50% {
                    transform: translateY(-10px);
                }
            }

            .calendar-cell:nth-child(1) { animation-delay: 0s, 0.1s; }
            .calendar-cell:nth-child(2) { animation-delay: 0.05s, 0.3s; }
            .calendar-cell:nth-child(3) { animation-delay: 0.1s, 0.5s; }
            .calendar-cell:nth-child(4) { animation-delay: 0.15s, 0.7s; }
            .calendar-cell:nth-child(5) { animation-delay: 0.2s, 0.9s; }
            .calendar-cell:nth-child(6) { animation-delay: 0.25s, 1.1s; }
            .calendar-cell:nth-child(7) { animation-delay: 0.3s, 1.3s; }
            .calendar-cell:nth-child(8) { animation-delay: 0.35s, 1.5s; }
            .calendar-cell:nth-child(9) { animation-delay: 0.4s, 1.7s; }

            .app-title {
                font-size: 40px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
                text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                transition: opacity 0.4s ease-in-out;
            }

            .app-subtitle {
                font-size: 14px;
                font-weight: 500;
                color: var(--text1);
                letter-spacing: 1px;
                text-transform: uppercase;
                transition: opacity 0.4s ease-in-out;
            }

            /* ===== PUZZLE SPLASH ===== */
            .puzzle-container {
                width: 220px;
                height: 220px;
                position: relative;
                margin-bottom: 60px;
            }

            .puzzle-piece {
                position: absolute;
                width: 66px;
                height: 66px;
                transform-style: preserve-3d;
                perspective: 1000px;
            }

            .puzzle-piece-inner {
                width: 100%;
                height: 100%;
                position: relative;
                transform-style: preserve-3d;
                transition: transform 0.6s ease-in-out;
            }

            .puzzle-piece-front,
            .puzzle-piece-back {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid #000000;
                border-radius: 4px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                backface-visibility: hidden;
            }

            .puzzle-piece-front {
                background: #ffffff;
            }

            .puzzle-piece-back {
                transform: rotateY(180deg);
            }

            .puzzle-piece.center .puzzle-piece-back {
                background: #ffffff !important;
            }

            /* Card flip glitch */
            .puzzle-piece-back::before,
            .puzzle-piece-back::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 4px;
                opacity: 0;
                pointer-events: none;
            }

            .puzzle-piece.flip-glitch .puzzle-piece-back::before {
                background: inherit;
                left: 2px;
                top: 0;
                mix-blend-mode: screen;
                animation: cardGlitchLeft 0.5s ease-in-out;
            }

            .puzzle-piece.flip-glitch .puzzle-piece-back::after {
                background: inherit;
                left: -2px;
                top: 0;
                mix-blend-mode: screen;
                animation: cardGlitchRight 0.5s ease-in-out;
            }

            @keyframes cardGlitchLeft {
                0%, 100% { opacity: 0; transform: translate(0, 0); }
                20% { opacity: 0.8; transform: translate(-5px, 2px); }
                40% { opacity: 0.6; transform: translate(3px, -1px); }
                60% { opacity: 0.7; transform: translate(-2px, 1px); }
                80% { opacity: 0.4; transform: translate(2px, -2px); }
            }

            @keyframes cardGlitchRight {
                0%, 100% { opacity: 0; transform: translate(0, 0); }
                25% { opacity: 0.7; transform: translate(5px, -2px); }
                45% { opacity: 0.6; transform: translate(-3px, 1px); }
                65% { opacity: 0.8; transform: translate(2px, -1px); }
                85% { opacity: 0.5; transform: translate(-2px, 2px); }
            }

            /* Split pieces for final animation */
            .puzzle-piece-split {
                position: absolute;
                width: 66px;
                height: 66px;
                border: 3px solid #000000;
                border-radius: 4px;
                opacity: 0;
                pointer-events: none;
                will-change: transform;
            }

            /* Shake animation */
            @keyframes intenseShake {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(-4px, 2px) scale(1.02); }
                66% { transform: translate(4px, -2px) scale(0.98); }
            }

            .puzzle-piece.pre-split-glitch {
                animation: intenseShake 0.3s ease-in-out;
            }

            /* ===== TITLE GLITCH ===== */
            .app-title-glitch {
                position: relative;
            }

            .app-title-glitch::before,
            .app-title-glitch::after {
                content: attr(data-text);
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                color: white;
            }

            .app-title-glitch::before {
                clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
                animation: glitchTop 2.4s ease-in-out infinite;
            }

            .app-title-glitch::after {
                clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
                animation: glitchBottom 2.4s ease-in-out infinite;
            }

            @keyframes glitchTop {
    0%, 100% {
        transform: translate(0, 0);
        text-shadow: 3px 0 var(--job-color-red);
    }
    10% {
        transform: translate(-5px, 0);
        text-shadow: 5px 0 var(--job-color-red), 10px 0 var(--job-color-green);
    }
    15% {
        transform: translate(4px, 0);
        text-shadow: -4px 0 var(--job-color-red), -8px 0 var(--job-color-green);
    }
    20% {
        transform: translate(0, 0);
        text-shadow: 3px 0 var(--job-color-red);
    }
    62% {
        transform: translate(-3px, 0);
        text-shadow: 3px 0 var(--job-color-red), 6px 0 var(--job-color-green);
    }
    67% {
        transform: translate(0, 0);
        text-shadow: 3px 0 var(--job-color-red);
    }
}

           @keyframes glitchBottom {
    0%, 100% {
        transform: translate(0, 0);
        text-shadow: -3px 0 var(--job-color-blue);
    }
    10% {
        transform: translate(5px, 0);
        text-shadow: -5px 0 var(--job-color-blue), -10px 0 var(--job-color-green);
    }
    15% {
        transform: translate(-4px, 0);
        text-shadow: 4px 0 var(--job-color-blue), 8px 0 var(--job-color-green);
    }
    20% {
        transform: translate(0, 0);
        text-shadow: -3px 0 var(--job-color-blue);
    }
    62% {
        transform: translate(3px, 0);
        text-shadow: -3px 0 var(--job-color-blue), -6px 0 var(--job-color-green);
    }
    67% {
        transform: translate(0, 0);
        text-shadow: -3px 0 var(--job-color-blue);
    }
}

           @keyframes glitchMain {
    0%, 100% {
        transform: translate(0);
        text-shadow: none;
    }
    10% {
        transform: translate(-5px, 0);
        text-shadow: 5px 0 var(--job-color-blue), 10px 0 var(--job-color-green);
    }
    15% {
        transform: translate(4px, 0);
        text-shadow: -4px 0 var(--job-color-red), -8px 0 var(--job-color-blue);
    }
    20% {
        transform: translate(0);
        text-shadow: none;
    }
    62% {
        transform: translate(-3px, 0);
        text-shadow: 3px 0 var(--job-color-green), 6px 0 var(--job-color-red);
    }
    67% {
        transform: translate(0);
        text-shadow: none;
    }
}
        `;
        document.head.appendChild(style);
    },

    /**
     * Create splash container
     */
    createSplashContainer() {
        let container = document.getElementById('splashContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'splashContainer';
            document.body.appendChild(container);
        }
        container.style.display = 'flex';
    },

    /**
     * Run circle splash animation
     */
    runCircleSplash() {
        const container = document.getElementById('splashContainer');
        if (!container) return;

        const colors = this.getColors();
        container.innerHTML = `
            <div class="splash-content">
                <div class="calendar-grid" id="calendarGrid"></div>
                <h1 class="app-title app-title-glitch app-title-glitch-main" data-text="SHIFT HAPPENS">SHIFT HAPPENS</h1>
                <p class="app-subtitle">good luck!</p>
            </div>
        `;

        const grid = document.getElementById('calendarGrid');
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.style.background = colors[i % colors.length];
            grid.appendChild(cell);
        }
    },

    /**
     * Run puzzle splash animation with flip effect
     */
    runPuzzleSplash() {
        const container = document.getElementById('splashContainer');
        if (!container) return;

        const colors = this.getColors();
        const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

        const positions = [
            { x: 0, y: 0 }, { x: 77, y: 0 }, { x: 154, y: 0 },
            { x: 0, y: 77 }, { x: 77, y: 77 }, { x: 154, y: 77 },
            { x: 0, y: 154 }, { x: 77, y: 154 }, { x: 154, y: 154 }
        ];

        container.innerHTML = `
            <div class="splash-content">
                <div class="puzzle-container" id="puzzleContainer"></div>
                <h1 class="app-title app-title-glitch app-title-glitch-main" data-text="SHIFT HAPPENS">SHIFT HAPPENS</h1>
                <p class="app-subtitle" id="splashTagline" style="opacity: 0;">good luck!</p>
            </div>
        `;

        const puzzleContainer = document.getElementById('puzzleContainer');
        const title = container.querySelector('.app-title');
        const tagline = document.getElementById('splashTagline');

        // Generate random off-screen starting positions
        const startPositions = positions.map(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 800 + Math.random() * 400;
            return {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                rotation: Math.random() * 720 - 360
            };
        });

        // Create randomized flip order (excluding center piece)
        const nonCenterIndices = [0, 1, 2, 3, 5, 6, 7, 8];
        const randomFlipOrder = [...nonCenterIndices].sort(() => Math.random() - 0.5);

        const pieces = [];

        // Create all pieces with split pieces
        positions.forEach((pos, i) => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            if (i === 4) piece.classList.add('center');

            const colorIndex = i < 4 ? i : i - 1;
            const color = i === 4 ? '#ffffff' : shuffledColors[colorIndex];

            piece.innerHTML = `
                <div class="puzzle-piece-inner">
                    <div class="puzzle-piece-front"></div>
                    <div class="puzzle-piece-back" style="background: ${color};"></div>
                </div>
            `;

            // Start from far off-screen
            piece.style.left = startPositions[i].x + 'px';
            piece.style.top = startPositions[i].y + 'px';
            piece.style.transform = `rotate(${startPositions[i].rotation}deg) scale(1)`;

            puzzleContainer.appendChild(piece);

            // Pre-create split pieces (2-5 random splits)
            const numSplits = 2 + Math.floor(Math.random() * 4);
            const splits = [];
            
            for (let s = 0; s < numSplits; s++) {
                const splitPiece = document.createElement('div');
                splitPiece.className = 'puzzle-piece-split';
                
                // 1/3 chance to switch to a different random color
                let splitColor = color;
                if (Math.random() < 0.33) {
                    const randomColorIndex = Math.floor(Math.random() * shuffledColors.length);
                    splitColor = shuffledColors[randomColorIndex];
                }
                
                splitPiece.style.background = splitColor;
                splitPiece.style.left = pos.x + 'px';
                splitPiece.style.top = pos.y + 'px';
                
                // Create clip path for this strip
                const topPercent = s * 100 / numSplits;
                const bottomPercent = (s + 1) * 100 / numSplits;
                splitPiece.style.clipPath = `polygon(0 ${topPercent}%, 100% ${topPercent}%, 100% ${bottomPercent}%, 0 ${bottomPercent}%)`;
                
                puzzleContainer.appendChild(splitPiece);
                splits.push(splitPiece);
            }

            pieces.push({
                element: piece,
                inner: piece.querySelector('.puzzle-piece-inner'),
                splits: splits,
                finalX: pos.x,
                finalY: pos.y,
                startX: startPositions[i].x,
                startY: startPositions[i].y,
                startRotation: startPositions[i].rotation,
                index: i
            });
        });

        const ms = this.config.duration * 1000;

        // Timing percentages
        const flyInEnd = ms * 0.10;
        const titleAppear = ms * 0.11;
        const flipStart = ms * 0.13;
        const flipEnd = ms * 0.50;
        const taglineAppear = ms * 0.48;
        const preShakeStart = ms * 0.52;
        const flyOutStart = ms * 0.60;
        const taglineFadeOut = ms * 0.68;
        const titleFadeOut = ms * 0.85;

        // PHASE 1: Fly in
        setTimeout(() => {
            pieces.forEach(p => {
                p.element.style.transition = `all ${flyInEnd}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
                p.element.style.left = p.finalX + 'px';
                p.element.style.top = p.finalY + 'px';
                p.element.style.transform = 'rotate(0deg) scale(1)';
            });
        }, 50);

        // PHASE 2: Title appears
        setTimeout(() => {
            if (title) title.style.opacity = '1';
        }, titleAppear);

        // PHASE 3: Flip cards one by one with glitch
        const totalFlipTime = flipEnd - flipStart - 600;
        const delayBetweenFlips = totalFlipTime / 8;

        setTimeout(() => {
            randomFlipOrder.forEach((pieceIndex, flipIndex) => {
                setTimeout(() => {
                    pieces[pieceIndex].inner.style.transform = 'rotateY(180deg)';
                    
                    // Add glitch effect after flip completes
                    setTimeout(() => {
                        pieces[pieceIndex].element.classList.add('flip-glitch');
                        setTimeout(() => {
                            pieces[pieceIndex].element.classList.remove('flip-glitch');
                        }, 500);
                    }, 600);
                }, flipIndex * delayBetweenFlips);
            });
        }, flipStart);

        // PHASE 4: Tagline appears after flips
        setTimeout(() => {
            if (tagline) tagline.style.opacity = '1';
        }, taglineAppear);

        // PHASE 5: Pre-split shake
        setTimeout(() => {
            pieces.forEach((p, idx) => {
                setTimeout(() => p.element.classList.add('pre-split-glitch'), idx * 40);
            });
        }, preShakeStart);

        // PHASE 6: Split & fly with continuous shake - optimized
        setTimeout(() => {
            pieces.forEach(p => {
                p.element.style.opacity = '0';
                p.splits.forEach(split => {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const dist = 1000 + Math.random() * 400;
                    const sx = 2.5 + Math.random() * 2;
                    
                    // Random chance to grow taller (about 1/3 of pieces)
                    const shouldGrowTall = Math.random() < 0.33;
                    const sy = shouldGrowTall ? 1.5 + Math.random() * 1.5 : 1;
                    
                    split.style.opacity = '1';
                    split.style.transition = 'none';
                    
                    const startTime = Date.now();
                    const duration = 700;
                    
                    function animate() {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        
                        // Easing function (cubic-bezier approximation)
                        const eased = progress < 0.5 
                            ? 4 * progress * progress * progress 
                            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                        
                        // Calculate smooth position
                        const currentX = dir * dist * eased;
                        const currentSX = 1 + (sx - 1) * eased;
                        const currentSY = 1 + (sy - 1) * eased;
                        
                        // Add shake
                        const shakeX = (Math.random() - 0.5) * 8;
                        const shakeY = (Math.random() - 0.5) * 6;
                        const shakeRot = (Math.random() - 0.5) * 4;
                        
                        split.style.transform = `translateX(${currentX + shakeX}px) translateY(${shakeY}px) scaleX(${currentSX}) scaleY(${currentSY}) rotate(${shakeRot}deg)`;
                        
                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        }
                    }
                    
                    animate();
                });
            });
        }, flyOutStart);

        // PHASE 7: Tagline fades out
        setTimeout(() => {
            if (tagline) tagline.style.opacity = '0';
        }, taglineFadeOut);

        // PHASE 8: Title fades out
        setTimeout(() => {
            if (title) title.style.opacity = '0';
        }, titleFadeOut);
    },

    /**
     * Hide splash screen
     */
    hideSplash() {
        const container = document.getElementById('splashContainer');
        const app = document.getElementById('app');
        
        if (container) {
            container.style.opacity = '0';
            setTimeout(() => {
                container.remove();
            }, 300);
        }
        
        if (app) {
            app.style.opacity = '1';
        }

        // Also handle old splash div if it exists
        const oldSplash = document.getElementById('splash');
        if (oldSplash) {
            oldSplash.style.display = 'none';
        }
    },

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const savedData = localStorage.getItem('scheduleManagerData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.splashSettings) {
                    this.config.enabled = parsedData.splashSettings.enabled !== undefined 
                        ? parsedData.splashSettings.enabled 
                        : true;
                    this.config.type = parsedData.splashSettings.type || 'circle';
                    this.config.duration = parsedData.splashSettings.duration || 3;
                    this.config.loop = parsedData.splashSettings.loop !== undefined
                        ? parsedData.splashSettings.loop
                        : false;
                }
            }
        } catch (error) {
            console.error('❌ Failed to load splash settings:', error);
        }
    },

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const savedData = localStorage.getItem('scheduleManagerData');
            let dataToSave = savedData ? JSON.parse(savedData) : {};
            
            dataToSave.splashSettings = {
                enabled: this.config.enabled,
                type: this.config.type,
                duration: this.config.duration,
                loop: this.config.loop
            };
            
            localStorage.setItem('scheduleManagerData', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('❌ Failed to save splash settings:', error);
        }
    }
};