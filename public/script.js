const socket = io();

// DOM Elements
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const downloadLinks = document.getElementById('download-links');
const statusIndicator = document.getElementById('status-indicator');
const configPanel = document.getElementById('config-panel');
const metricsPanel = document.getElementById('metrics-panel');

const minLenSlider = document.getElementById('min-len');
const maxLenSlider = document.getElementById('max-len');
const minValDisplay = document.getElementById('min-val');
const maxValDisplay = document.getElementById('max-val');

const totalCountDisplay = document.getElementById('total-count');
const cpsDisplay = document.getElementById('cps-display');
const sizeTxt = document.getElementById('size-txt');
const sizeMd = document.getElementById('size-md');
const sizePdf = document.getElementById('size-pdf');

// State
let startTime = 0;
let lastCount = 0;
let lastTime = 0;
let isRunning = false;

// Sliders UI
minLenSlider.addEventListener('input', () => {
    minValDisplay.textContent = minLenSlider.value;
    if (parseInt(minLenSlider.value) > parseInt(maxLenSlider.value)) {
        maxLenSlider.value = minLenSlider.value;
        maxValDisplay.textContent = maxLenSlider.value;
    }
});

maxLenSlider.addEventListener('input', () => {
    maxValDisplay.textContent = maxLenSlider.value;
    if (parseInt(maxLenSlider.value) < parseInt(minLenSlider.value)) {
        minLenSlider.value = maxLenSlider.value;
        minValDisplay.textContent = minLenSlider.value;
    }
});

// Character Set Construction
function getCharset() {
    let chars = '';
    if (document.getElementById('check-upper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('check-lower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('check-numbers').checked) chars += '0123456789';
    if (document.getElementById('check-symbols').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    chars += document.getElementById('custom-chars').value;
    return chars;
}

// Start
btnStart.addEventListener('click', () => {
    const charset = getCharset();
    if (!charset) {
        alert("Please select at least one character set.");
        return;
    }

    const config = {
        charset: charset,
        min: parseInt(minLenSlider.value),
        max: parseInt(maxLenSlider.value)
    };

    socket.emit('start-generation', config);
    setRunningState(true);
});

// Stop
btnStop.addEventListener('click', () => {
    socket.emit('stop-generation');
});

function setRunningState(running) {
    isRunning = running;
    if (running) {
        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
        downloadLinks.classList.add('hidden', 'opacity-0');
        downloadLinks.classList.remove('flex');

        statusIndicator.textContent = "Running";
        statusIndicator.className = "px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900 text-emerald-300 uppercase tracking-wider animate-pulse";

        configPanel.classList.add('opacity-50', 'pointer-events-none'); // Disable config
        metricsPanel.classList.remove('hidden');

        // Reset metrics
        totalCountDisplay.textContent = '0';
        sizeTxt.textContent = '0 B';
        sizeMd.textContent = '0 B';
        sizePdf.textContent = '0 B';
        startTime = Date.now();
        lastTime = Date.now();
        lastCount = 0;
    } else {
        btnStart.classList.remove('hidden');
        btnStop.classList.add('hidden');

        statusIndicator.textContent = "Stopped";
        statusIndicator.className = "px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300 uppercase tracking-wider";

        configPanel.classList.remove('opacity-50', 'pointer-events-none');
    }
}

// Socket Events
socket.on('status', (data) => {
    if (data.state === 'running') {
        setRunningState(true);
    } else if (data.state === 'stopped') {
        setRunningState(false);
    }
});

socket.on('progress', (data) => {
    totalCountDisplay.textContent = data.count.toLocaleString();

    // CPS Calculation
    const now = Date.now();
    const elapsed = now - lastTime;
    if (elapsed > 1000) {
        const countDiff = data.count - lastCount;
        const cps = countDiff / (elapsed / 1000);
        cpsDisplay.textContent = `${Math.round(cps).toLocaleString()} CPS`;
        lastTime = now;
        lastCount = data.count;
    }
});

socket.on('file-sizes', (sizes) => {
    sizeTxt.textContent = sizes.txt;
    sizeMd.textContent = sizes.md;
    sizePdf.textContent = sizes.pdf;
});

socket.on('download-ready', () => {
    downloadLinks.classList.remove('hidden');
    // Small delay to allow CSS transition
    setTimeout(() => {
        downloadLinks.classList.remove('opacity-0', 'translate-y-2');
    }, 10);
});

socket.on('error', (msg) => {
    alert("Error: " + msg);
    setRunningState(false);
});
