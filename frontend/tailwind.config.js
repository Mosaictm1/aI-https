/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary Theme Colors
                'deep-teal': {
                    DEFAULT: '#146152',
                    50: '#1a7a66',
                    100: '#146152',
                    200: '#0f4a3e',
                    300: '#0a332a',
                    400: '#051c17',
                },
                'medium-green': {
                    DEFAULT: '#44803F',
                    50: '#5a9954',
                    100: '#44803F',
                    200: '#336630',
                    300: '#224d21',
                    400: '#113312',
                },
                'lime-green': {
                    DEFAULT: '#B4CF66',
                    50: '#c7dc8a',
                    100: '#B4CF66',
                    200: '#a1c242',
                    300: '#8aaa34',
                    400: '#739226',
                },
                'accent-yellow': {
                    DEFAULT: '#FFEC5C',
                    50: '#fff5a3',
                    100: '#FFEC5C',
                    200: '#ffe32e',
                    300: '#ffda00',
                    400: '#d1b300',
                },
                'action-orange': {
                    DEFAULT: '#FF5A33',
                    50: '#ff8a6d',
                    100: '#FF5A33',
                    200: '#ff2d00',
                    300: '#cc2400',
                    400: '#991b00',
                },
                // Semantic Colors
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: 'hsl(var(--card))',
                'card-foreground': 'hsl(var(--card-foreground))',
                popover: 'hsl(var(--popover))',
                'popover-foreground': 'hsl(var(--popover-foreground))',
                primary: 'hsl(var(--primary))',
                'primary-foreground': 'hsl(var(--primary-foreground))',
                secondary: 'hsl(var(--secondary))',
                'secondary-foreground': 'hsl(var(--secondary-foreground))',
                muted: 'hsl(var(--muted))',
                'muted-foreground': 'hsl(var(--muted-foreground))',
                accent: 'hsl(var(--accent))',
                'accent-foreground': 'hsl(var(--accent-foreground))',
                destructive: 'hsl(var(--destructive))',
                'destructive-foreground': 'hsl(var(--destructive-foreground))',
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            fontFamily: {
                sans: ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
                arabic: ['Cairo', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            boxShadow: {
                'glow-yellow': '0 0 20px rgba(255, 236, 92, 0.3)',
                'glow-orange': '0 0 20px rgba(255, 90, 51, 0.3)',
                'glow-lime': '0 0 20px rgba(180, 207, 102, 0.3)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(255, 236, 92, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(255, 236, 92, 0.6)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                },
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
