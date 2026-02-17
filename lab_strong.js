/* --- lab_strong.js --- */
const state = {
    isDropping: false,
    vAdded: 0,
    timer: null,
    targetAcidConc: 0,
    currentSpeed: 100
};

function randomizeAcid() {
    state.targetAcidConc = (Math.random() * (0.45 - 0.05) + 0.05).toFixed(3);
    document.getElementById('acidConcDisp').value = state.targetAcidConc + " M";
}

function getPH(vBase) {
    const cb = parseFloat(document.getElementById('baseConc').value) || 0.1;
    const ca = parseFloat(state.targetAcidConc);
    const av = parseFloat(document.getElementById('acidVol').value) || 25;
    const molA = (ca * av) / 1000;
    const molB = (cb * vBase) / 1000;
    const totalV_L = (av + vBase) / 1000;

    if (Math.abs(molA - molB) < 1e-9) return 7.00;
    if (molA > molB) {
        const excessH = (molA - molB) / totalV_L;
        return -Math.log10(excessH);
    } else {
        const excessOH = (molB - molA) / totalV_L;
        return 14 + Math.log10(excessOH);
    }
}

function updateColor(ph) {
    const indicator = document.getElementById('indicatorType').value;
    const flask = document.getElementById('liquid-flask');
    let color = "rgba(235, 245, 255, 0.4)"; 

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
    flask.style.backgroundImage = `linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)`;
}

function step() {
    const currentPH = getPH(state.vAdded);
    let dropSize = (currentPH > 3.5 && currentPH < 10.5) ? 0.005 : 0.05;

    state.vAdded += dropSize;
    const ph = getPH(state.vAdded);
    document.getElementById('disp-vol').innerText = state.vAdded.toFixed(3);
    document.getElementById('disp-ph').innerText = ph.toFixed(2);
    updateColor(ph);
    document.getElementById('liquid-burette').style.height = Math.max(0, 90 - (state.vAdded * 1.5)) + "%";
}

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
    const initialPH = getPH(0);
    document.getElementById('disp-vol').innerText = "0.000";
    document.getElementById('disp-ph').innerText = initialPH.toFixed(2);
    updateColor(initialPH);
    document.getElementById('liquid-burette').style.height = "90%";
    document.getElementById('showConc').checked = false;
    document.getElementById('acidConcDisp').className = 'conc-hidden';
}

/* --- แก้ไขเฉพาะส่วน Event Listeners ด้านล่าง --- */

const btn = document.getElementById('titrate-btn');
let holdTimer;
let isLongPress = false;

// 1. เพิ่มตัวแปรเก็บ Timer ของ Animation ไว้ด้านบน (ข้างๆ holdTimer)
let animTimer; 

function handleNormalClick() {
    console.log("ทำงานแบบคลิกปกติ (Single Drop)");
    
    const dropParticle = document.getElementById('drop-particle');
    const flaskShape = document.querySelector('.flask-shape');

    // 2. ล้าง Timer เก่าทิ้งทันทีที่คลิกใหม่ (นี่คือหัวใจสำคัญ!)
    clearTimeout(animTimer);

    // 3. สั่งให้ Animation ทำงาน (ถ้ามันทำงานอยู่แล้ว มันก็จะทำงานต่อไป)
    dropParticle.classList.add('is-dropping');
    flaskShape.classList.add('is-mixing');

    // คำนวณการหยด
    step();

    // 4. ตั้งเวลาปิด Animation ใหม่ทุกครั้งที่คลิก
    // ถ้าคลิกรัวๆ เวลานี้จะถูกรีเซ็ตเรื่อยๆ ทำให้มันไม่หยุดสั่นจนกว่าจะหยุดคลิกจริงๆ
    animTimer = setTimeout(() => {
        // ตรวจเช็คว่าไม่ได้กำลังกดค้างอยู่ (Long Press) ถึงจะสั่งหยุด Animation
        if (!state.isDropping) {
            dropParticle.classList.remove('is-dropping');
            flaskShape.classList.remove('is-mixing');
        }
    }, 400); // ปรับเวลาให้ยาวขึ้นนิดหน่อย (เช่น 500-600ms) จะช่วยให้รอยต่อลื่นขึ้นครับ
}
function handleStart(e) {
    // ป้องกันการเปิด Context Menu (เมนูคัดลอก) บนมือถือ
    // และป้องกันการ Zoom
    if (e.type === 'touchstart') {
        // e.preventDefault(); // ถ้าเอาคอมเมนต์ออกจะบล็อกทุกอย่าง แต่แนะนำใช้ CSS ด้านบนจะดีกว่า
    }

    isLongPress = false;
    holdTimer = setTimeout(() => {
        isLongPress = true;
        startTitration(); 
        console.log("เริ่มการทำงานแบบคลิกค้าง (Continuous Titration)");
    }, 500);
}

// ฟังก์ชันปล่อยมือ
function handleEnd() {
    clearTimeout(holdTimer);
    if (isLongPress) {
        stopTitration();
    }
}

// --- ลงทะเบียน Event แยกกันอย่างถูกต้อง ---

// สำหรับ PC
btn.addEventListener('mousedown', handleStart);
btn.addEventListener('mouseup', handleEnd);
btn.addEventListener('mouseleave', handleEnd);

// สำหรับ Mobile
btn.addEventListener('touchstart', handleStart, { passive: true });
btn.addEventListener('touchend', handleEnd);
btn.addEventListener('touchcancel', handleEnd); // กรณีมีสายเข้าหรือสลับหน้าจอขณะกดค้าง

// บล็อก Context Menu เฉพาะที่ตัวปุ่ม
btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// จัดการการคลิก
btn.addEventListener('click', (e) => {
    if (isLongPress) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    handleNormalClick(); 
});

/* --- ส่วนอื่นๆ คงเดิม --- */
document.getElementById('reset-btn').addEventListener('click', resetLab);
document.getElementById('showConc').addEventListener('change', function() {
    document.getElementById('acidConcDisp').className = this.checked ? '' : 'conc-hidden';
});

window.onload = resetLab;
