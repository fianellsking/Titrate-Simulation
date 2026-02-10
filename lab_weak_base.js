const state = {
    isDropping: false,
    vAdded: 0,
    timer: null,
    targetBaseConc: 0
};

const kbValues = { "NH3": 1.8e-5 };

function randomizeBase() {
    state.targetBaseConc = (Math.random() * (0.4 - 0.05) + 0.05).toFixed(3);
    document.getElementById('baseConcDisp').value = state.targetBaseConc;
}

function getPH(vAcid) {
    const ca = parseFloat(document.getElementById('acidConc').value) || 0.1;
    const cb = parseFloat(state.targetBaseConc);
    const vb = parseFloat(document.getElementById('baseVol').value) || 10;
    const kb = kbValues["NH3"];
    const kw = 1e-14;

    const molB = cb * vb;
    const molA = ca * vAcid;
    const totalV = vb + vAcid;

    // 1. ก่อนเริ่มหยดกรด
    if (vAcid <= 0) {
        const oh = Math.sqrt(kb * cb);
        return 14 + Math.log10(oh);
    }

    // 2. ช่วงบัฟเฟอร์ (เบสเหลือ > กรดที่เติม)
    if (molB > molA + 1e-9) {
        const remB = (molB - molA) / totalV;
        const salt = molA / totalV;
        const pOH = -Math.log10(kb) + Math.log10(salt / remB);
        return 14 - pOH;
    } 
    // 3. จุดสมมูล (กรดพอดีกับเบส)
    else if (Math.abs(molB - molA) < 1e-7) {
        const saltConc = molB / totalV;
        const ka = kw / kb;
        const hPlus = Math.sqrt(ka * saltConc);
        return -Math.log10(hPlus);
    } 
    // 4. หลังจุดสมมูล (กรดแก่เกิน)
    else {
        const excessH = (molA - molB) / totalV;
        return -Math.log10(excessH);
    }
}

function updateColor(ph) {
    const indicator = document.getElementById('indicatorType').value;
    const flask = document.getElementById('liquid-flask');
    let color = "rgba(230, 245, 255, 0.6)";

    if (indicator === 'phenolphthalein') {
        if (ph <= 8.3) color = "rgb(204, 239, 255)";
        else if (ph >= 10.0) color = "rgba(255, 0, 128, 0.8)";
        else {
            let t = (ph - 8.3) / (10.0 - 8.3);
            color = `rgba(${Math.round(235 + 20*t)}, ${Math.round(245*(1-t))}, ${Math.round(255 - 127*t)}, ${0.4 + 0.4*t})`;
        }
    } else if (indicator === 'bromothymolBlue') {
        if (ph <= 6.0) color = "rgba(255, 230, 0, 0.7)";
        else if (ph >= 7.6) color = "rgba(0, 80, 255, 0.8)";
        else {
            let t = (ph - 6.0) / (7.6 - 6.0);
            color = `rgba(${Math.round(255*(1-t))}, ${Math.round(230-150*t)}, ${Math.round(255*t)}, 0.75)`;
        }
    } else if (indicator === 'methylRed') {
        if (ph <= 4.2) color = "rgba(255, 0, 0, 0.7)";
        else if (ph >= 6.2) color = "rgba(255, 255, 0, 0.7)";
        else {
            let t = (ph - 4.2) / (6.2 - 4.2);
            color = `rgba(255, ${Math.round(255 * t)}, 0, 0.7)`;
        }
    }
    flask.style.background = color;
}

function step() {
    if (state.vAdded >= 50) { stopTitration(); return; }
    
    // ปรับความเร็วหยดอัตโนมัติเมื่อใกล้จุดสมมูล
    const currentPh = getPH(state.vAdded);
    let dropSize = (currentPh < 9 && currentPh > 4) ? 0.005 : 0.04;
    
    state.vAdded += dropSize;
    const ph = getPH(state.vAdded);
    
    document.getElementById('disp-vol').innerText = state.vAdded.toFixed(3);
    document.getElementById('disp-ph').innerText = ph.toFixed(2);
    updateColor(ph);
    
    const buretteLevel = 90 - (state.vAdded * 1.8);
    document.getElementById('liquid-burette').style.height = `${Math.max(0, buretteLevel)}%`;
}

const startTitration = () => {
    state.isDropping = true;
    document.getElementById('drop-particle').classList.add('is-dropping');
    document.querySelector('.flask-shape').classList.add('is-mixing');
    state.timer = setInterval(step, 40);
};

const stopTitration = () => {
    state.isDropping = false;
    document.getElementById('drop-particle').classList.remove('is-dropping');
    document.querySelector('.flask-shape').classList.remove('is-mixing');
    clearInterval(state.timer);
};

function resetLab() {
    stopTitration();
    state.vAdded = 0;
    randomizeBase();
    const initPh = getPH(0);
    document.getElementById('disp-vol').innerText = "0.000";
    document.getElementById('disp-ph').innerText = initPh.toFixed(2);
    updateColor(initPh);
    document.getElementById('liquid-burette').style.height = "90%";
    document.getElementById('showConc').checked = false;
    document.getElementById('baseConcDisp').className = 'conc-hidden';
}

document.getElementById('titrate-btn').addEventListener('mousedown', startTitration);
window.addEventListener('mouseup', stopTitration);
document.getElementById('reset-btn').addEventListener('click', resetLab);
document.getElementById('showConc').addEventListener('change', function() {
    document.getElementById('baseConcDisp').className = this.checked ? '' : 'conc-hidden';
});

window.onload = resetLab;