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
    const flask = document.getElementById('liquid-flask');
    let color = "";

    if (indicator === 'phenolphthalein') {
        // ช่วงเปลี่ยนสี: 8.3 (ใสแบบมีมิติ) - 10.0 (ชมพูม่วง)
        if (ph <= 8.3) {
            // สี "ใส" ที่ไม่ใช่แค่โปร่งใส แต่คือสีน้ำในขวดแก้ว (ฟ้าจางมากๆ)
            color = "rgba(235, 245, 255, 0.4)"; 
        } else if (ph >= 10.0) {
            color = "rgba(255, 0, 128, 0.8)"; // ชมพูบานเย็นเข้ม
        } else {
            let t = (ph - 8.3) / (10.0 - 8.3);
            // ไล่จาก ฟ้าอ่อน -> ชมพู
            let r = Math.round(235 + (20 * t)); // 235 -> 255
            let g = Math.round(245 * (1 - t));   // 245 -> 0
            let b = Math.round(255 - (127 * t)); // 255 -> 128
            let alpha = 0.4 + (0.4 * t);        // ค่อยๆ ทึบขึ้น
            color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    } 
    
    else if (indicator === 'bromothymolBlue') {
        // ช่วงเปลี่ยนสี: 6.0 (เหลือง) - 7.6 (น้ำเงิน)
        if (ph <= 6.0) {
            color = "rgba(255, 230, 0, 0.7)"; 
        } else if (ph >= 7.6) {
            color = "rgba(0, 80, 255, 0.8)";
        } else {
            let t = (ph - 6.0) / (7.6 - 6.0);
            let r = Math.round(255 * (1 - t));
            let g = Math.round(230 - (150 * t)); 
            let b = Math.round(255 * t);
            color = `rgba(${r}, ${g}, ${b}, 0.75)`;
        }
    } 
    
    else if (indicator === 'methylRed') {
        // ช่วงเปลี่ยนสี: 4.2 (แดง) - 6.2 (เหลือง)
        if (ph <= 4.2) {
            color = "rgba(255, 0, 0, 0.8)";
        } else if (ph >= 6.2) {
            color = "rgba(255, 215, 0, 0.7)";
        } else {
            let t = (ph - 4.2) / (6.2 - 4.2);
            let g = Math.round(215 * t);
            color = `rgba(255, ${g}, 0, 0.75)`;
        }
    }

    flask.style.background = color;
    // เพิ่มเอฟเฟกต์ Gradient เล็กน้อยให้น้ำดูไม่แบน
    flask.style.backgroundImage = `linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 100%)`;
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