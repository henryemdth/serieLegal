document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById("videoInput");
    const canvas = document.getElementById("canvasOutput");
    const ctx = canvas.getContext("2d");
    const cropCanvas = document.getElementById("cropCanvas");
    const cropCtx = cropCanvas.getContext("2d");
    const startBtn = document.getElementById("startBtn");
    const captureBtn = document.getElementById("captureBtn");
    const cameraSelect = document.getElementById("cameraSelect");
    const capturedImageContainer = document.getElementById("capturedImageContainer");
    const capturedImage = document.getElementById("capturedImage");
    const resultContainer = document.getElementById("resultContainer");
    const resultText = document.getElementById("resultText");
    const resultDetails = document.getElementById("resultDetails");
    const statusEl = document.getElementById("status");
    const mainContainer = document.getElementById("mainContainer");

    const optionBtns = document.querySelectorAll(".option-btn");

    let stream = null;
    let isRunning = false;
    let selectedOption = null;

    optionBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            optionBtns.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedOption = btn.dataset.value;

            mainContainer.classList.remove("option-10", "option-20", "option-50");
            mainContainer.classList.add(`option-${selectedOption}`);
        });
    });

    const RANGES = [
        // Bs 50
        { s: 67250001, e: 67700000, denom: 50, p: 151 },
        { s: 69050001, e: 69500000, denom: 50, p: 155 },
        { s: 69500001, e: 69950000, denom: 50, p: 156 },
        { s: 69950001, e: 70400000, denom: 50, p: 157 },
        { s: 70400001, e: 70850000, denom: 50, p: 158 },
        { s: 70850001, e: 71300000, denom: 50, p: 159 },
        { s: 76310012, e: 85139995, denom: 50, p: 166 },
        { s: 86400001, e: 86850000, denom: 50, p: 187 },
        { s: 90900001, e: 91350000, denom: 50, p: 197 },
        { s: 91800001, e: 92250000, denom: 50, p: 199 },

        // Bs 20
        { s: 87280145, e: 91646549, denom: 20, p: 204 },
        { s: 96650001, e: 97100000, denom: 20, p: 208 },
        { s: 99800001, e: 100250000, denom: 20, p: 215 },
        { s: 100250001, e: 100700000, denom: 20, p: 216 },
        { s: 109250001, e: 109700000, denom: 20, p: 236 },
        { s: 110600001, e: 111050000, denom: 20, p: 239 },
        { s: 111050001, e: 111500000, denom: 20, p: 240 },
        { s: 111950001, e: 112400000, denom: 20, p: 242 },
        { s: 112400001, e: 112850000, denom: 20, p: 243 },
        { s: 112850001, e: 113300000, denom: 20, p: 244 },
        { s: 114200001, e: 114650000, denom: 20, p: 247 },
        { s: 114650001, e: 115100000, denom: 20, p: 248 },
        { s: 115100001, e: 115550000, denom: 20, p: 249 },
        { s: 118700001, e: 119150000, denom: 20, p: 257 },
        { s: 119150001, e: 119600000, denom: 20, p: 258 },
        { s: 120500001, e: 120950000, denom: 20, p: 261 },

        // Bs 10
        { s: 77100001, e: 77550000, denom: 10, p: 197 },
        { s: 78000001, e: 78450000, denom: 10, p: 199 },
        { s: 78900001, e: 96350000, denom: 10, p: 201 },
        { s: 96350001, e: 96800000, denom: 10, p: 202 },
        { s: 96800001, e: 97250000, denom: 10, p: 203 },
        { s: 98150001, e: 98600000, denom: 10, p: 206 },
        { s: 104900001, e: 105350000, denom: 10, p: 221 },
        { s: 105350001, e: 105800000, denom: 10, p: 222 },
        { s: 106700001, e: 107150000, denom: 10, p: 225 },
        { s: 107600001, e: 108050000, denom: 10, p: 227 },
        { s: 108050001, e: 108500000, denom: 10, p: 228 },
        { s: 109400001, e: 109850000, denom: 10, p: 231 },
    ];

    async function loadCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');

            cameraSelect.innerHTML = '';

            if (videoDevices.length === 0) {
                cameraSelect.innerHTML = '<option value="">Sin cámaras</option>';
                return;
            }

            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                let label = device.label || `Cámara ${index + 1}`;
                if (device.facingMode === 'environment') label += ' (Trasera)';
                else if (device.facingMode === 'user') label += ' (Frontal)';
                option.textContent = label;
                cameraSelect.appendChild(option);
            });

            startBtn.disabled = false;
            statusEl.textContent = '✅ Listo';
        } catch (err) {
            cameraSelect.innerHTML = '<option value="">Error</option>';
            statusEl.textContent = '⚠️ Error al cargar cámaras';
        }
    }

    loadCameras();

    startBtn.addEventListener("click", () => isRunning ? stopCamera() : startCamera());
    captureBtn.addEventListener("click", captureAndProcess);

    function startCamera() {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Tu navegador no soporta acceso a la cámara.");
            return;
        }

        const deviceId = cameraSelect.value;

        const constraints = deviceId
            ? [{ deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
            { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
            { deviceId: { exact: deviceId } }]
            : [{ facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                true];

        const tryConstraint = (i) => {
            if (i >= constraints.length) {
                alert("No se pudo acceder a la cámara.");
                return;
            }

            const c = constraints[i];
            const req = c === true
                ? navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                : navigator.mediaDevices.getUserMedia({ video: c, audio: false });

            req.then(onStream).catch(() => tryConstraint(i + 1));
        };

        const onStream = (videoStream) => {
            stream = videoStream;
            video.srcObject = stream;
            video.play();
            isRunning = true;
            startBtn.textContent = "Detener Cámara";
            captureBtn.disabled = false;

            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                processFrame();
            };
        };

        tryConstraint(0);
    }

    function stopCamera() {
        stream?.getTracks().forEach(t => t.stop());
        stream = null;
        isRunning = false;
        startBtn.textContent = "Iniciar Cámara";
        captureBtn.disabled = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resultContainer.style.display = "none";
    }

    function processFrame() {
        if (!isRunning || !video || video.paused || video.ended || !canvas.width) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(processFrame);
    }

    function captureAndProcess() {
        if (!isRunning) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const cropX = canvasWidth * 0.15;
        const cropY = canvasHeight * 0.375;
        const cropWidth = canvasWidth * 0.7;
        const cropHeight = canvasHeight * 0.25;

        const aspectRatio = cropWidth / cropHeight;
        let finalWidth, finalHeight;
        if (aspectRatio > 1) {
            finalWidth = 400;
            finalHeight = Math.round(400 / aspectRatio);
        } else {
            finalHeight = 200;
            finalWidth = Math.round(200 * aspectRatio);
        }

        cropCanvas.width = finalWidth;
        cropCanvas.height = finalHeight;

        cropCtx.drawImage(
            canvas,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, finalWidth, finalHeight
        );

        const dataUrl = cropCanvas.toDataURL("image/png");
        capturedImage.src = dataUrl;
        capturedImageContainer.style.display = "block";

        statusEl.textContent = '⏳ Procesando OCR...';
        captureBtn.disabled = true;

        extractSerie(dataUrl);
    }

    async function extractSerie(imageData) {
        try {
            const result = await Tesseract.recognize(imageData, 'spa', {
                logger: m => m.status === 'recognizing text' && (statusEl.textContent = `⏳ OCR: ${Math.round(m.progress * 100)}%`)
            });

            const text = result.data.text;
            const match = text.match(/[0-9]{9}\s+[AB]/i);
            console.log(selectedOption);
            if (match) {
                const serie = match[0].trim().toUpperCase();
                const letra = serie.slice(-1);
                resultText.innerHTML = `<span class="${letra === 'A' ? 'corte-aa' : 'corte-bb'}">${letra}</span>`;
                resultDetails.innerHTML = `<p>Serie: <strong>${serie}</strong></p><p>Corte: ${selectedOption}</p>`;

                statusEl.textContent = '✅ Completado';
            } else {
                resultText.innerHTML = '<span class="corte-nd">xxxxxxxxx X</span>';
                resultDetails.innerHTML = `<p>No se detectó serie</p><p class="debug-text">Texto: ${text.substring(0, 100)}...</p>`;
                statusEl.textContent = '⚠️ No detectado';
            }

            resultContainer.style.display = "block";
            captureBtn.disabled = false;

        } catch (error) {
            console.error("Error en OCR:", error);
            statusEl.textContent = '❌ Error en OCR';
            captureBtn.disabled = false;
        }
    }
});

function isObserved(number, denom) {
    for (const r of RANGES) {
        if (r.denom !== denom) continue;
        if (number >= r.s && number <= r.e) return true;
    }
    return false;
}

