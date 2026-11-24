const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const express = require("express");
const multer = require("multer");
const archiver = require("archiver");

const { THEME_PRESETS, WEBSTORE_PRESETS } = require("./src/presets.cjs");
const { coverResize, cropResize, applyOverlay } = require("./src/image.cjs");
const { buildManifest } = require("./src/manifest.cjs");

const PORT = process.env.PORT || 4567;
const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

function safeName(s) {
  return String(s || "theme")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function zipDir(srcDir, outZipPath) {
  await ensureDir(path.dirname(outZipPath));
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(srcDir, false);
    archive.finalize();
  });
}

app.post("/api/generate", upload.fields([{ name: "image", maxCount: 1 }, { name: "overlay", maxCount: 1 }]), async (req, res) => {
  try {
    const file = req.files?.image?.[0];
    const overlayFile = req.files?.overlay?.[0] || null;
    if (!file) return res.status(400).json({ ok: false, error: "Envie uma imagem." });

    const body = req.body || {};
    const themeName = safeName(body.name || "RUNE Theme");
    const version = (body.version || "1.0.0").trim();
    const description = (body.description || "").trim();
    const presetKey = body.presetKey || "classic_16x9";

    const preset = THEME_PRESETS[presetKey] || THEME_PRESETS.classic_16x9;
    const web = WEBSTORE_PRESETS.default;

    const jobId = Date.now().toString(36);
    const outRoot = path.join(__dirname, "out", `${themeName}__${jobId}`);
    const themeDir = path.join(outRoot, "theme");
    const webDir = path.join(outRoot, "webstore");
    await ensureDir(themeDir);
    await ensureDir(webDir);

    // Theme images
    for (const [key, spec] of Object.entries(preset.images)) {
      const buf = await coverResize(file.buffer, {
        w: spec.w,
        h: spec.h,
        format: spec.format || "png",
        alpha: true,
        position: "center",
        blur: spec.blur || 0,
      });
      await fsp.writeFile(path.join(themeDir, `${key}.png`), buf);
    }

    // Manifest
    const manifest = buildManifest({ name: themeName, version, description, colors: null, presetImages: preset.images });
    await fsp.writeFile(path.join(themeDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

    // WebStore assets (sem alpha)
    const webManualCrop = String(body.webManualCrop || "0") === "1";
    const webOverlayOn = String(body.webOverlayOn || "0") === "1";
    const overlayMode = String(body.overlayMode || "none"); // none | generic | upload
    let crops = null;
    if (webManualCrop && body.webCrops) {
      try { crops = JSON.parse(body.webCrops); } catch (_) { crops = null; }
    }
    const overlayBufRaw = overlayFile ? overlayFile.buffer : null;

    // Ícone
    const iconSpec = { ...web.icon, position: "center" };
    const iconCrop = crops?.icon;
    const iconBuf = iconCrop
      ? await cropResize(file.buffer, iconCrop, { ...iconSpec, alpha: true, format: "png" })
      : await coverResize(file.buffer, { ...iconSpec, alpha: true, format: "png" });
    await fsp.writeFile(path.join(webDir, "icon_128.png"), iconBuf);

    // Screenshot 1280x800
    const shotSpec = { ...web.screenshot, position: "center", alpha: false, format: "jpg" };
    const shotCrop = crops?.screenshot;
    let shotBuf = shotCrop
      ? await cropResize(file.buffer, shotCrop, shotSpec)
      : await coverResize(file.buffer, shotSpec);
    if (webOverlayOn && overlayMode !== "none") {
      shotBuf = await applyOverlay(shotBuf, overlayMode, overlayBufRaw, { w: web.screenshot.w, h: web.screenshot.h }, "jpg");
    }
    await fsp.writeFile(path.join(webDir, "screenshot_1280x800.jpg"), shotBuf);

    // Screenshot 640x400
    const shotSmallSpec = { ...web.screenshot_small, position: "center", alpha: false, format: "jpg" };
    const shotSmallCrop = crops?.screenshot_small;
    let shotSmallBuf = shotSmallCrop
      ? await cropResize(file.buffer, shotSmallCrop, shotSmallSpec)
      : await coverResize(file.buffer, shotSmallSpec);
    if (webOverlayOn && overlayMode !== "none") {
      shotSmallBuf = await applyOverlay(shotSmallBuf, overlayMode, overlayBufRaw, { w: web.screenshot_small.w, h: web.screenshot_small.h }, "jpg");
    }
    await fsp.writeFile(path.join(webDir, "screenshot_640x400.jpg"), shotSmallBuf);

    // Promo 440x280
    const promoSmallSpec = { ...web.promo_small, position: "center", alpha: false, format: "jpg" };
    const promoSmallCrop = crops?.promo_small;
    const promoSmallBuf = promoSmallCrop
      ? await cropResize(file.buffer, promoSmallCrop, promoSmallSpec)
      : await coverResize(file.buffer, promoSmallSpec);
    await fsp.writeFile(path.join(webDir, "promo_440x280.jpg"), promoSmallBuf);

    // Marquee 1400x560
    const marqueeSpec = { ...web.promo_marquee, position: "center", alpha: false, format: "jpg" };
    const marqueeCrop = crops?.promo_marquee;
    const marqueeBuf = marqueeCrop
      ? await cropResize(file.buffer, marqueeCrop, marqueeSpec)
      : await coverResize(file.buffer, marqueeSpec);
    await fsp.writeFile(path.join(webDir, "marquee_1400x560.jpg"), marqueeBuf);

    // Zip outputs
    const themeZip = path.join(outRoot, "theme.zip");
    const webZip = path.join(outRoot, "webstore-assets.zip");
    await zipDir(themeDir, themeZip);
    await zipDir(webDir, webZip);

    res.json({
      ok: true,
      jobId,
      themeName,
      presetKey,
      outRoot: path.relative(__dirname, outRoot),
      downloads: {
        themeZip: `/download/${jobId}/theme.zip`,
        webZip: `/download/${jobId}/webstore-assets.zip`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || "Erro ao gerar." });
  }
});

app.get("/download/:jobId/:file", async (req, res) => {
  const { jobId, file } = req.params;
  // busca pasta out/*__jobId
  const outBase = path.join(__dirname, "out");
  const entries = await fsp.readdir(outBase, { withFileTypes: true }).catch(() => []);
  const folder = entries.find((e) => e.isDirectory() && e.name.endsWith(`__${jobId}`));
  if (!folder) return res.status(404).send("Job não encontrado.");
  const target = path.join(outBase, folder.name, file);
  if (!fs.existsSync(target)) return res.status(404).send("Arquivo não encontrado.");
  res.download(target);
});

app.listen(PORT, () => {
  console.log(`[RUNE Theme Factory] http://localhost:${PORT}`);
});
