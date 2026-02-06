// ฟังก์ชันสำหรับจัดการการเปิดไฟล์
function handleKnowledgeClick(type) {
    let target = "";

    switch(type) {
        case 'graph':
            target = "titration_graphs.png"; 
            break;
        case 'slide':
            target = "https://link-to-your-google-drive-pdf.com"; 
            break;
        case 'quiz':
            target = "exercise_sheet.pdf";
            break;
        case 'key':
            target = "answer_key.pdf";
            break;
    }

    if (target) {
        window.open(target, '_blank');
    }
}

// รอให้หน้าจอโหลดเสร็จก่อนค่อยผูก Event
document.addEventListener('DOMContentLoaded', () => {
    // ผูกปุ่มกับฟังก์ชัน (อิงตาม ID ที่เราตั้งใน HTML)
    document.getElementById('btn-graph')?.addEventListener('click', () => handleKnowledgeClick('graph'));
    document.getElementById('btn-slide')?.addEventListener('click', () => handleKnowledgeClick('slide'));
    document.getElementById('btn-quiz')?.addEventListener('click', () => handleKnowledgeClick('quiz'));
    document.getElementById('btn-key')?.addEventListener('click', () => handleKnowledgeClick('key'));
});