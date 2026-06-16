/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF4500',
        'live-red': '#CC0000',
        'accent-ochre': '#DAA520',
        surface: '#FFFFFF',
        'surface-variant': '#F0F0F0',
        'on-surface': '#000000',
        'on-primary': '#FFFFFF',
        background: '#FFFFFF',
        outline: '#000000',
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        lg: '0px',
        xl: '0px',
        full: '9999px',
      },
      spacing: {
        'row-min-height': '64px',
        'stack-sm': '0.75rem',
        'stack-md': '1.5rem',
        'stack-lg': '2rem',
        gutter: '1.25rem',
        'touch-target': '48px',
        'container-max-width': '448px',
      },
      fontFamily: {
        // 'font-space' utility is used widely in the app; expose it here
        space: ['"Space Grotesk"', 'sans-serif'],
        'headline-lg': ['"Space Grotesk"', 'sans-serif'],
        'section-label': ['"Space Grotesk"', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        caption: ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['28px', { lineHeight: '32px', fontWeight: '700' }],
        'section-label': ['14px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '700' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        caption: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-sm': ['13px', { lineHeight: '16px', fontWeight: '600' }],
      },
      boxShadow: {
        neo: '4px 4px 0px 0px #000000',
        'neo-sm': '2px 2px 0px 0px #000000',
      },
    },
  },
  plugins: [],
};
