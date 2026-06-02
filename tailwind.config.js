/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          green: '#00a884',
          greenDark: '#005c4b',
          greenLight: '#d9fdd3',
          panel: '#f0f2f5',
          panelDark: '#202c33',
          bgLight: '#efeae2',
          bgDark: '#0b141a',
          bubbleIn: '#ffffff',
          bubbleInDark: '#202c33',
          bubbleOut: '#d9fdd3',
          bubbleOutDark: '#005c4b',
          text: '#111b21',
          textDark: '#e9edef',
          muted: '#667781',
          mutedDark: '#8696a0',
          border: '#e9edef',
          borderDark: '#2a3942',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Helvetica Neue', 'Helvetica', 'Lucida Grande', 'Arial', 'Ubuntu', 'Cantarell', '"Fira Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
