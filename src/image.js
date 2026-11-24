import sharp from "sharp";

/**
 * Redimensiona no estilo "cover": mantém proporção e corta sobras.
 * @param {Buffer} inputBuffer
 * @param {object} opt
 * @param {number} opt.w
 * @param {number} opt.h
 * @param {"png"|"jpg"|"jpeg"} opt.format
 * @param {boolean} [opt.alpha] - se false, remove alpha (flatten)
 * @param {"center"|"top"|"left"|"right"|"bottom"|"north"|"northeast"|"northwest"|"south"|"southeast"|"southwest"} [opt.position]
 */
export async function coverResize(inputBuffer, opt) {
  const position = opt.position || "center";

  let pipeline = sharp(inputBuffer, { failOnError: false })
    .rotate() // respeita EXIF
    .resize(opt.w, opt.h, { fit: "cover", position });

  // Remover alpha quando precisa (WebStore geralmente pede sem alpha)
  if (opt.alpha === false) {
    pipeline = pipeline.flatten({ background: "#ffffff" });
  }

  const fmt = (opt.format || "png").toLowerCase();
  if (fmt === "jpg" || fmt === "jpeg") {
    return await pipeline.jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
  }
  return await pipeline.png({ compressionLevel: 9 }).toBuffer();
}
