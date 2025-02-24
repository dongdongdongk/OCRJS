let imagePath = null;

window.electron.onCaptureComplete((event, path) => {
    imagePath = path; // 이미지 경로 저장
    const img = document.getElementById('screenshot-preview');
    img.src = imagePath;
    img.style.display = 'block';

    // 이미지 클릭 시 원본 크기로 보기
    img.onclick = () => {
        const viewer = window.open('', '_blank');
        viewer.document.write(`<img src="${imagePath}" style="max-width: 100%;">`);
    };
});

// 폴더 열기 버튼
document.getElementById('open-folder').addEventListener('click', () => {
    if (imagePath) {
        window.electron.openFolder(imagePath);
    } else {
        alert("No captured image found!");
    }
});


document.querySelector('.window-control.minimize').addEventListener('click', () => {
    window.electron.send('minimize-window');
});


document.querySelector('.window-control.close').addEventListener('click', () => {
    window.electron.send('close-window');
});