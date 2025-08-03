/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "/var/www/smartcount/dist/**/*.{html,js,ts,jsx,tsx}}", // Adjust paths as needed
    ],
    theme: {
        extend: {
            colors: {
                apptext: "#284763",       // Dark Blue
                primary: "#00A99D",       // Teal
                secondary: "#007D7A",     // Deep Teal
                accent: "#D0021B",        // Rocket Red
                highlight: "#4A90E2",     // Sky Blue
                neutral: {
                    light: "#FFFFFF",       // Cloud White
                    dark: "#1A2A3A",        // Graphite Blue
                    mist: "#B0BEC5",        // Mist Grey
                    slate: "#455A64",       // Slate Grey
                },
            },
        },
    },
    plugins: [],
}