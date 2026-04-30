/** @type {import('tailwindcss').Config} */

module.exports = {
  // Supprimé: darkMode: ["class"] (NativeWind gère le dark mode différemment)
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    "./services/**/*.{js,jsx,ts,tsx}",
    "./store/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F3F6F9",
        foreground: "#061438",
        card: "#FFFFFF",
        primary: "#1DABFC",
        secondary: "#061438",
        muted: "#EBF0FE",
        border: "#DBEFFB",
        "mylegal-navy": "#061438",
        "mylegal-ocean": "#1DABFC",
        "mylegal-pale": "#DBEFFB",
        "mylegal-cloud": "#EBF0FE",
        "mylegal-fog": "#F3F6F9",
        "mylegal-steel": "#718696"
      },
      borderRadius: {
        lg: "16px",    // Sur mobile, on utilise des pixels au lieu de "rem"
        xl: "20px",
        "2xl": "24px"
      },
      // Note : Les keyframes ont été retirés car React Native utilise l'API Animated (comme nous l'avons fait dans le ToastStack)
    }
  },
  plugins: []
};