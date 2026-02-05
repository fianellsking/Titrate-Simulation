const state = {
    isDropping: false,
    vAdded: 0,
    timer: null,
    targetAcidConc: 0,
    currentSpeed: 100
};

function randomizeAcid() {
    state.targetAcidConc = (Math.random() * (0.45 - 0.05) + 0.05).toFixed(3);
    document.getElementById('acidConcDisp').value = state.targetAcidConc;
}

function getPH(vBase) {
    const cb = parseFloat(document.getElementById('baseConc').value) || 0.1;
    const ca = parseFloat(state.targetAcidConc);
    const av = parseFloat(document.getElementById('acidVol').value) || 25;
    const molA = (ca * av) / 1000;
    const molB = (cb * vBase) / 1000;
    const totalV_L = (av + vBase) / 1000;

    if (molA > molB) {
        const excessH = (molA - molB) / totalV_L;
        return -Math.log10(excessH);
    } else if (Math.abs(molA - molB) < 0.0000001) {
        return 7.00;
    } else {
        const excessOH = (molB - molA) / totalV_L;
        return 14 - (-Math.log10(excessOH));
    }
}

function updateColor(ph) {
    const indicator = document.getElementById('indicatorType').value;
    const flaskLiq = document.getElementById('liquid-flask');
    
    if (indicator === 'phenolphthalein') {
        if (ph <= 8.3) flaskLiq.style.background = "rgba(225, 240, 255, 0.7)";
        else {
            const intensity = Math.min((ph - 8.3) / 1.7, 1);
            flaskLiq.style.background = `rgba(255, 20, 147, ${0.4 + (intensity * 0.5)})`; 
        }
    } else if (indicator === 'bromothymolBlue') {
        if (ph < 6.0) flaskLiq.style.background = "rgba(255, 255, 0, 0.6)";
        else if (ph <= 7.6) flaskLiq.style.background = "rgba(0, 255, 0, 0.6)";
        else flaskLiq.style.background = "rgba(0, 0, 255, 0.6)";
    } else if (indicator === 'methylRed') {
        if (ph < 4.4) flaskLiq.style.background = "rgba(255, 0, 0, 0.6)";
        else if (ph <= 6.2) flaskLiq.style.background = "rgba(255, 165, 0, 0.6)";
        else flaskLiq.style.background = "rgba(255, 255, 0, 0.6)";
    }
}

function step() {
    let dropSize = 0.05;
    const currentPH = getPH(state.vAdded);
    if (currentPH > 3.5 && currentPH < 10.5) {
        dropSize = 0.005;
        if (state.currentSpeed !== 250) {
            clearInterval(state.timer);
            state.timer = setInterval(step, 250);
            state.currentSpeed = 250;
        }
    }
    state.vAdded += dropSize;
    const ph = getPH(state.vAdded);
    document.getElementById('disp-vol').innerText = state.vAdded.toFixed(3);
    document.getElementById('disp-ph').innerText = ph.toFixed(2);
    updateColor(ph);
    document.getElementById('liquid-burette').style.height = Math.max(90 - (state.vAdded * 1.5), 0) + "%";
}

const startTitration = () => {
    state.isDropping = true;
    document.getElementById('drop-particle').classList.add('is-dropping');
    document.querySelector('.flask-shape').classList.add('is-mixing'); // เริ่มแกว่ง
    state.timer = setInterval(step, 100);
};

const stopTitration = () => {
    state.isDropping = false;
    document.getElementById('drop-particle').classList.remove('is-dropping');
    document.querySelector('.flask-shape').classList.remove('is-mixing'); // หยุดแกว่ง
    clearInterval(state.timer);
    state.currentSpeed = 100;
};

document.getElementById('titrate-btn').addEventListener('mousedown', startTitration);
window.addEventListener('mouseup', stopTitration);

document.getElementById('showConc').addEventListener('change', function() {
    document.getElementById('acidConcDisp').className = this.checked ? 'conc-visible' : 'conc-hidden';
});

function resetLab() {
    stopTitration();
    state.vAdded = 0;
    randomizeAcid();
    document.getElementById('showConc').checked = false;
    document.getElementById('acidConcDisp').className = 'conc-hidden';
    document.getElementById('disp-vol').innerText = "0.000";
    const initialPH = getPH(0);
    document.getElementById('disp-ph').innerText = initialPH.toFixed(2);
    updateColor(initialPH);
    document.getElementById('liquid-burette').style.height = "90%";
}

document.getElementById('reset-btn').addEventListener('click', resetLab);
document.getElementById('acidVol').addEventListener('input', () => {
    if (!state.isDropping) {
        const ph = getPH(0);
        document.getElementById('disp-ph').innerText = ph.toFixed(2);
        updateColor(ph);
    }
});

window.onload = resetLab;