import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const PAPER_SIZES = {
    a4: { width: 210, height: 297 }, // mm
    a5: { width: 148, height: 210 }, // mm
    letter: { width: 216, height: 279 } // mm
};

const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591 pixels

const canvas = document.getElementById('certificateCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const draggableText = document.getElementById('draggableText');
const nameInput = document.getElementById('nameInput');
const textAlignInput = document.getElementById('textAlignInput');
const fontFamilyInput = document.getElementById('fontFamilyInput');
const fontWeightInput = document.getElementById('fontWeightInput');
const fontSizeInput = document.getElementById('fontSizeInput');
const fontColorInput = document.getElementById('fontColorInput');
const paperSizeInput = document.getElementById('paperSizeInput');
const orientationInput = document.getElementById('orientationInput');
const downloadBtn = document.getElementById('downloadBtn');
const placeholder = document.getElementById('placeholder');

let certificateImage = null;

function getPaperSizeInPixels() {
    const size = PAPER_SIZES[paperSizeInput.value];
    const isLandscape = orientationInput.value === 'landscape';
    
    return {
        width: (isLandscape ? size.height : size.width) * MM_TO_PX,
        height: (isLandscape ? size.width : size.height) * MM_TO_PX
    };
}

function updateCanvasSize() {
    if (!certificateImage) return;
    
    const paperSize = getPaperSizeInPixels();
    canvas.width = paperSize.width;
    canvas.height = paperSize.height;
    
    drawCanvas();
}

function drawCanvas() {
    if (!certificateImage) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(certificateImage, 0, 0, canvas.width, canvas.height);
    
    const fontWeight = fontWeightInput.value;
    ctx.font = `${fontWeight} ${fontSizeInput.value}px "${fontFamilyInput.value}"`;
    ctx.fillStyle = fontColorInput.value;
    ctx.textAlign = textAlignInput.value;
    
    const text = nameInput.value || 'Your Name';
    draggableText.textContent = text;
    draggableText.style.fontSize = `${fontSizeInput.value}px`;
    draggableText.style.fontFamily = fontFamilyInput.value;
    draggableText.style.fontWeight = fontWeight;
    draggableText.style.color = fontColorInput.value;
    draggableText.style.textAlign = textAlignInput.value;
    
    // Adjust draggable text width based on alignment
    if (textAlignInput.value === 'center') {
        draggableText.style.width = '100%';
        draggableText.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    } else {
        draggableText.style.width = 'auto';
        draggableText.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    }
}

document.getElementById('certificateImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            certificateImage = new Image();
            certificateImage.onload = () => {
                updateCanvasSize();
                draggableText.style.display = 'block';
                placeholder.style.display = 'none';
                downloadBtn.disabled = false;
            };
            certificateImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function dragStart(e) {
    if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }

    if (e.target === draggableText) {
        isDragging = true;
    }
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();

        if (e.type === "touchmove") {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
        } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, draggableText);
    }
}

container.addEventListener("touchstart", dragStart, false);
container.addEventListener("touchend", dragEnd, false);
container.addEventListener("touchmove", drag, false);
container.addEventListener("mousedown", dragStart, false);
container.addEventListener("mouseup", dragEnd, false);
container.addEventListener("mousemove", drag, false);

// Event listeners for all inputs
nameInput.addEventListener('input', drawCanvas);
textAlignInput.addEventListener('change', drawCanvas);
fontFamilyInput.addEventListener('change', drawCanvas);
fontWeightInput.addEventListener('change', drawCanvas);
fontSizeInput.addEventListener('input', drawCanvas);
fontColorInput.addEventListener('input', drawCanvas);
paperSizeInput.addEventListener('change', updateCanvasSize);
orientationInput.addEventListener('change', updateCanvasSize);

downloadBtn.addEventListener('click', async () => {
    const paperSize = getPaperSizeInPixels();
    
    // Create a temporary canvas for the final image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = paperSize.width;
    tempCanvas.height = paperSize.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the background image
    tempCtx.drawImage(certificateImage, 0, 0, paperSize.width, paperSize.height);

    // Calculate text position from draggable div
    const rect = draggableText.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scale = paperSize.width / containerRect.width;
    
    let x;
    const textAlign = textAlignInput.value;
    if (textAlign === 'left') {
        x = (rect.left - containerRect.left) * scale;
    } else if (textAlign === 'right') {
        x = (rect.right - containerRect.left) * scale;
    } else {
        x = (rect.left - containerRect.left + rect.width / 2) * scale;
    }
    
    const y = (rect.top - containerRect.top + rect.height / 2) * scale;

    // Draw the text
    const fontWeight = fontWeightInput.value;
    tempCtx.font = `${fontWeight} ${fontSizeInput.value * scale}px "${fontFamilyInput.value}"`;
    tempCtx.fillStyle = fontColorInput.value;
    tempCtx.textAlign = textAlign;
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(nameInput.value || 'Your Name', x, y);

    // Convert to PDF
    const imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
        orientation: orientationInput.value,
        unit: 'mm',
        format: paperSizeInput.value
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save('certificate.pdf');
});