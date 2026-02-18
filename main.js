
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");

const logEl = document.getElementById("log");

function log(message) {
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${message}`;
  console.log(line);

  logEl.textContent = line + "\n" + logEl.textContent;
}

thresholdSlider.addEventListener("input", () => {
  thresholdValue.textContent = thresholdSlider.value;
  log(`Threshold pakeistas į ${thresholdSlider.value}`);
});

btnStart.addEventListener("click", () => {
  log("Paspaustas Start (kamera dar neprijungta)");
  btnStart.disabled = true;
  btnStop.disabled = false;
});

btnStop.addEventListener("click", () => {
  log("Paspaustas Stop (kamera dar neprijungta)");
  btnStart.disabled = false;
  btnStop.disabled = true;
});

log("Puslapis užkrautas. Kamera bus pridėta kitame žingsnyje.");
