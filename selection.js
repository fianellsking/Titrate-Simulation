function handleKnowledgeClick(type) {
    let target = "";

    switch(type) {
        case 'graph':
            target = "https://docs.google.com/presentation/d/1KY0wHXH3Xm3h_q7BQGl0h3Ol4Rznsp3X/edit?usp=sharing&ouid=107910151210472270851&rtpof=true&sd=true"; 
            break;
        case 'slide':
            target = "https://docs.google.com/presentation/d/1tQtwmSvNjQ-8ZVHMurrU53AT5cq7W0zV/edit?usp=sharing&ouid=107910151210472270851&rtpof=true&sd=true"; 
            break;
        case 'quiz':
            target = "https://drive.google.com/file/d/14EXfzcaC77qOm1W8xbFRyOTXa80gVrHj/view?usp=sharing";
            break;
        case 'key':
            target = "https://drive.google.com/file/d/1Ocso1OKhlBArWI29nfc8CjEfxgNXL6q3/view?usp=sharing";
            break;
        case 'vidio1':
            target = "https://www.youtube.com/watch?v=cQpdp7PAV2U";
            break;
        case 'vidio2':
            target = "https://youtu.be/LVUVGUx1q40";
            break;
    }

    if (target) {
        window.open(target, '_blank');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-graph')?.addEventListener('click', () => handleKnowledgeClick('graph'));
    document.getElementById('btn-slide')?.addEventListener('click', () => handleKnowledgeClick('slide'));
    document.getElementById('btn-quiz')?.addEventListener('click', () => handleKnowledgeClick('quiz'));
    document.getElementById('btn-key')?.addEventListener('click', () => handleKnowledgeClick('key'));
    document.getElementById('btn-vidio1')?.addEventListener('click', () => handleKnowledgeClick('vidio1'));
    document.getElementById('btn-vidio2')?.addEventListener('click', () => handleKnowledgeClick('vidio2'));
});