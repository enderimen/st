import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@scss': resolve(__dirname, 'src/renderer/src/assets/scss')
    },
    extensions: ['.js', '.ts', '.vue', '.json']
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@scss/variables.scss";`
      }
    }
  },
  optimizeDeps: {
    include: ['element-ui']
  },
  build: {
    outDir: 'out/renderer',
    emptyOutDir: true
  }
});