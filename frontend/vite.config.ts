import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sassDts from 'vite-plugin-sass-dts';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        sassDts({
            enabledMode: ['development', 'production'],
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 8401,
        host: true
    },
    base: '/',
    publicDir: 'public',
});
