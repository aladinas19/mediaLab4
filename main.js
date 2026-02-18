
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");
const btnToggleSobel = document.getElementById("btnToggleSobel");
const btnToggleGray = document.getElementById("btnToggleGray");

const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");

const logEl = document.getElementById("log");

let stream = null;
let rafId = null;

let sobelEnabled = true;
let grayscaleEnabled = false;

function log(message) {
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${message}`;
  console.log(line);
  logEl.textContent = line + "\n" + logEl.textContent;
}

thresholdSlider.addEventListener("input", () => {
  thresholdValue.textContent = thresholdSlider.value;
});

btnStart.addEventListener("click", startCamera);
btnStop.addEventListener("click", stopCamera);

btnToggleSobel.addEventListener("click", () => {
  sobelEnabled = !sobelEnabled;

  if (sobelEnabled) {
    btnToggleSobel.textContent = "Sobel: ON";
    log("Sobel filtras įjungtas.");
  } else {
    btnToggleSobel.textContent = "Sobel: OFF";
    log("Sobel filtras išjungtas.");
  }
});

btnToggleGray.addEventListener("click", () => {
  grayscaleEnabled = !grayscaleEnabled;

  if (grayscaleEnabled) {
    btnToggleGray.textContent = "Grayscale: ON";
    log("Grayscale įjungtas (veiks tik kai Sobel OFF).");
  } else {
    btnToggleGray.textContent = "Grayscale: OFF";
    log("Grayscale išjungtas.");
  }
});

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

    resizeCanvasToVideo();

    btnToggleSobel.disabled = false;
    btnToggleGray.disabled = false;

    sobelEnabled = true;
    grayscaleEnabled = false;
    btnToggleSobel.textContent = "Sobel: ON";
    btnToggleGray.textContent = "Grayscale: OFF";

    log("Kamera paleista. Pradedam render loop.");
    startLoop();
  } catch (err) {
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnToggleSobel.disabled = true;
    btnToggleGray.disabled = true;

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
  btnToggleSobel.disabled = true;
  btnToggleGray.disabled = true;
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
  if (video.readyState < 2) {
    rafId = requestAnimationFrame(loop);
    return;
  }

  const w = canvas.width;
  const h = canvas.height;

  ctx.drawImage(video, 0, 0, w, h);

  if (sobelEnabled) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const threshold = Number(thresholdSlider.value);
    const out = sobelEdge(imageData, threshold);
    ctx.putImageData(out, 0, 0);
    rafId = requestAnimationFrame(loop);
    return;
  }

  if (grayscaleEnabled) {
    const imageData = ctx.getImageData(0, 0, w, h);
    applyGrayscale(imageData);
    ctx.putImageData(imageData, 0, 0);
    rafId = requestAnimationFrame(loop);
    return;
  }

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
  }
}


function sobelEdge(imageData, threshold) {
  const { data, width, height } = imageData;

  const gray = new Uint8ClampedArray(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[p] = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
  }

  const out = new ImageData(width, height);
  const outData = out.data;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const a00 = gray[idx - width - 1];
      const a01 = gray[idx - width];
      const a02 = gray[idx - width + 1];

      const a10 = gray[idx - 1];
      const a12 = gray[idx + 1];

      const a20 = gray[idx + width - 1];
      const a21 = gray[idx + width];
      const a22 = gray[idx + width + 1];

      const gx =
        (-1 * a00) + (0 * a01) + (1 * a02) +
        (-2 * a10) + (0)      + (2 * a12) +
        (-1 * a20) + (0 * a21) + (1 * a22);

      const gy =
        ( 1 * a00) + ( 2 * a01) + ( 1 * a02) +
        ( 0 * a10) + ( 0)       + ( 0 * a12) +
        (-1 * a20) + (-2 * a21) + (-1 * a22);

      const mag = Math.sqrt(gx * gx + gy * gy);
      const v = mag > threshold ? 255 : 0;

      const o = idx * 4;
      outData[o] = v;
      outData[o + 1] = v;
      outData[o + 2] = v;
      outData[o + 3] = 255;
    }
  }

  return out;
}

log("Puslapis užkrautas. Paleisk per HTTPS ir paspausk Start.");
