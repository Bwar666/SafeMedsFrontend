/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        purpule:{
          200: "#6366F1",
          100: "#8B5CF6"
        },
        white:{
          200: "#F3F4F6",
          100: "#EFF6FF"
        },
        green: {
          100: "#10B981",
        }
      },
      fontFamily: {
        'lato-thin': ['Lato-Thin'],
        'lato-light': ['Lato-Light'],
        'lato': ['Lato-Regular'],
        'lato-bold': ['Lato-Bold'],
        'lato-black': ['Lato-Black'],
        'merri-light': ['Merriweather-Light'],
        'merri-medium': ['Merriweather-Medium'],
        'merri': ['Merriweather-Regular'],
        'merri-semibold': ['Merriweather-SemiBold'],
      },
    },
  },
  plugins: [],
}