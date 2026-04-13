// Tailwind CSS v4 uses @tailwindcss/postcss instead of the old tailwindcss plugin.
// No tailwind.config.ts is needed — configuration is done in CSS via @theme.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
