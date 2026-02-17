const state = {
    isDropping: false,
    vAdded: 0,
    timer: null,
    targetAcidConc: 0,
    currentSpeed: 100
};

// ค่า Ka ของกรดอ่อนชนิดต่างๆ
const kaValues = { 
    "CH3COOH": 1.8e-5, 
    "HCOOH": 1.8e-4,
    "HF": 6.6e-4 
};

// 1. สุ่มความเข้มข้นกรดอ่อน (0.05 - 0.5 M)
function randomizeAcid() {
    state.targetAcidConc = (Math.random() * (0.5 - 0.05) + 0.05).toFixed(3);
    document.getElementById('acidConcDisp').value = state.targetAcidConc;
}

// 2. คำนวณ pH สำหรับ Strong Base + Weak Acid
function getPH(vBase) {
    const cb = parseFloat(document.getElementById('baseConc').value) || 0.1;
    const ca = parseFloat(state.targetAcidConc);
    const va = parseFloat(document.getElementById('acidVol').value) || 10;
    const ka = kaValues[document.getElementById('acidType').value];
    const kw = 1e-14;

    const molA = ca * va;
    const molB = cb * vBase;
    const totalV = va + vBase;

    // ระยะที่ 1: ยังไม่มีการเติมเบส (กรดอ่อนแตกตัว)
    if (vBase === 0) {
        const hPlus = Math.sqrt(ka * ca);
        return -Math.log10(hPlus);
    }

    // ระยะที่ 2: ก่อนจุดสมมูล (เกิดสารละลายบัฟเฟอร์)
    if (molA > molB + 1e-7) {
        const remainingAcidMol = molA - molB;
        const conjugateBaseMol = molB;
        // pH = pKa + log([Salt]/[Acid])
        const pKa = -Math.log10(ka);
        return pKa + Math.log10(conjugateBaseMol / remainingAcidMol);
    } 
    // ระยะที่ 3: จุดสมมูล (เกลือของกรดอ่อนเกิดไฮโดรไลซิส)
    else if (Math.abs(molA - molB) < 1e-7) {
        const saltConc = molA / totalV;
        const kb = kw / ka;
        const ohMinus = Math.sqrt(kb * saltConc);
        const pOH = -Math.log10(ohMinus);
        return 14 - pOH;
    } 
    // ระยะที่ 4: หลังจุดสมมูล (เบสแก่เหลือเกินพอ)
    else {
        const excessBaseMol = molB - molA;
        const ohMinus = excessBaseMol / totalV;
        const pOH = -Math.log10(ohMinus);
        return 14 - pOH;
    }
}

// 3. ฟังก์ชันอัปเดตสีตาม pH (เหมือนเดิมแต่ปรับ Logic เล็กน้อยให้เข้ากับช่วง pH)
function updateColor(ph) {
    const indicator = document.getElementById('indicatorType').value;
    const flask = document.getElementById('liquid-flask');
    let color = "";

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

// 4. ฟังก์ชัน Step (ปรับให้หยดช้าลงเมื่อใกล้ pH เปลี่ยน)
function step() {
    if (state.vAdded >= 50) {
        stopTitration();
        return;
    }

    let currentPh = getPH(state.vAdded);
    let dropSize = 0.05; // ขนาดหยด

    // ปรับให้หยดละเอียดขึ้นในช่วงใกล้จุดสมมูล (pH 6-11)
    if (currentPh > 6 && currentPh < 11) {
        dropSize = 0.005;
    }

    state.vAdded += dropSize;
    const ph = getPH(state.vAdded);

    document.getElementById('disp-vol').innerText = state.vAdded.toFixed(3);
    document.getElementById('disp-ph').innerText = ph.toFixed(2);
    
    updateColor(ph);
    
    const buretteHeight = 90 - (state.vAdded * 1.8);
    document.getElementById('liquid-burette').style.height = `${Math.max(0, buretteHeight)}%`;
}

// --- ส่วนควบคุม Event เหมือนเดิม ---
const startTitration = () => {
    state.isDropping = true;
    document.getElementById('drop-particle').classList.add('is-dropping');
    document.querySelector('.flask-shape').classList.add('is-mixing');
    state.timer = setInterval(step, 50);
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
    randomizeAcid();
    document.getElementById('disp-vol').innerText = "0.000";
    const initialPH = getPH(0);
    document.getElementById('disp-ph').innerText = initialPH.toFixed(2);
    updateColor(initialPH);
    document.getElementById('liquid-burette').style.height = "90%";
    document.getElementById('showConc').checked = false;
    document.getElementById('acidConcDisp').className = 'conc-hidden';
}

const btn = document.getElementById('titrate-btn');
let holdTimer;
let isLongPress = false;

// ฟังก์ชันสำหรับการคลิก 1 ครั้ง (หยดแค่ 1 step)
function handleNormalClick() {
    console.log("ทำงานแบบคลิกปกติ (Single Drop)");
    step(); // เรียกใช้ step แค่ครั้งเดียว
}

btn.addEventListener('mousedown', () => {
    isLongPress = false;
    
    // ตั้งเวลา 500ms หากกดค้างถึงจุดนี้ จะเริ่มหยดต่อเนื่อง
    holdTimer = setTimeout(() => {
        isLongPress = true;
        startTitration(); 
        console.log("เริ่มการทำงานแบบคลิกค้าง (Continuous Titration)");
    }, 500);
});

btn.addEventListener('mouseup', () => {
    clearTimeout(holdTimer); // หยุดการนับเวลา 500ms
    if (isLongPress) {
        stopTitration(); // ถ้าเคยทำงานแบบกดค้างไว้ เมื่อปล่อยเมาส์ให้หยุดหยด
    }
});

btn.addEventListener('mouseleave', () => {
    clearTimeout(holdTimer);
    if (isLongPress) {
        stopTitration(); // ถ้าลากเมาส์ออกจากปุ่มขณะกดค้าง ให้หยุดหยดเช่นกัน
    }
});

btn.addEventListener('click', (e) => {
    // ถ้าเป็นการกดค้าง (Long Press) ไปแล้ว ไม่ต้องรันโค้ดคลิกปกติ
    if (isLongPress) {
        e.preventDefault();
        return;
    }
    
    // ถ้าเป็นการคลิกสั้นๆ ให้หยดแค่ 1 ครั้ง
    handleNormalClick(); 
});

document.getElementById('reset-btn').addEventListener('click', resetLab);
document.getElementById('showConc').addEventListener('change', function() {
    document.getElementById('acidConcDisp').className = this.checked ? 'conc-visible' : 'conc-hidden';
});

window.onload = resetLab;