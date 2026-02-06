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
    else if (Math.abs(molA - molB) < 0.01) { // ปรับช่วงความละเอียดให้เจอกับ Step การหยด
        const saltConc = molA / totalV;
        const ka = kw / kb;
        return -Math.log10(Math.sqrt(ka * saltConc));
    } 
    // ช่วงที่ 3: เบสอ่อนเหลือ (กลายเป็น Buffer)
    else {
        const remB = (molB - molA) / totalV;
        const salt = molA / totalV;
        // สูตร Buffer: pOH = pKb + log(salt/base)
        const pOH = -Math.log10(kb) + Math.log10(salt / remB);
        return 14 - pOH;
    }
}

// 3. เปลี่ยนสีตาม Indicator (ปรับให้สีเข้มขึ้น)
function updateColor(ph) {
    const indicator = document.getElementById('indicatorType').value;
    const flask = document.getElementById('liquid-flask');
    let color = "";

    if (indicator === 'methylRed') {
        // ช่วงเปลี่ยนสี: 4.2 (แดง) - 6.2 (เหลือง)
        if (ph <= 4.2) {
            color = "rgba(255, 0, 0, 0.8)"; // แดงสนิท
        } else if (ph >= 6.2) {
            color = "rgba(255, 255, 0, 0.8)"; // เหลืองสนิท
        } else {
            // คำนวณ Ratio (0.0 - 1.0)
            let t = (ph - 4.2) / (6.2 - 4.2);
            let g = Math.round(255 * t); // สีเขียวค่อยๆ เพิ่มจนกลายเป็นสีเหลือง (R:255, G:255)
            color = `rgba(255, ${g}, 0, 0.8)`;
        }
    } 
    
    else if (indicator === 'bromothymolBlue') {
        // ช่วงเปลี่ยนสี: 6.0 (เหลือง) - 7.6 (น้ำเงิน)
        if (ph <= 6.0) {
            color = "rgba(255, 255, 0, 0.8)"; // เหลืองสนิท
        } else if (ph >= 7.6) {
            color = "rgba(0, 0, 255, 0.8)"; // น้ำเงินสนิท
        } else {
            // คำนวณ Ratio (0.0 - 1.0)
            let t = (ph - 6.0) / (7.6 - 6.0);
            // จากเหลือง (255, 255, 0) ไป น้ำเงิน (0, 0, 255)
            let r = Math.round(255 * (1 - t));
            let g = Math.round(255 * (1 - t));
            let b = Math.round(255 * t);
            color = `rgba(${r}, ${g}, ${b}, 0.8)`;
        }
    } 
    
    // แก้ไขเฉพาะเงื่อนไข phenolphthalein ในฟังก์ชัน updateColor
else if (indicator === 'phenolphthalein') {
    if (ph <= 8.2) {
        // ใสแบบมีมิติ: ใช้สีฟ้าเทาจางๆ และเพิ่ม Gradient ให้ดูเหมือนน้ำในแก้ว
        color = "linear-gradient(to top, rgba(220, 235, 255, 0.5), rgba(255, 255, 255, 0.2))";
    } else if (ph >= 10.0) {
        // ชมพูม่วงจัดเต็ม
        color = "linear-gradient(to top, rgba(255, 20, 147, 0.8), rgba(255, 105, 180, 0.6))";
    } else {
        // ช่วง Gradient ระหว่าง 8.2 - 10.0
        let t = (ph - 8.2) / (10.0 - 8.2);
        
        // คำนวณสีจาก 'ใส/ฟ้าอ่อน' ไป 'ชมพูเข้ม'
        let r = Math.round(220 + (35 * t)); // จาก 220 ไป 255
        let g = Math.round(235 * (1 - t));   // จาก 235 ไป 0
        let b = Math.round(255 - (127 * t)); // จาก 255 ไป 128
        let alpha = 0.5 + (0.3 * t);        // ค่อยๆ ทึบขึ้น
        
        color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

    flask.style.background = color;
}

// 4. ฟังก์ชัน Step ที่ทำงานทุกครั้งที่หยด
function step() {
    if (state.vAdded >= 50) { // บิวเรตเต็มที่ 50mL
        stopTitration();
        return;
    }

    let dropSize = 0.05; // ขนาดหยดปกติ
    const currentPh = getPH(state.vAdded);

    // ปรับความเร็วช่วงใกล้จุดสมมูลให้ช้าลงเพื่อความสมจริง
    if (currentPh > 3 && currentPh < 9) {
        dropSize = 0.01;
    }

    state.vAdded += dropSize;
    const ph = getPH(state.vAdded);

    // --- ส่วนที่ขาดไป: อัปเดต UI ---
    document.getElementById('disp-vol').innerText = state.vAdded.toFixed(3);
    document.getElementById('disp-ph').innerText = ph.toFixed(2);
    
    // อัปเดตสีขวด
    updateColor(ph);
    
    // อัปเดตระดับสารในบิวเรต (ลดลง)
    const buretteHeight = 90 - (state.vAdded * 1.8); // คำนวณ % ความสูง
    document.getElementById('liquid-burette').style.height = `${Math.max(0, buretteHeight)}%`;
}

// 5. ควบคุมการกด
const startTitration = () => {
    state.isDropping = true;
    document.getElementById('drop-particle').classList.add('is-dropping');
    document.querySelector('.flask-shape').classList.add('is-mixing');
    state.timer = setInterval(step, 100);
};

const stopTitration = () => {
    state.isDropping = false;
    document.getElementById('drop-particle').classList.remove('is-dropping');
    document.querySelector('.flask-shape').classList.remove('is-mixing');
    clearInterval(state.timer);
};

// Event Listeners
document.getElementById('titrate-btn').addEventListener('mousedown', startTitration);
window.addEventListener('mouseup', stopTitration);

// ปุ่ม Reset
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

document.getElementById('reset-btn').addEventListener('click', resetLab);

// แสดงเฉลย
document.getElementById('showConc').addEventListener('change', function() {
    document.getElementById('acidConcDisp').className = this.checked ? 'conc-visible' : 'conc-hidden';
});

window.onload = resetLab;