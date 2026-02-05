const state = {
    isDropping: false,
    vAdded: 0,
    timer: null,
    targetAcidConc: 0,
    currentSpeed: 100
};

const kbValues = { "NH3": 1.8e-5, "CH3NH2": 4.4e-4 };

// 1. สุ่มความเข้มข้นกรด (0.05 - 0.5 M)
function randomizeAcid() {
    state.targetAcidConc = (Math.random() * (0.5 - 0.05) + 0.05).toFixed(3);
    document.getElementById('acidConcDisp').value = state.targetAcidConc;
}

// 2. คำนวณ pH: หยดเบสอ่อน (บิวเรต) ลงในกรดแก่ (ขวด)
function getPH(vBase) {
    const cb = parseFloat(document.getElementById('baseConc').value) || 0.1;
    const ca = parseFloat(state.targetAcidConc);
    const av = parseFloat(document.getElementById('acidVol').value) || 25;
    const kb = kbValues[document.getElementById('baseType').value];
    const kw = 1e-14;

    const molA = ca * av;
    const molB = cb * vBase;
    const totalV = av + vBase;

    // ช่วงที่ 1: กรดแก่เหลืออยู่ (ก่อนจุดสมมูล)
    if (molA > molB) {
        const excessH = (molA - molB) / totalV;
        return -Math.log10(excessH);
    } 
    // ช่วงที่ 2: จุดสมมูล (เกิดการไฮโดรไลซิสของเกลือ)
    else if (Math.abs(molA - molB) < 0.000001) {
        const saltConc = molA / totalV;
        const ka = kw / kb;
        return -Math.log10(Math.sqrt(ka * saltConc));
    } 
    // ช่วงที่ 3: เบสอ่อนเหลือ (กลายเป็น Buffer)
    else {
        const remB = (molB - molA) / totalV;
        const salt = molA / totalV;
        const pOH = -Math.log10(kb) + Math.log10(salt / remB);
        return 14 - pOH;
    }
}

// 3. เปลี่ยนสีตาม Indicator
function updateColor(ph) {
    const indicator = document.getElementById('indicatorType').value;
    const flask = document.getElementById('liquid-flask');
    
    if (indicator === 'methylRed') {
        if (ph < 4.4) flask.style.background = "rgba(244, 67, 54, 0.7)"; // แดง
        else if (ph < 6.2) {
            const ratio = (ph - 4.4) / 1.8;
            flask.style.background = `rgba(255, ${150 + (ratio * 80)}, 50, 0.6)`; // ส้ม
        } else flask.style.background = "rgba(255, 235, 59, 0.6)"; // เหลือง
    } else if (indicator === 'bromothymolBlue') {
        if (ph < 6.0) flask.style.background = "rgba(255, 235, 59, 0.6)";
        else if (ph < 7.6) flask.style.background = "rgba(76, 175, 80, 0.6)";
        else flask.style.background = "rgba(33, 150, 243, 0.7)";
    } else if (indicator === 'phenolphthalein') {
        if (ph <= 8.2) flask.style.background = "rgba(255,255,255,0.5)";
        else flask.style.background = `rgba(255, 105, 180, 0.6)`;
    }
}

function step() {
    let dropSize = 0.05;
    const ph = getPH(state.vAdded);
    
    // ปรับความเร็วช่วงจุดสมมูล (pH 3 - 8)
    if (ph > 3 && ph < 8) {
        dropSize = 0.005; 
        if (state.currentSpeed !== 250) {
            clearInterval(state.timer);
            state.timer = setInterval(step, 250);
            state.currentSpeed = 250;
        }
    }

    state.vAdded += dropSize;
    const nextPh = getPH(state.vAdded);
    
    document.getElementById('disp-vol').innerText = state.vAdded.toFixed(3);
    document.getElementById('disp-ph').innerText = nextPh.toFixed(2);
    updateColor(nextPh);
    document.getElementById('liquid-burette').style.height = Math.max(90 - (state.vAdded * 1.5), 0) + "%";
}

// Event Listeners
document.getElementById('titrate-btn').addEventListener('mousedown', () => {
    state.isDropping = true;
    document.getElementById('drop-particle').classList.add('is-dropping');
    state.timer = setInterval(step, 100);
});

window.addEventListener('mouseup', () => {
    state.isDropping = false;
    document.getElementById('drop-particle').classList.remove('is-dropping');
    clearInterval(state.timer);
    state.currentSpeed = 100;
});

document.getElementById('showConc').addEventListener('change', function() {
    const disp = document.getElementById('acidConcDisp');
    disp.className = this.checked ? 'conc-visible' : 'conc-hidden';
});

// อัปเดต pH ทันทีเมื่อเปลี่ยนปริมาตรกรด
document.getElementById('acidVol').addEventListener('input', () => {
    if (!state.isDropping) {
        const ph = getPH(0);
        document.getElementById('disp-ph').innerText = ph.toFixed(2);
        updateColor(ph);
    }
});

function resetLab() {
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

// Start
window.onload = resetLab;