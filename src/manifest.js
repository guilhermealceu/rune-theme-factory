export function buildManifest({ name, version, description, colors, presetImages }) {
  // Cores default (bem neutras). Você pode trocar na UI.
  const defaultColors = {
    frame: [32, 33, 36],
    ntp_background: [255, 255, 255],
    tab_text: [255, 255, 255],
    tab_background_text: [210, 210, 210],
    bookmark_text: [255, 255, 255],
    ntp_text: [0, 0, 0],
    ntp_link: [6, 55, 116],
    ntp_header: [150, 150, 150],
    toolbar: [32, 33, 36],
    toolbar_text: [255, 255, 255],
    button_background: [0, 0, 0, 0],
    omnibox_background: [255, 255, 255],
    toolbar_button_icon: [255, 255, 255],
    omnibox_text: [0, 0, 0]
  };

  const themeImages = Object.fromEntries(
    Object.keys(presetImages).map((k) => [k, `${k}.png`])
  );

  return {
    manifest_version: 3,
    version: version || "1.0.0",
    name: name || "RUNE Theme",
    description: description || "",
    theme: {
      images: themeImages,
      colors: { ...defaultColors, ...(colors || {}) },
      tints: { buttons: [0, 0, 1] },
      properties: {
        ntp_background_alignment: "left top",
        ntp_background_repeat: "no-repeat"
      }
    }
  };
}
