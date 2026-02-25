/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // مهم: منع تعارض Tailwind مع Ant Design
  corePlugins: {
    preflight: false,
  },
};
