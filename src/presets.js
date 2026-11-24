export const THEME_PRESETS = {
  // Preset "padrão" bem aceito em wallpapers.
  // Observação: o Chrome escala; isso aqui é um padrão confortável.
  classic_16x9: {
    label: "Classic 16:9 (recomendado)",
    images: {
      theme_ntp_background: { w: 1920, h: 1080, format: "png" },
      theme_frame:          { w: 1920, h: 1080, format: "png" },
      theme_toolbar:        { w: 1920, h: 1080, format: "png" },
      theme_tab_background: { w: 1920, h: 1080, format: "png" }
    }
  },

  // Preset de exemplo, útil para manter consistência entre temas.
  nixie_example: {
    label: "Exemplo padrão",
    images: {
      theme_ntp_background: { w: 1024, h: 1536, format: "png" },
      theme_frame:          { w: 1536, h: 1024, format: "png" },
      theme_toolbar:        { w: 1536, h: 1024, format: "png" },
      theme_tab_background: { w: 1536, h: 1024, format: "png" }
    }
  }
};

export const WEBSTORE_PRESETS = {
  // Regras comuns da Chrome Web Store (tela do seu print)
  // - ícone 128x128
  // - screenshots: 1280x800 ou 640x400 (sem alpha)
  // - promo pequeno: 440x280 (sem alpha)
  // - marquee: 1400x560 (sem alpha)
  default: {
    icon:      { w: 128,  h: 128,  format: "png", alpha: false },
    screenshot:{ w: 1280, h: 800,  format: "jpg", alpha: false },
    screenshot_small:{ w: 640, h: 400, format: "jpg", alpha: false },
    promo_small:{ w: 440, h: 280, format: "jpg", alpha: false },
    promo_marquee:{ w: 1400, h: 560, format: "jpg", alpha: false }
  }
};
