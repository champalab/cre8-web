import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        },
        dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react/jsx-dev-runtime',
            'react/jsx-runtime',
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector'
        ]
    },
    server: {
        port: 3000,
        // strictPort: true,
        open: true,
        host: '0.0.0.0',
        proxy: {
            '/influencer/': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true
            }
        },
        // Vite HMR uses eval — required in dev only (not used in production build)
        headers:
            mode === 'development'
                ? {
                      // media-src must allow R2 public URLs — without it, <video> falls back to default-src 'self' and is blocked
                      'Content-Security-Policy':
                          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' ws: wss: http: https:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; font-src 'self' data: https://fonts.gstatic.com; worker-src 'self' blob:;"
                  }
                : undefined
    },
    build: {
        // Avoid eval-based source maps in production (stricter CSP friendly)
        sourcemap: false,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'react-vendor',
                            test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|react-redux|scheduler)/,
                            priority: 30
                        },
                        {
                            name: 'shared-libs',
                            test: /node_modules/,
                            priority: 10
                        }
                    ]
                }
            }
        }
    }
}))
