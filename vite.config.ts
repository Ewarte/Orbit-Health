import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { pwaPlugin } from './scripts/pwaPlugin.ts'
import { portablePlugin } from './scripts/portablePlugin.ts'

export default defineConfig(({ mode }) => {
  const portable = mode === 'portable'
  return {
    // Rutas relativas: la app funciona en cualquier subcarpeta o dirección.
    base: './',
    plugins: [react(), tailwindcss(), pwaPlugin(), portable && portablePlugin()],
    assetsInclude: ['**/*.glb'],
    build: portable
      ? {
          // Un solo archivo: todo (fuentes y modelo 3D) como data URI, JS sin módulos.
          outDir: 'dist-portable',
          assetsInlineLimit: 100 * 1024 * 1024,
          cssCodeSplit: false,
          copyPublicDir: false,
          chunkSizeWarningLimit: 100000,
          rollupOptions: { output: { format: 'iife' as const, inlineDynamicImports: true } },
        }
      : {
          rollupOptions: {
            output: {
              // three.js y react-three en su propio archivo: se descarga y se guarda aparte.
              manualChunks(id: string) {
                if (/node_modules[\\/](three|@react-three)[\\/]/.test(id)) return 'three'
              },
            },
          },
        },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
