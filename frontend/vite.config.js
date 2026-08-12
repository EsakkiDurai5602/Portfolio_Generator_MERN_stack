import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to copy index.html as 404.html for GitHub Pages SPA routing fallback
const githubPagesSpaPlugin = () => {
  return {
    name: 'github-pages-spa',
    closeBundle() {
      const distPath = path.resolve(__dirname, 'dist')
      const indexPath = path.resolve(distPath, 'index.html')
      const fallbackPath = path.resolve(distPath, '404.html')
      
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fallbackPath)
        console.log('✓ Successfully created 404.html fallback for GitHub Pages SPA routing.')
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), githubPagesSpaPlugin()],
  base: '/Portfolio_Generator_MERN_stack/',
})
