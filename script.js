/* script.js (完整版 - 新增音乐播放逻辑) */

// --- 1. Global Settings ---
const unlockTime = new Date('2025-11-01T02:47:00');
const PAGE_DEPTH_STEP = -2000;
const PARTICLE_COUNT = 60;
const FLAME_CHARS = ['*', '^', '\'', '.', '~', '|', '(', ')', '/'];
const FLAME_INTERVAL_MS = 100;
const FIREWORK_COLORS = ['#FF4136', '#FFDC00', '#0074D9', '#2ECC40', '#B10DC9', '#FFFFFF', '#FF851B'];
const INITIAL_FIREWORK_COUNT = 6;
const FIREWORK_INTERVAL_MIN = 1300;
const FIREWORK_INTERVAL_MAX = 2300;
const ROCKET_DURATION_MS = 1100;
const TYPING_SPEED_MS = 40; // Typing speed

// --- 2. State Variables ---
let currentPageIndex = 0; let isAnimating = false; let isUnlocked = false;
let finalPageIndex = 0; let particlePool = []; let particleIndex = 0;
let asciiFlameInterval = null; let fireworkEmitterInterval = null;
let typingTimeout = null;
let originalAsciiArt = ''; 

// --- 3. Get HTML Elements ---
const world = document.getElementById('world');
const enterButton = document.getElementById('enter-button');
const pages = document.querySelectorAll('.page'); const depths = [];
const body = document.body; const torch = document.getElementById('torch');
const particleContainer = document.getElementById('particle-container');
const asciiArtElement = document.getElementById('ascii-art-typing'); 
// (NEW) Get Audio Elements
const explosionSound = document.getElementById('explosion-sound');
const bgMusic = document.getElementById('bg-music');
const musicControl = document.getElementById('music-control');

// --- 4. Dynamic Page Initialization ---
function initializePages() {
    console.log(`Detected ${pages.length} pages.`); finalPageIndex = pages.length - 1;
    pages.forEach((page, index) => {
        if (page.id === 'animation-1' && asciiArtElement) {
            originalAsciiArt = asciiArtElement.innerHTML || '';
            asciiArtElement.innerHTML = ''; 
        }
        const depth = index * PAGE_DEPTH_STEP; depths.push(depth); page.style.transform = `translateZ(${depth}px)`;
    });
    createParticlePool();
}
// Create Particle Pool
function createParticlePool() {
    if (!particleContainer) return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement('div'); p.className = 'particle-base';
        particleContainer.appendChild(p);
        p.addEventListener('animationend', () => { p.style.animationName = 'none'; p.style.opacity = '0'; p.className = 'particle-base'; p.style.top = ''; p.style.left = ''; });
        particlePool.push(p);
    }
}
initializePages();

// --- 5. Countdown Logic ---
const timerDisplay = document.getElementById('timer-display');
const waitingText = document.getElementById('waiting-text');
const countdownContainer = document.getElementById('countdown');
const countdownInterval = setInterval(updateCountdown, 1000);
function updateCountdown() {
    if (isUnlocked) { clearInterval(countdownInterval); return; }
    const now = new Date(); const distance = unlockTime - now;
    if (distance < 0) {
        clearInterval(countdownInterval); isUnlocked = true;
        countdownContainer.classList.add('is-hidden'); waitingText.classList.add('is-hidden');
        enterButton.style.opacity = '1'; enterButton.style.pointerEvents = 'auto'; return;
    }
    const days=Math.floor(distance/(1000*60*60*24)), hours=Math.floor((distance%(1000*60*60*24))/(1000*60*60)), minutes=Math.floor((distance%(1000*60*60))/(1000*60)), seconds=Math.floor((distance% (1000*60))/1000);
    timerDisplay.innerHTML = `${days} 天 ${String(hours).padStart(2,'0')} 时 ${String(minutes).padStart(2,'0')} 分 ${String(seconds).padStart(2,'0')} 秒`;
}
updateCountdown();


// --- 6. Core Navigation Function ---
function moveToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= depths.length) return;
    if (isAnimating || pageIndex === currentPageIndex) return;
    isAnimating = true;
    if (currentPageIndex === finalPageIndex && pageIndex !== finalPageIndex) {
        body.classList.remove('final-page-active');
        if (asciiFlameInterval) { clearInterval(asciiFlameInterval); asciiFlameInterval = null; const f=document.getElementById('ascii-flame'); if(f) f.textContent=' '; }
        if (fireworkEmitterInterval) { clearTimeout(fireworkEmitterInterval); fireworkEmitterInterval = null; }
        const msg = document.getElementById('wish-message'); if(msg) msg.classList.remove('is-lit');
    } else if (currentPageIndex === pages.length - 3 && pageIndex !== pages.length - 3) { 
        stopTypingAnimation();
    }
    currentPageIndex = pageIndex; const targetZ = -depths[pageIndex]; world.style.transform = `translateZ(${targetZ}px)`;
}
world.addEventListener('transitionend', () => {
    isAnimating = false;
    if (currentPageIndex === finalPageIndex) {
        body.classList.add('final-page-active');
        stopTypingAnimation();
    } else if (currentPageIndex === pages.length - 2) {
        body.classList.remove('final-page-active');
        startTypingAnimation('ascii-art-typing', originalAsciiArt, TYPING_SPEED_MS);
    } else {
        body.classList.remove('final-page-active');
        stopTypingAnimation();
    }
});

// --- 7. Scroll Event Listener ---
function handleScroll(event) { if (!isUnlocked || isAnimating) return; event.preventDefault(); const scrollDelta = event.deltaY; if (scrollDelta > 0) moveToPage(currentPageIndex + 1); else if (scrollDelta < 0) moveToPage(currentPageIndex - 1); }
window.addEventListener('wheel', handleScroll, { passive: false });

// --- 8. Button Event Listeners ---
const coverPage = document.getElementById('cover-page');
// (⬇️⬇️⬇️ Updated enterButton click listener ⬇️⬇️⬇️)
enterButton.addEventListener('click', () => {
    
    // --- (NEW) Start Background Music ---
    if (bgMusic) {
        bgMusic.volume = 0.5; // 设置一个合适的音量 (50%)
        bgMusic.play().catch(error => {
            console.error("背景音乐播放失败 (可能需要用户再次交互):", error);
        });
        
        // 显示音乐控件
        if (musicControl) {
            musicControl.style.display = 'flex'; // (改为 'flex' 来居中)
            musicControl.classList.add('is-playing');
        }
    }
    // --- (End New Code) ---

    if (coverPage) coverPage.classList.add('is-opening-portal');
    moveToPage(1);
});
const allNavButtons = document.querySelectorAll('.nav-button');
allNavButtons.forEach(button => { button.addEventListener('click', () => { if (button.classList.contains('next')) moveToPage(currentPageIndex + 1); else if (button.classList.contains('prev')) moveToPage(currentPageIndex - 1); }); });

// --- 9. Calendar Card Click ---
const calendarCard = document.getElementById('calendar-card');
if (calendarCard) { calendarCard.addEventListener('click', function() { calendarCard.classList.toggle('is-flipped'); }); }


// --- 10. Particle Torch Logic ---
function launchParticle(x, y, options = {}) {
    if (particlePool.length === 0) return null;
    let p = particlePool[particleIndex]; if (!p) return null;
    const currentAnimation = p.style.animationName; if (currentAnimation && currentAnimation !== 'none') { p.style.animation = 'none'; p.offsetHeight; }
    p.style.opacity = '0'; p.className = 'particle-base'; p.style.transition = 'none';
    const xOffset = (options.spreadX || 0) * (Math.random() - 0.5); const yOffset = (options.spreadY || 0) * (Math.random() - 0.5);
    p.style.left = (x + xOffset) + 'px'; p.style.top = (y + yOffset) + 'px';
    const randomX = (Math.random() - 0.5) * (options.randomXRange || 60); p.style.setProperty('--random-x', randomX + 'px');
    const randomXExplosion = (Math.random() - 0.5) * (options.randomXExplosionRange || 450); const randomYExplosion = (Math.random() - 0.5) * (options.randomYExplosionRange || 450);
    p.style.setProperty('--random-x-explosion', randomXExplosion + 'px'); p.style.setProperty('--random-y-explosion', randomYExplosion + 'px');
    p.style.backgroundColor = options.color || (Math.random() > 0.3 ? '#FFA500' : '#FFC500');
    p.classList.add(options.className || 'particle');
    requestAnimationFrame(() => {
        p.style.opacity = '1';
        if (options.isRocket) {
            const durationMs = options.durationMs || ROCKET_DURATION_MS; const startTime = performance.now(); const startY = parseFloat(p.style.top); const endY = options.finalTop; let ended = false;
            function rocketMove(currentTime) {
                if (ended) return; const elapsed = currentTime - startTime; const progress = Math.min(elapsed / durationMs, 1); const easedProgress = progress * (2 - progress);
                p.style.top = startY + (endY - startY) * easedProgress + 'px';
                if (progress >= 1) { ended = true; p.style.animationName = 'rocket-fade-out'; p.style.animationPlayState = 'running'; if (options.onEnd) { options.onEnd(p); } }
                else { requestAnimationFrame(rocketMove); }
            } requestAnimationFrame(rocketMove);
        } else {
            p.style.animationName = options.animationName || 'particle-spark'; p.style.animationDuration = options.duration || '1s'; p.style.animationTimingFunction = options.timingFunc || 'ease-out';
            p.style.animationFillMode = 'forwards'; p.style.animationIterationCount = '1'; p.style.animationDelay = options.delay ? `${Math.random() * options.delay}s` : '0s'; p.style.animationPlayState = 'running';
        }
    });
    particleIndex = (particleIndex + 1) % PARTICLE_COUNT; return p;
}
window.addEventListener('mousemove', (e) => { if (torch) { torch.style.left = e.clientX + 'px'; torch.style.top = e.clientY + 'px'; if (body.classList.contains('final-page-active')) launchParticle(e.clientX, e.clientY); }});
window.addEventListener('touchmove', (e) => { if (torch) { const touch = e.touches[0]; torch.style.left = touch.clientX + 'px'; torch.style.top = touch.clientY + 'px'; if (body.classList.contains('final-page-active')) { e.preventDefault(); launchParticle(touch.clientX, touch.clientY); }}}, { passive: false });
window.addEventListener('touchstart', (e) => { if (body.classList.contains('final-page-active') && torch) torch.style.opacity = '1'; });
window.addEventListener('touchend', (e) => { if (torch) torch.style.opacity = '0'; });


// --- 11. ASCII Candle Lighting Logic ---
const wickSpan = document.getElementById('ascii-wick');
const flameSpan = document.getElementById('ascii-flame');
const wishMessage = document.getElementById('wish-message');

if (wickSpan && flameSpan && wishMessage) {
    function lightCandle() {
        if (asciiFlameInterval) return; // Already lit
        console.log('ASCII Candle Lit! Starting effects...'); wishMessage.classList.add('is-lit');
        asciiFlameInterval = setInterval(() => { const i = Math.floor(Math.random() * FLAME_CHARS.length); flameSpan.textContent = FLAME_CHARS[i]; }, FLAME_INTERVAL_MS);
        // Launch initial burst
        for(let i=0; i < INITIAL_FIREWORK_COUNT; i++) { setTimeout(() => launchFirework(), i * 150); }
        // Start continuous emitter
        if (fireworkEmitterInterval) clearTimeout(fireworkEmitterInterval);
        function scheduleNextFirework() { launchFirework(); const delay = FIREWORK_INTERVAL_MIN + Math.random() * (FIREWORK_INTERVAL_MAX - FIREWORK_INTERVAL_MIN); fireworkEmitterInterval = setTimeout(scheduleNextFirework, delay); }
        fireworkEmitterInterval = setTimeout(scheduleNextFirework, FIREWORK_INTERVAL_MAX); console.log('Continuous firework emitter started.');
    }
    wickSpan.addEventListener('mouseover', lightCandle); wickSpan.addEventListener('click', lightCandle); wickSpan.addEventListener('touchstart', lightCandle);
}

// --- 12. Firework Launch and Explosion Logic ---
function launchFirework() {
    const startX = window.innerWidth * (0.3 + Math.random() * 0.4); const startY = window.innerHeight - 30;
    const targetYPercent = 20 + Math.random() * 35; const finalTop = window.innerHeight * (targetYPercent / 100);
    const rocketDurationMs = ROCKET_DURATION_MS + Math.random() * 300;
    const rocketEndCallback = (rocket) => { const finalX = rocket.offsetLeft + rocket.offsetWidth / 2; const finalY = rocket.offsetTop + rocket.offsetHeight / 2; explodeFirework(finalX, finalY); };
    launchParticle(startX, startY, { isRocket: true, className: 'particle-rocket', durationMs: rocketDurationMs, timingFunc: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', color: 'white', finalTop: finalTop, onEnd: rocketEndCallback });
}

function explodeFirework(x, y) {
    
    // --- (NEW) Play explosion sound ---
    if (explosionSound) {
        explosionSound.currentTime = 0; // Rewind to start
        explosionSound.play().catch(error => { console.error("Explosion sound play failed:", error); });
    }
    // --- (End New Code) ---

    const sparks = 30 + Math.floor(Math.random() * 15);
    for (let i = 0; i < sparks; i++) {
        const randomColor = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
        launchParticle(x, y, { className: 'particle-spark-colored', animationName: 'spark-explode-fall', duration: `${1.3 + Math.random() * 0.7}s`, timingFunc: 'ease-out', color: randomColor, spreadX: 25, spreadY: 25, randomXExplosionRange: 500, randomYExplosionRange: 500, delay: 0.3 });
    }
}

// --- 13. JS Typing Effect Logic ---
function startTypingAnimation(elementId, textToType, speed) {
    const element = document.getElementById(elementId);
    if (!element || typingTimeout) return; 
    element.innerHTML = ''; 
    element.style.borderRight = '.15em solid white'; 
    let charIndex = 0;
    let currentHTML = '';
    let inTag = false;

    function typeChar() {
        if (charIndex < textToType.length) {
            const char = textToType.charAt(charIndex);
            if (char === '<') inTag = true;
            currentHTML += char; 
            if (char === '>') inTag = false;
            element.innerHTML = currentHTML;
            charIndex++;
            const delay = inTag ? 0 : speed + (Math.random() - 0.5) * (speed * 0.5);
            typingTimeout = setTimeout(typeChar, delay);
        } else {
            typingTimeout = null; 
            element.style.borderRight = 'none'; 
            console.log('Typing animation finished for', elementId);
        }
    }
    typeChar(); 
}

function stopTypingAnimation() {
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
        if (asciiArtElement && originalAsciiArt) {
            asciiArtElement.innerHTML = originalAsciiArt; 
        }
        console.log('Typing animation stopped.');
    }
    if (asciiArtElement) asciiArtElement.style.borderRight = 'none';
}


// --- 15. (NEW) Music Control Logic ---
if (musicControl && bgMusic) {
    musicControl.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play();
            musicControl.textContent = '🎵';
            musicControl.classList.remove('is-muted');
        } else {
            bgMusic.pause();
            musicControl.textContent = '🔇';
            musicControl.classList.add('is-muted');
        }
    });
}