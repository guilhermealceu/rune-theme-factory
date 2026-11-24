#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { THEME_PRESETS, WEBSTORE_PRESETS } = require("../src/presets.cjs");
const { coverResize } = require("../src/image.cjs");
const { buildManifest } = require("../src/manifest.cjs");
const archiver = require("archiver");

function arg(name, def=null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx+1] ?? true;
}
function safeName(s) {
  return String(s || "theme").trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g," ").slice(0,60);
}
async function ensureDir(p){ await fs.promises.mkdir(p,{recursive:true}); }
async function zipDir(srcDir, outZipPath){
  await ensureDir(path.dirname(outZipPath));
  return new Promise((resolve,reject)=>{
    const output=fs.createWriteStream(outZipPath);
    const archive=archiver("zip",{zlib:{level:9}});
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(srcDir,false);
    archive.finalize();
  });
}

(async () => {
  const input = arg("input");
  if (!input) {
    console.log("Uso: node tools/cli.js --input <arquivo> --name \"Meu Tema\" --preset classic_16x9 --out ./out");
    process.exit(1);
  }
  const name = safeName(arg("name","RUNE Theme"));
  const version = arg("version","1.0.0");
  const description = arg("description","");
  const presetKey = arg("preset","classic_16x9");
  const outBase = arg("out","./out");

  const preset = THEME_PRESETS[presetKey] || THEME_PRESETS.classic_16x9;
  const web = WEBSTORE_PRESETS.default;
  const buf = await fs.promises.readFile(input);

  const jobId = Date.now().toString(36);
  const outRoot = path.resolve(outBase, `${name}__${jobId}`);
  const themeDir = path.join(outRoot,"theme");
  const webDir = path.join(outRoot,"webstore");
  await ensureDir(themeDir);
  await ensureDir(webDir);

  for (const [key,spec] of Object.entries(preset.images)) {
    const out = await coverResize(buf, { w: spec.w, h: spec.h, format: spec.format || "png", alpha: true, position:"center" });
    await fs.promises.writeFile(path.join(themeDir,`${key}.png`), out);
  }

  const manifest = buildManifest({ name, version, description, colors:null, presetImages: preset.images });
  await fs.promises.writeFile(path.join(themeDir,"manifest.json"), JSON.stringify(manifest,null,2), "utf-8");

  await fs.promises.writeFile(path.join(webDir,"icon_128.png"), await coverResize(buf, { ...web.icon, position:"center" }));
  await fs.promises.writeFile(path.join(webDir,"screenshot_1280x800.jpg"), await coverResize(buf, { ...web.screenshot, position:"center" }));
  await fs.promises.writeFile(path.join(webDir,"screenshot_640x400.jpg"), await coverResize(buf, { ...web.screenshot_small, position:"center" }));
  await fs.promises.writeFile(path.join(webDir,"promo_440x280.jpg"), await coverResize(buf, { ...web.promo_small, position:"center" }));
  await fs.promises.writeFile(path.join(webDir,"marquee_1400x560.jpg"), await coverResize(buf, { ...web.promo_marquee, position:"center" }));

  await zipDir(themeDir, path.join(outRoot,"theme.zip"));
  await zipDir(webDir, path.join(outRoot,"webstore-assets.zip"));

  console.log("OK!");
  console.log("Saída:", outRoot);
  console.log("Theme zip:", path.join(outRoot,"theme.zip"));
  console.log("Webstore zip:", path.join(outRoot,"webstore-assets.zip"));
})();
