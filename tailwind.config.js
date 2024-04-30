/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        game: ["'Jersey 25'"],
      },
      colors({ colors }) {
        return {
          base: colors.zinc["900"],
        };
      },
    },
  },
  plugins: [],
};
