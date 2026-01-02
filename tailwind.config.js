/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{html,js,jsx,ts,tsx}", "./public/**/*.{html,js,css}"] ,
  theme: {
    extend: {},
    screens: {
      // Standard Tailwind breakpoints
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      // Named project breakpoints for clarity
      mobile: '0px',      // up from 0 — use utility classes like `mobile:` if needed
      tablet: '768px',    // tablet and up
      desktop: '1024px'   // desktop and up
    }
  },
  plugins: [],
}

