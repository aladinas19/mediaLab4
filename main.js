// mediaLab4 – 2 žingsnis: WebRTC kamera į video + UI logika

const video = document.getElementById("video");

const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");

const logEl = document.getElementById("log");

let stream = null;

function log(message) {
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${message}`;
  console.log(line);
  logEl.textContent = line + "\n" + logEl.textContent;
}

// Slider: rodom aktualią reikšmę
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

    log("Kamera paleista, video rodomas.");
  } catch (err) {
    btnStart.disabled = false;
    btnStop.disabled = true;

    log(`KLAIDA paleidžiant kamerą: ${err?.name || ""} ${err?.message || err}`);
  }
}

function stopCamera() {
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

// Pradinis log
log("Puslapis užkrautas. Paspausk Start, kad įjungtum kamerą.");
