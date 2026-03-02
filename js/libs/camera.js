

let video = document.getElementById("videoInput");
let canvas = document.getElementById("canvasOutput");
let ctx = canvas.getContext("2d");
// let startBtn = document.getElementById("startBtn");
// let captureBtn = document.getElementById("captureBtn");
let capturedImageContainer = document.getElementById("capturedImageContainer");
// let capturedImage = document.getElementById("capturedImage");

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function (videoStream) {
            stream = videoStream;
            video.srcObject = stream;
            video.play();
            isRunning = true;
            startBtn.textContent = "Detener Cámara";
            captureBtn.disabled = false;

            video.addEventListener("loadedmetadata", function () {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                processFrame();
            });
        })
        .catch(function (err) {
            console.error("Error al acceder a la cámara: ", err);
            alert("No se pudo acceder a la cámara. Por favor permite el acceso.");
        });
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    isRunning = false;
    startBtn.textContent = "Iniciar Cámara";
    captureBtn.disabled = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function processFrame() {
    if (!isRunning || video.paused || video.ended) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(processFrame);
}

function captureImage() {
    if (!isRunning) return;

    let dataUrl = canvas.toDataURL("image/png");
    capturedImage.src = dataUrl;
    capturedImageContainer.style.display = "block";
    console.log("Imagen capturada");
}