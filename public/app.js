// DOM helpers
const $ = (id) => document.getElementById(id);

// =====================
// UTIL: cores
// =====================
function hexToRgbArr(hex) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function applyPreviewChromeColors() {
  const mode = $("colorMode").value;
  const style = $("styleMode").value;
  const topBar = $("chromeTopBar");
  if (!topBar) return;

  let frame = style === "light" ? "#e5e7eb" : "#111827";
  let alpha = style === "light" ? 0.55 : 0.30;

  if (mode === "custom") {
    frame = $("c_frame").value;
    alpha = style === "light" ? 0.62 : 0.35;
  }

  const [r, g, b] = hexToRgbArr(frame);
  topBar.style.background = `rgba(${r},${g},${b},${alpha})`;
}

// =====================
// UTIL: imagens
// =====================
function setImgFromFile(imgEl, file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  imgEl.onload = () => URL.revokeObjectURL(url);
  imgEl.src = url;
}

// Overlay genérico (SVG) pro preview
function genericOverlayDataUrl() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800">
    <rect x="0" y="0" width="1280" height="92" fill="rgba(255,255,255,0.55)"/>
    <rect x="0" y="92" width="1280" height="1" fill="rgba(0,0,0,0.10)"/>
    <circle cx="34" cy="30" r="8" fill="rgba(0,0,0,0.18)"/>
    <circle cx="58" cy="30" r="8" fill="rgba(0,0,0,0.18)"/>
    <circle cx="82" cy="30" r="8" fill="rgba(0,0,0,0.18)"/>
    <rect x="140" y="18" width="900" height="28" rx="14" fill="rgba(255,255,255,0.72)" stroke="rgba(0,0,0,0.10)"/>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// =====================
// Status/Resultado
// =====================
const statusEl = $("status");
const resultEl = $("result");
const btnGenerate = $("btnGenerate");
const btnSample = $("btnSample");
const btnHelp = $("btnHelp");

function setStatus(msg) {
  statusEl.hidden = !msg;
  statusEl.textContent = msg || "";
}
function setResult(html) {
  resultEl.classList.remove("muted");
  resultEl.innerHTML = html;
}

// =====================
// Cropper
// =====================
let cropper = null;
let loadedObjectUrl = null;

const webCrops = {
  icon: null,
  screenshot: null,
  screenshot_small: null,
  promo_small: null,
  promo_marquee: null,
};

function destroyCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  if (loadedObjectUrl) {
    URL.revokeObjectURL(loadedObjectUrl);
    loadedObjectUrl = null;
  }
}

function targetAspect(target) {
  switch (target) {
    case "icon": return 1;
    case "screenshot": return 1280 / 800;
    case "screenshot_small": return 640 / 400;
    case "promo_small": return 440 / 280;
    case "promo_marquee": return 1400 / 560;
    default: return NaN;
  }
}

function applyCropTarget(target) {
  if (!cropper) return;

  const prev = $("cropTarget").dataset.prevTarget;
  if (prev) webCrops[prev] = cropper.getData(true);

  $("cropTarget").dataset.prevTarget = target;

  const ar = targetAspect(target);
  cropper.setAspectRatio(ar);

  if (webCrops[target]) cropper.setData(webCrops[target]);
}

function initCropperFromFile(file) {
  destroyCropper();

  const imgEl = $("cropImg");
  loadedObjectUrl = URL.createObjectURL(file);
  imgEl.src = loadedObjectUrl;

  $("cropArea").hidden = false;

  imgEl.onload = () => {
    const ar = targetAspect($("cropTarget").value);
    cropper = new Cropper(imgEl, {
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 0.85,
      responsive: true,
      background: false,
      aspectRatio: ar,
    });

    const tgt = $("cropTarget").value;
    $("cropTarget").dataset.prevTarget = tgt;
    if (webCrops[tgt]) cropper.setData(webCrops[tgt]);
  };
}

function isCropEnabled() {
  return $("webManualCrop").checked;
}

// =====================
// Theme toggle (UI)
 // =====================
(function initThemeToggle() {
  const html = document.documentElement;
  const btn = $("themeToggle");
  const icon = $("themeIcon");
  const label = $("themeLabel");

  const saved = localStorage.getItem("rtf-theme");
  if (saved === "light" || saved === "dark") {
    html.dataset.theme = saved;
  }

  function syncThemeUI() {
    const t = html.dataset.theme || "dark";
    if (t === "light") { icon.textContent = "☀️"; label.textContent = "Claro"; }
    else { icon.textContent = "🌙"; label.textContent = "Escuro"; }
  }

  btn?.addEventListener("click", () => {
    const current = html.dataset.theme || "dark";
    const next = current === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    localStorage.setItem("rtf-theme", next);
    syncThemeUI();
  });

  syncThemeUI();
})();

// =====================
// Preview controls
// =====================
const pvBg = $("pvBg");
const pvOverlay = $("pvOverlay");
const chromeMock = $("chromeMock");

const pvOverlayOpacity = $("pvOverlayOpacity");
const pvShadow = $("pvShadow");
const pvBrightness = $("pvBrightness");

const pvOverlayOpacityVal = $("pvOverlayOpacityVal");
const pvShadowVal = $("pvShadowVal");
const pvBrightnessVal = $("pvBrightnessVal");

function updatePreviewLook() {
  const o = Number(pvOverlayOpacity.value) / 100;
  const s = Number(pvShadow.value) / 100;
  const b = Number(pvBrightness.value) / 100;

  pvOverlay.style.opacity = String(o);
  pvBg.style.filter = `brightness(${b})`;

  const shadowB = 0.12 + s * 0.35;
  chromeMock.style.boxShadow = `0 18px 60px rgba(0,0,0,${shadowB})`;

  pvOverlayOpacityVal.textContent = `${pvOverlayOpacity.value}%`;
  pvShadowVal.textContent = `${pvShadow.value}%`;
  pvBrightnessVal.textContent = `${pvBrightness.value}%`;
}

[pvOverlayOpacity, pvShadow, pvBrightness].forEach(el => {
  el.addEventListener("input", updatePreviewLook);
});

// =====================
// Overlay preview sync
// =====================
function syncOverlayUI() {
  const mode = $("overlayPreset").value;
  const wrap = $("overlayUploadWrap");
  const enabled = $("webOverlayOn").checked;

  // mostrar/esconder upload
  wrap.style.display = (mode === "upload") ? "block" : "none";

  // preview overlay
  if (!enabled || mode === "none") {
    pvOverlay.style.display = "none";
    pvOverlay.removeAttribute("src");
    return;
  }

  pvOverlay.style.display = "block";

  if (mode === "generic") {
    pvOverlay.src = genericOverlayDataUrl();
  } else if (mode === "upload") {
    const f = $("overlay").files?.[0];
    if (f) setImgFromFile(pvOverlay, f);
    else pvOverlay.removeAttribute("src");
  }
}

$("webOverlayOn").addEventListener("change", syncOverlayUI);
$("overlayPreset").addEventListener("change", syncOverlayUI);
$("overlay").addEventListener("change", syncOverlayUI);

// =====================
// Cores UI
// =====================
const customColors = $("customColors");

function syncColorsUI() {
  customColors.style.display = $("colorMode").value === "custom" ? "grid" : "none";
  applyPreviewChromeColors();
}

$("colorMode").addEventListener("change", syncColorsUI);
$("styleMode").addEventListener("change", applyPreviewChromeColors);

["c_frame", "c_toolbar", "c_ntp_bg", "c_tab_text", "c_ntp_text", "c_ntp_link"].forEach(id => {
  $(id).addEventListener("input", applyPreviewChromeColors);
});

// =====================
// Inputs
// =====================
$("image").addEventListener("change", () => {
  const file = $("image").files?.[0];
  if (!file) return;

  setImgFromFile(pvBg, file);
  $("previewMeta").textContent = file.name || "—";

  if (isCropEnabled()) initCropperFromFile(file);
});

$("webManualCrop").addEventListener("change", () => {
  const file = $("image").files?.[0];
  if ($("webManualCrop").checked && file) {
    initCropperFromFile(file);
  } else {
    $("cropArea").hidden = true;
    destroyCropper();
  }
});

$("cropTarget").addEventListener("change", (e) => {
  if (!cropper) return;
  applyCropTarget(e.target.value);
});

// =====================
// Botões
// =====================
btnSample.addEventListener("click", () => {
  alert("Use qualquer wallpaper (arraste no input de Imagem base). Exemplo fixo a gente pode colocar depois.");
});

btnHelp.addEventListener("click", () => {
  alert(
    "Fluxo rápido:\n" +
    "1) Escolha imagem base\n" +
    "2) Se quiser, personalize as cores\n" +
    "3) (Opcional) Web Store: recorte manual e overlay\n" +
    "4) Gerar → baixa os zips"
  );
});

// =====================
// Generate
// =====================
function readOverlayMode() {
  const sel = $("overlayPreset").value;
  if (sel === "upload") return "upload";
  if (sel === "generic") return "generic";
  return "none";
}

btnGenerate.addEventListener("click", async () => {
  const file = $("image").files?.[0];
  if (!file) {
    setStatus("Escolha uma imagem base primeiro.");
    return;
  }

  btnGenerate.disabled = true;
  setStatus("Gerando... (cortando, redimensionando e zipando)");
  resultEl.classList.add("muted");
  resultEl.textContent = "Processando...";

  try {
    if (cropper && isCropEnabled()) {
      const currentTarget = $("cropTarget").value;
      webCrops[currentTarget] = cropper.getData(true);
    }

    const fd = new FormData();
    fd.append("image", file);
    fd.append("name", $("name").value);
    fd.append("version", $("version").value);
    fd.append("description", $("description").value);
    fd.append("presetKey", $("presetKey").value);
    fd.append("colorMode", $("colorMode").value);
    fd.append("styleMode", $("styleMode").value);

    if ($("colorMode").value === "custom") {
      fd.append("colors", JSON.stringify({
        frame: hexToRgbArr($("c_frame").value),
        toolbar: hexToRgbArr($("c_toolbar").value),
        ntp_background: hexToRgbArr($("c_ntp_bg").value),
        tab_text: hexToRgbArr($("c_tab_text").value),
        ntp_text: hexToRgbArr($("c_ntp_text").value),
        ntp_link: hexToRgbArr($("c_ntp_link").value),
      }));
    }

    // WebStore advanced
    fd.append("webManualCrop", $("webManualCrop").checked ? "1" : "0");
    fd.append("webOverlayOn", $("webOverlayOn").checked ? "1" : "0");
    fd.append("overlayMode", readOverlayMode());

    const overlayFile = $("overlay").files?.[0];
    if (overlayFile) fd.append("overlay", overlayFile);

    if (isCropEnabled()) {
      fd.append("webCrops", JSON.stringify(webCrops));
    }

    const resp = await fetch("/api/generate", { method: "POST", body: fd });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || "Falhou");

    setStatus("");
    setResult(`
      <div class="row">
        <div>
          <b>Theme zip</b>
          <div class="muted small">manifest + imagens do tema</div>
        </div>
        <a href="${data.downloads.themeZip}">baixar</a>
      </div>
      <div class="row">
        <div>
          <b>WebStore assets zip</b>
          <div class="muted small">ícone + screenshots + promo + marquee</div>
        </div>
        <a href="${data.downloads.webZip}">baixar</a>
      </div>
      <div class="row">
        <div>
          <b>Pasta local</b>
          <div class="muted small">${data.outRoot}</div>
        </div>
        <span class="muted small">gerada no disco</span>
      </div>
    `);
  } catch (e) {
    console.error(e);
    setStatus("Erro: " + e.message);
    resultEl.classList.add("muted");
    resultEl.textContent = "Nada gerado.";
  } finally {
    btnGenerate.disabled = false;
  }
});

// =====================
// Init
// =====================
syncColorsUI();
syncOverlayUI();
applyPreviewChromeColors();
updatePreviewLook();
