const THEME_PRESETS = {
  classic_16x9: {
    label: "Classic 16:9 (recomendado)",
    images: {
      theme_ntp_background: { w: 1920, h: 1080, format: "png" },
      theme_frame: { w: 1920, h: 1080, format: "png", blur: 24 },
      theme_toolbar: { w: 1920, h: 1080, format: "png", blur: 24 },
      theme_tab_background: { w: 1920, h: 1080, format: "png" }
    }
  },
  nixie_example: {
    label: "Exemplo padrão",
    images: {
      theme_ntp_background: { w: 1024, h: 1536, format: "png" },
      theme_frame: { w: 1536, h: 1024, format: "png" },
      theme_toolbar: { w: 1536, h: 1024, format: "png" },
      theme_tab_background: { w: 1536, h: 1024, format: "png" }
    }
  }
};

const WEBSTORE_PRESETS = {
  default: {
    icon: { w: 128, h: 128, format: "png", alpha: false },
    screenshot: { w: 1280, h: 800, format: "jpg", alpha: false },
    screenshot_small: { w: 640, h: 400, format: "jpg", alpha: false },
    promo_small: { w: 440, h: 280, format: "jpg", alpha: false },
    promo_marquee: { w: 1400, h: 560, format: "jpg", alpha: false }
  }
};

module.exports = { THEME_PRESETS, WEBSTORE_PRESETS };
