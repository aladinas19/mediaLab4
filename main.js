// mediaLab4 – 3 žingsnis: WebRTC kamera + video->canvas loop + grayscale filtras

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");

const logEl = document.getElementById("log");

let stream = null;
let rafId = null;

function log(message) {
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${message}`;
  console.log(line);
  logEl.textContent = line + "\n" + logEl.textContent;
}

// Slider: kol kas tik rodo reikšmę (threshold panaudosim Sobel žingsnyje)
thresholdSlider.addEventListener("input", () => {
  thresholdValue.textContent = thresholdSlider.value;
  log(`Threshold pakeistas į ${thresholdSlider.value}`);
});

btnStart.addEventListener("click", startCamera);
btnStop.addEventListener("click", stopCamera);

async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      log("KLAIDA: naršyklė nepalaiko getUserMedia().");
      return;
    }

    if (!window.isSecureContext) {
      log("ĮSPĖJIMAS: puslapis nėra https (secure context). Kamera gali neveikti.");
    }

    btnStart.disabled = true;
    btnStop.disabled = false;

    log("Prašoma prieigos prie kameros...");

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    // nustatom canvas resolution pagal video
    resizeCanvasToVideo();

    log("Kamera paleista. Pradedam canvas render loop (grayscale).");
    startLoop();
  } catch (err) {
    btnStart.disabled = false;
    btnStop.disabled = true;

    log(`KLAIDA paleidžiant kamerą: ${err?.name || ""} ${err?.message || err}`);
  }
}

function stopCamera() {
  stopLoop();

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
    log("Kamera sustabdyta (track'ai uždaryti).");
  } else {
    log("Stop paspaustas, bet kamera nebuvo paleista.");
  }

  video.srcObject = null;

  btnStart.disabled = false;
  btnStop.disabled = true;
}

function resizeCanvasToVideo() {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;

  log(`Canvas size: ${w}x${h}`);
}

function startLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
    log("Render loop sustabdytas.");
  }
}

function loop() {
  // jei video dar neparuoštas, palaukiam
  if (video.readyState < 2) {
    rafId = requestAnimationFrame(loop);
    return;
  }

  const w = canvas.width;
  const h = canvas.height;

  // 1) nupiešiam video kadrą
  ctx.drawImage(video, 0, 0, w, h);

  // 2) pasiimam pixel data
  const imageData = ctx.getImageData(0, 0, w, h);

  // 3) grayscale filtras
  applyGrayscale(imageData);

  // 4) grąžinam į canvas
  ctx.putImageData(imageData, 0, 0);

  rafId = requestAnimationFrame(loop);
}

function applyGrayscale(imageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const gray = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
    d[i] = gray;
    d[i + 1] = gray;
    d[i + 2] = gray;
    // alpha d[i+3] paliekam
  }
}

// Pradinis log
log("Puslapis užkrautas. Paspausk Start, kad įjungtum kamerą ir grayscale filtrą.");
