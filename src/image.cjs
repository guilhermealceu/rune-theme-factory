const sharp = require("sharp");

async function coverResize(inputBuffer, opt) {
  const position = opt.position || "center";
  let pipeline = sharp(inputBuffer, { failOnError: false })
    .rotate()
    .resize(opt.w, opt.h, { fit: "cover", position });

  if (opt.alpha === false) {
    pipeline = pipeline.flatten({ background: "#ffffff" });
  }

  const fmt = String(opt.format || "png").toLowerCase();
  if (fmt === "jpg" || fmt === "jpeg") {
    return await pipeline.jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
  }
  return await pipeline.png({ compressionLevel: 9 }).toBuffer();
}

function clampCrop(crop, meta) {
  const W = meta.width || 0;
  const H = meta.height || 0;
  const left = Math.max(0, Math.min(W - 1, Math.floor(crop.left)));
  const top = Math.max(0, Math.min(H - 1, Math.floor(crop.top)));
  const width = Math.max(1, Math.min(W - left, Math.floor(crop.width)));
  const height = Math.max(1, Math.min(H - top, Math.floor(crop.height)));
  return { left, top, width, height };
}

async function cropResize(inputBuffer, cropRect, opt) {
  // cropRect: { x, y, width, height } vindo do Cropper (em px da imagem original)
  const base = sharp(inputBuffer, { failOnError: false }).rotate();
  const meta = await base.metadata();

  const safe = clampCrop(
    { left: cropRect.x, top: cropRect.y, width: cropRect.width, height: cropRect.height },
    meta
  );

  let pipeline = sharp(inputBuffer, { failOnError: false })
    .rotate()
    .extract(safe)
    .resize(opt.w, opt.h, { fit: "fill" });

  if (opt.alpha === false) {
    pipeline = pipeline.flatten({ background: "#ffffff" });
  }

  const fmt = String(opt.format || "png").toLowerCase();
  if (fmt === "jpg" || fmt === "jpeg") {
    return await pipeline.jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
  }
  return await pipeline.png({ compressionLevel: 9 }).toBuffer();
}

function genericChromeOverlaySvg(w, h) {
  // Overlay genérico: barra superior + “tabs”. Centro fica transparente.
  const barH = Math.round(h * 0.12); // ~12% da altura
  const r = Math.max(10, Math.round(barH * 0.35));
  const pad = Math.round(barH * 0.25);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f6f7f9" />
        <stop offset="1" stop-color="#e9edf3" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
      </filter>
    </defs>

    <!-- Barra superior -->
    <rect x="0" y="0" width="${w}" height="${barH}" fill="url(#g)"/>
    <rect x="0" y="${barH - 1}" width="${w}" height="1" fill="#cfd6e0"/>

    <!-- Aba ativa -->
    <g filter="url(#shadow)">
      <path d="M ${pad} ${barH} 
               L ${pad} ${pad}
               Q ${pad} 6 ${pad + r} 6
               L ${Math.round(w*0.32)} 6
               Q ${Math.round(w*0.32)+r} 6 ${Math.round(w*0.32)+r} ${pad}
               L ${Math.round(w*0.32)+r} ${barH}
               Z" fill="#ffffff"/>
    </g>

    <!-- Omnibox -->
    <rect x="${Math.round(w*0.20)}" y="${Math.round(barH*0.35)}"
          width="${Math.round(w*0.62)}" height="${Math.round(barH*0.45)}"
          rx="${Math.round(barH*0.22)}" fill="#ffffff" stroke="#d7dde6"/>

    <!-- “pontos” -->
    <circle cx="${pad+12}" cy="${Math.round(barH*0.48)}" r="${Math.round(barH*0.10)}" fill="#ff5f57"/>
    <circle cx="${pad+34}" cy="${Math.round(barH*0.48)}" r="${Math.round(barH*0.10)}" fill="#febc2e"/>
    <circle cx="${pad+56}" cy="${Math.round(barH*0.48)}" r="${Math.round(barH*0.10)}" fill="#28c840"/>

    <!-- (Importante) o resto é transparente -->
  </svg>`;
}

async function applyOverlay(baseBuffer, overlayMode, overlayBufferOrNull, size, outFormat) {
  // baseBuffer já está no tamanho final (w/h). Vamos compor overlay e devolver no formato pedido.
  const { w, h } = size;

  let overlayBuf = null;
  if (overlayMode === "generic") {
    const svg = genericChromeOverlaySvg(w, h);
    overlayBuf = await sharp(Buffer.from(svg)).png().toBuffer();
  } else if (overlayMode === "upload" && overlayBufferOrNull) {
    overlayBuf = await sharp(overlayBufferOrNull, { failOnError: false })
      .resize(w, h, { fit: "fill" })
      .png()
      .toBuffer();
  }

  if (!overlayBuf) {
    return baseBuffer;
  }

  // compõe em PNG para preservar alpha do overlay e depois achata se for JPG
  let composed = sharp(baseBuffer, { failOnError: false }).composite([{ input: overlayBuf }]);
  if (outFormat === "jpg" || outFormat === "jpeg") {
    composed = composed.flatten({ background: "#ffffff" }).jpeg({ quality: 92, chromaSubsampling: "4:4:4" });
    return await composed.toBuffer();
  }
  return await composed.png({ compressionLevel: 9 }).toBuffer();
}

async function coverResize(inputBuffer, opt) {
  const position = opt.position || "center";
  let pipeline = sharp(inputBuffer, { failOnError: false })
    .rotate()
    .resize(opt.w, opt.h, { fit: "cover", position });

  // ✅ BLUR opcional (pra frame/toolbar não “denunciar” a imagem repetida)
  if (opt.blur && Number(opt.blur) > 0) {
    pipeline = pipeline.blur(Number(opt.blur)); // ex: 18–30 fica bem “disperso”
  }

  if (opt.alpha === false) {
    pipeline = pipeline.flatten({ background: "#ffffff" });
  }

  const fmt = String(opt.format || "png").toLowerCase();
  if (fmt === "jpg" || fmt === "jpeg") {
    return await pipeline.jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
  }
  return await pipeline.png({ compressionLevel: 9 }).toBuffer();
}

module.exports = { coverResize, cropResize, applyOverlay };
