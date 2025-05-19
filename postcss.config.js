module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {}, // nesting 먼저
    tailwindcss: {},
    autoprefixer: {},
  },
};