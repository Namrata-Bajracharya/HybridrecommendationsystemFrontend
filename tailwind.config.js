/* ── tailwind.config.js ──
   Custom Tailwind theme for Kallee Nepal. Colors are warm, minimal,
   earthy tones. Inter is the primary font. Custom border-radius
   gives a soft, modern feel. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#b8865e',    /* warm brown — CTAs, badges, hearts */
        cream: '#faf7f2',     /* page background, soft surfaces */
        'cream-alt': '#f5f0e8', /* alternate cream for hero/sections */
        border: '#e8e2d8',    /* borders, dividers */
        muted: '#8b8178',     /* secondary text, labels */
        dark: '#2c241c',      /* headings, primary text */
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
