import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import sassDts from 'vite-plugin-sass-dts'

export default defineConfig({
    plugins: [
        // Generate .d.ts files for SCSS modules
        sassDts(),
        react()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    server: {
        port: 8401,
        host: true,
        allowedHosts: ["getgadgets.toolbox-io.ru"]
    }
})