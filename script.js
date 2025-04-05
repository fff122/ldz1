document.addEventListener('DOMContentLoaded', () => {
    // --- Elements Selection ---
    const langButtons = document.querySelectorAll('.lang-btn');
    const textElements = document.querySelectorAll('[data-en], [data-ja], [data-zh]');
    const crimeTags = document.querySelectorAll('.crime-tag'); // Select only once
    const popupModal = document.getElementById('popup-modal');
    const modalGreeting = document.getElementById('modal-greeting');
    const modalQuestion = document.getElementById('modal-question');
    const optionA = document.getElementById('option-a');
    const optionB = document.getElementById('option-b');
    const modalFeedback = document.getElementById('modal-feedback');
    const hackedOverlay = document.getElementById('hacked-overlay');
    const hackedText = hackedOverlay.querySelector('.hacked-text');
    const globalGlitchOverlay = document.getElementById('global-glitch-overlay');
    const wantedPoster = document.querySelector('.wanted-poster');
    const glitchText = document.querySelector('.glitch-text');
    const wantedSvg = document.querySelector('.wanted-svg');
    const scanLine = document.querySelector('.scan-line');

    // --- State Variables ---
    let currentLang = 'en';
    let modalTimeout;
    let hackInitiated = false;
    let mouseX = 0, mouseY = 0;
    let posterRect = wantedPoster.getBoundingClientRect();
    let globalGlitchTimeout = null;
    let svgGlitchInterval = null;
    let textGlitchInterval = null;
    let crimeTagsTimeout = null;
    let crimeTagIntervals = []; // Store intervals for cleanup
    let crimeTagAnims = []; // Store anim instances for cleanup
    let randomScrambleInterval = null; // Store interval ID

    // --- Ticker Replacement for Smooth Mouse Interaction ---
    let mouseInteractionAFR = null; // Store the animation frame request ID

    function updateMouseInteraction() {
        // If hacked, stop requesting new frames
        if (hackInitiated) {
            // Optional: Explicitly cancel frame if needed, but stopping requests is enough
            // if (mouseInteractionAFR) cancelAnimationFrame(mouseInteractionAFR);
            return; 
        }

        crimeTags.forEach((tag) => {
            // Ensure posterRect is reasonably up-to-date 
            // (Could potentially update less frequently if performance is an issue)
            // posterRect = wantedPoster.getBoundingClientRect(); 
            
            const targetX = (mouseX / posterRect.width) * 10;
            const targetY = (mouseY / posterRect.height) * 8;
            const currentTx = parseFloat(tag.style.getPropertyValue('--mouse-tx')) || 0;
            const currentTy = parseFloat(tag.style.getPropertyValue('--mouse-ty')) || 0;
            const lerpedX = currentTx + (targetX - currentTx) * 0.08;
            const lerpedY = currentTy + (targetY - currentTy) * 0.08;
            tag.style.setProperty('--mouse-tx', `${lerpedX}px`);
            tag.style.setProperty('--mouse-ty', `${lerpedY}px`);
        });

        // Request the next animation frame
        mouseInteractionAFR = requestAnimationFrame(updateMouseInteraction);
    }

    // Start the animation loop
    mouseInteractionAFR = requestAnimationFrame(updateMouseInteraction);

    // --- Global Glitch Trigger ---
    const triggerGlobalGlitch = () => {
        if (hackInitiated) return;
        const glitchDuration = anime.random(100, 400);
        globalGlitchOverlay.classList.add('active');
        clearTimeout(globalGlitchTimeout);
        globalGlitchTimeout = setTimeout(() => {
            globalGlitchOverlay.classList.remove('active');
        }, glitchDuration);
    };
    const globalGlitchInterval = setInterval(() => {
        if (!hackInitiated && Math.random() < 0.15) {
            triggerGlobalGlitch();
        }
    }, 3000);

    // --- Language Update Function ---
    const updateLanguage = (lang) => {
        currentLang = lang;
        // Update general text elements
        document.querySelectorAll('[data-en], [data-ja], [data-zh]').forEach(element => {
             // Re-query all elements here in case some were missed initially
            if (element.dataset[lang]) {
                element.textContent = element.dataset[lang];
            }
        });
        // Ensure modal text is updated too
        if (modalGreeting && modalGreeting.dataset[lang]) modalGreeting.textContent = modalGreeting.dataset[lang];
        if (modalQuestion && modalQuestion.dataset[lang]) modalQuestion.textContent = modalQuestion.dataset[lang];
        if (optionA && optionA.dataset[lang]) optionA.textContent = optionA.dataset[lang];
        if (optionB && optionB.dataset[lang]) optionB.textContent = optionB.dataset[lang];
    };

    // --- Language Button Listeners ---
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.dataset.lang;
            langButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateLanguage(lang);
        });
    });

    // --- Interactive Crime Tags (Mouse Move) ---
    wantedPoster.addEventListener('mousemove', (e) => {
        if (hackInitiated) return;
        posterRect = wantedPoster.getBoundingClientRect();
        const posterCenterX = posterRect.left + posterRect.width / 2;
        const posterCenterY = posterRect.top + posterRect.height / 2;
        mouseX = e.clientX - posterCenterX;
        mouseY = e.clientY - posterCenterY;
    });

    // --- Crime Tags Base Animation ---
    const animateCrimeTags = () => {
        crimeTagIntervals.forEach(clearInterval); // Clear previous intervals
        crimeTagAnims.forEach(anim => anim.pause()); // Pause previous anims
        crimeTagIntervals = [];
        crimeTagAnims = [];

        crimeTags.forEach((tag, index) => {
            if (hackInitiated) return;
            const posterWidth = wantedPoster.offsetWidth;
            const posterHeight = wantedPoster.offsetHeight;
            const randomX = 50 + Math.random() * (posterWidth - 200);
            const randomY = 100 + Math.random() * (posterHeight - 200);
            tag.style.left = `${randomX}px`;
            tag.style.top = `${randomY}px`;
            tag.style.opacity = 0;

            const randomDelay = index * 0.3;
            const randomDuration = 10 + Math.random() * 12;
            const tagAnimVars = {
                targets: tag,
                opacity: [0, 0.9],
                '--base-tz': () => `${(Math.random() * 300 - 150)}px`,
                '--base-tx': () => `${(Math.random() * 50 - 25)}px`,
                '--base-ty': () => `${(Math.random() * 40 - 20)}px`,
                '--base-rx': () => `${(Math.random() * 24 - 12)}deg`,
                '--base-ry': () => `${(Math.random() * 30 - 15)}deg`,
                '--base-s': [0.9, 1.1, 1],
                duration: randomDuration * 1000,
                delay: randomDelay * 1000,
                easing: 'easeInOutSine',
                loop: true,
                direction: 'alternate'
            };
            let tagMainAnimation = anime(tagAnimVars);
            crimeTagAnims.push(tagMainAnimation);

            const tagGlitchInterval = setInterval(() => {
                if (hackInitiated) { clearInterval(tagGlitchInterval); return; }
                if (Math.random() > 0.6) {
                    anime({
                         targets: tag,
                         color: [ { value: '#ff2a6d', duration: 50 }, { value: '#05d9e8', duration: 50 }, { value: '#ff2a6d', duration: 50 } ],
                         textShadow: [ { value: '0 0 15px #ff2a6d', duration: 50 }, { value: '0 0 8px #05d9e8', duration: 50 }, { value: '0 0 5px #ff2a6d', duration: 50 } ],
                         easing: 'steps(1)'
                     });
                }
            }, 2500 + index * 400);
            crimeTagIntervals.push(tagGlitchInterval);
        });
    };

    // --- SVG Click Glitch Pulse ---
    wantedSvg.addEventListener('click', () => {
        if (hackInitiated) return;
        wantedSvg.classList.add('glitching');
        anime({
            targets: wantedSvg,
            filter: [
                { value: 'drop-shadow(0 0 15px var(--neon-pink)) brightness(1.5) contrast(1.2)', duration: 100 },
                { value: 'drop-shadow(0 0 5px var(--neon-blue)) brightness(1) contrast(1)', duration: 200 }
            ],
            scale: [
                { value: 1.03, duration: 100 },
                { value: 1, duration: 200 }
            ],
            easing: 'linear',
            complete: () => {
                 wantedSvg.classList.remove('glitching');
            }
        });
    });

    // --- Decoding Text Effect for WANTED ---
    const decodingEffect = () => {
        if (hackInitiated) return;
        const originalText = glitchText.dataset.text || "WANTED";
        const chars = "!<>-_\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        const durationPerLetter = 50;
        const totalDuration = originalText.length * durationPerLetter;
        anime.timeline({ easing: 'linear' })
            .add({
                targets: glitchText,
                duration: totalDuration,
                update: function(anim) {
                    let progressRatio = anim.progress / 100;
                    let newText = '';
                    for(let i = 0; i < originalText.length; i++) {
                        let letterProgress = Math.max(0, Math.min(1, (progressRatio * originalText.length - i)));
                        if (letterProgress >= 1) {
                            newText += originalText[i];
                        } else if (letterProgress > 0 && Math.random() > 0.1) {
                             newText += originalText[i];
                        } else {
                            newText += chars[Math.floor(Math.random() * chars.length)];
                        }
                    }
                    glitchText.textContent = newText;
                },
                complete: function(anim) {
                     glitchText.textContent = originalText;
                }
            });
    };
    const decodingInterval = setInterval(() => {
        if (!hackInitiated && Math.random() > 0.8) {
            decodingEffect();
        }
    }, 5000);

    // --- SVG and Text Glitch Effects ---
    const glitchEffect = () => {
        if(hackInitiated) return;
        anime.timeline({ easing: 'steps(1)', duration: 500 })
        .add({ targets: wantedSvg,
            translateX: [ { value: 3, duration: 50 }, { value: -3, duration: 50 }, { value: 1, duration: 50 }, { value: 0, duration: 50 } ],
            translateY: [ { value: -3, duration: 50 }, { value: 3, duration: 50 }, { value: -1, duration: 50 }, { value: 0, duration: 50 } ],
            filter: [ { value: 'brightness(2) contrast(2) hue-rotate(90deg)', duration: 50 }, { value: 'brightness(1) contrast(1) hue-rotate(0deg)', duration: 50 } ]
        });
    };
    svgGlitchInterval = setInterval(() => {
        if (hackInitiated) { clearInterval(svgGlitchInterval); return; }
        if (Math.random() > 0.7) { glitchEffect(); }
    }, 2000);

    const textGlitch = () => {
         if(hackInitiated) return;
         anime.timeline({ easing: 'steps(1)' })
        .add({ targets: glitchText,
             translateX: [ { value: 5, duration: 50 }, { value: -5, duration: 50 }, { value: 0, duration: 50 } ],
             translateY: [ { value: 5, duration: 50 }, { value: -5, duration: 50 }, { value: 0, duration: 50 } ],
             color: [ { value: '#ff2a6d', duration: 50 }, { value: '#05d9e8', duration: 50 }, { value: '#ff2a6d', duration: 50 } ],
             textShadow: [ { value: '0 0 20px #ff2a6d', duration: 50 }, { value: '0 0 10px #05d9e8', duration: 50 }, { value: '0 0 10px #ff2a6d', duration: 50 } ]
        });
    };
    textGlitchInterval = setInterval(() => {
         if (hackInitiated) { clearInterval(textGlitchInterval); return; }
         textGlitch();
    }, 3000);

    // --- Modal Logic ---
    modalTimeout = setTimeout(() => {
        if (!hackInitiated) {
            popupModal.style.display = 'flex';
            anime({ targets: '.modal-content', opacity: [0, 1], scale: [0.7, 1], duration: 500, easing: 'easeOutExpo' });
        }
    }, 10000);

    // --- Random Text Scramble Function ---
    const scrambleChars = "!<>-_\/[]{}—=+*^?#%&$@01";
    const scrambleText = (element) => {
        if (hackInitiated || !element || element.dataset.scrambling === 'true') return; // Prevent re-scramble if already running

        const originalLangKey = currentLang; // Capture language at scramble start
        const originalText = element.dataset[originalLangKey] || element.textContent; // Get original text for current lang
        const textLength = originalText.length;
        element.dataset.scrambling = 'true'; // Mark as scrambling

        anime({
            targets: element,
            duration: anime.random(300, 800), // Random duration for scramble
            easing: 'linear',
            update: function(anim) {
                let progress = anim.progress / 100;
                let scrambledText = '';
                for (let i = 0; i < textLength; i++) {
                    // Higher chance to revert to original char as progress increases
                    const revertChance = Math.pow(progress, 2); // Quadratic easing for reveal
                    if (Math.random() < revertChance) {
                        scrambledText += originalText[i] || ' ';
                    } else {
                        scrambledText += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                    }
                }
                element.textContent = scrambledText;
            },
            complete: function() {
                // Ensure text reverts correctly based on the language when scramble started
                element.textContent = element.dataset[originalLangKey] || originalText;
                delete element.dataset.scrambling; // Allow scrambling again
            }
        });
    };

    // --- Trigger Random Scramble Periodically ---
    const elementsToScramble = document.querySelectorAll('.name, .info p, .crime-tag');
    randomScrambleInterval = setInterval(() => {
        if (!hackInitiated && Math.random() < 0.2) { // 20% chance every 4 seconds
            const randomIndex = Math.floor(Math.random() * elementsToScramble.length);
            const randomElement = elementsToScramble[randomIndex];
            scrambleText(randomElement);
        }
    }, 4000);

    // --- Hacked Function (Add cleanup for scramble interval) ---
    const initiateHack = (feedbackMessageKey) => {
        if (hackInitiated) return;
        hackInitiated = true; 
        
        // Clear intervals, pause anims etc.
        clearTimeout(modalTimeout);
        clearTimeout(globalGlitchTimeout);
        clearInterval(globalGlitchInterval);
        clearInterval(svgGlitchInterval);
        clearInterval(textGlitchInterval);
        clearInterval(decodingInterval); // Make sure this interval ID is stored
        clearTimeout(crimeTagsTimeout);
        crimeTagIntervals.forEach(clearInterval);
        crimeTagAnims.forEach(anim => anim.pause());
        // The requestAnimationFrame loop will stop itself due to the hackInitiated check
        // No need to explicitly call cancelAnimationFrame unless immediate stop is critical
        globalGlitchOverlay.classList.remove('active'); 
        clearInterval(randomScrambleInterval); // Clear the random scramble interval

        // Make sure ticker is stopped (if not already handled by its internal check)
        if (mouseInteractionAFR) { 
            // It should stop itself via hackInitiated check, but explicit cancel is safer
            cancelAnimationFrame(mouseInteractionAFR); 
            mouseInteractionAFR = null; 
        }

        const feedbackMessages = {
            'a_feedback_en': 'Foolish choice... Your system will be compromised in 3...', 
            'a_feedback_ja': '愚かな選択... 3秒後にシステムが侵害されます...', 
            'a_feedback_zh': '愚蠢的选择... 你的系统将在3秒后被入侵...', 
            'b_feedback_en': 'Correct answer! Your insight is impressive... but irrelevant. System compromised.', 
            'b_feedback_ja': '正解！素晴らしい洞察力だ...だが無意味だ。システムは侵害された。', 
            'b_feedback_zh': '正确答案！你的洞察力令人印象深刻...但毫无意义。系统已被入侵。',
            'final_hack_en': '\n\n--- SYSTEM COMPROMISED BY LIU DEZHOU ---', 
            'final_hack_ja': '\n\n--- システムは劉徳洲によって侵害されました ---', 
            'final_hack_zh': '\n\n--- 系统已被刘德洲入侵 ---'
        };
        modalFeedback.textContent = feedbackMessages[`${feedbackMessageKey}_${currentLang}`] || feedbackMessages[`${feedbackMessageKey}_en`];
        modalFeedback.style.display = 'block';
        optionA.style.display = 'none';
        optionB.style.display = 'none';
        anime({ targets: modalFeedback, opacity: [0, 1], duration: 500 });
        let countdown = 3;
        if (feedbackMessageKey === 'a_feedback') {
             const countdownInterval = setInterval(() => {
                countdown--;
                modalFeedback.textContent = feedbackMessages[`${feedbackMessageKey}_${currentLang}`].replace('3...', countdown > 0 ? `${countdown}...` : '0...');
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    showHackedScreen();
                }
            }, 1000);
        } else {
             setTimeout(showHackedScreen, 2000);
        }
    };

    // --- Show Hacked Screen Function ---
    const showHackedScreen = () => {
        popupModal.style.display = 'none';
        hackedOverlay.style.display = 'flex';
        const finalHackMessages = {
            'en': '--- SYSTEM COMPROMISED BY LIU DEZHOU ---',
            'ja': '--- システムは劉徳洲によって侵害されました ---',
            'zh': '--- 系统已被刘德洲入侵 ---'
        };
        hackedText.textContent = finalHackMessages[currentLang] || finalHackMessages['en'];
        const explosionWarning = document.getElementById('explosion-warning');
        const explosionWarningMessages = {
            'en': 'Your device will explode in:',
            'ja': 'デバイスは爆発します:',
            'zh': '你的设备将在以下时间爆炸:'
        };
        explosionWarning.textContent = explosionWarningMessages[currentLang] || explosionWarningMessages['en'];
        explosionWarning.style.display = 'block';
        const countdownTimer = document.getElementById('countdown-timer');
        countdownTimer.style.display = 'block';
        let countdownValue = 20; // <<-- Setting to 15 again!
        countdownTimer.textContent = countdownValue;
        try {
            const audio = new Audio('123.flac');
            audio.play().catch(e => console.error("Audio playback failed:", e));
            audio.onerror = (e) => console.error("Audio playback error:", e);
        } catch (error) {
            console.error("Error initializing audio:", error);
        }
        let countdownTimeout;
        const tickCountdown = () => {
            countdownValue--;
            if (countdownValue >= 0) {
                countdownTimer.textContent = countdownValue;
                let nextInterval;
                if (countdownValue > 12) { // Changed from 11 to 8 for earlier acceleration
                    nextInterval = 1000;
                } else if (countdownValue > 4) {
                    nextInterval = 600;
                } else {
                    nextInterval = 300;
                }
                countdownTimeout = setTimeout(tickCountdown, nextInterval);
            } else {
                countdownTimer.textContent = "BOOM!";
                anime({
                    targets: '#hacked-overlay',
                    backgroundColor: ['#000000', '#ffffff', '#000000'],
                    opacity: [1, 0.8, 1, 0],
                    duration: 400,
                    easing: 'linear',
                    complete: () => {
                        anime.remove('body');
                        anime.remove('.wanted-poster');
                    }
                });
            }
        };
        countdownTimeout = setTimeout(tickCountdown, 1000);
        anime({ targets: [hackedOverlay, explosionWarning, countdownTimer], opacity: [0, 1], duration: 500, easing: 'linear' });
        // Re-apply body/poster glitches for the hacked state
        anime({ targets: 'body', filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)', 'hue-rotate(0deg)'], duration: 500, loop: true, direction: 'alternate', easing: 'steps(5)' }); 
        anime({ targets: '.wanted-poster', scale: [1, 1.02, 0.98, 1], translateX: [0, 5, -5, 0], duration: 200, loop: true, easing: 'linear' });
    };

    // --- Modal Option Listeners ---
    optionA.addEventListener('click', () => initiateHack('a_feedback'));
    optionB.addEventListener('click', () => initiateHack('b_feedback'));

    // --- Initial Animation Sequence ---
    const timeline = anime.timeline({
        easing: 'easeOutExpo',
    });
    timeline.add({
        targets: wantedPoster,
        opacity: [0, 1],
        translateZ: [-400, 0], // Move from back to front
        rotateX: [-90, 0],    // Rotate up from flat
        rotateY: [20, 0],     // Slight rotation from side
        scale: [0.8, 1],
        duration: 2000,
        easing: 'easeOutElastic(1, .8)'
    })
    .add({
        targets: glitchText,
        opacity: [0, 1],
        translateY: [-80, 0], // Fly down
        translateZ: [100, 0],  // Fly from closer
        rotateX: [45, 0],     // Rotate slightly
        duration: 1500,
        easing: 'easeOutBack'
    }, '-=1200') // Overlap slightly with poster animation
    .add({
        targets: wantedSvg,
        opacity: [0, 1],
        scale: [0.5, 1],
        rotateY: [-180, 0], // Flip around Y axis
        duration: 1800,
        easing: 'spring(1, 80, 10, 0)' // Springy effect
    }, '-=1000')
    .add({
        targets: '.details',
        opacity: [0, 1],
        translateX: [-50, 0],
        translateZ: [50, 0],
        skewX: [-20, 0], // Add a skew effect
        duration: 1200,
        delay: anime.stagger(150) // Stagger the paragraph appearance
    }, '-=1400');

    // --- Continuous Base Animations ---
    const scanLineAnim = anime({ targets: scanLine, translateY: ['-100%', '100%'], easing: 'linear', duration: 2000, loop: true });
    const matrixRainAnim = anime({ targets: '.photo-container::before', backgroundPosition: ['0 0', '0 8px'], easing: 'linear', duration: 500, loop: true });

    // --- Initialize Crime Tags Animation ---
    crimeTagsTimeout = setTimeout(() => { if (!hackInitiated) animateCrimeTags(); }, 2500);

    // --- Hover Effects ---
    wantedPoster.addEventListener('mouseenter', () => {
        if (hackInitiated) return;
        anime({ targets: [wantedPoster, wantedSvg], scale: 1.02, filter: 'drop-shadow(0 0 15px var(--neon-blue))', duration: 300, easing: 'easeOutQuad' });
    });
    wantedPoster.addEventListener('mouseleave', () => {
        if (hackInitiated) return;
        anime({ targets: [wantedPoster, wantedSvg], scale: 1, filter: 'drop-shadow(0 0 5px var(--neon-blue))', duration: 300, easing: 'easeOutQuad' });
    });

    // Initial language setup call
    updateLanguage(currentLang);
}); 