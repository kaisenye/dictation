import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry point
        entry: 'electron/main.js',
        onstart(options) {
          if (options.startup) {
            options.startup(['--inspect=5858'])
          }
        },
        vite: {
          build: {
            sourcemap: false,
            minify: false,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.js',
        onstart(options) {
          // Notify the Renderer process to reload the page when the Preload scripts build is complete
          options.reload()
        },
        vite: {
          build: {
            sourcemap: false,
            minify: false,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
    // Plugin to copy database and services files
    {
      name: 'copy-electron-files',
      generateBundle() {
        // Helper function to copy files recursively
        function copyFileRecursive(source, target) {
          if (!fs.existsSync(source)) {
            console.warn(`Source directory does not exist: ${source}`)
            return
          }

          const stats = fs.statSync(source)

          if (stats.isDirectory()) {
            if (!fs.existsSync(target)) {
              fs.mkdirSync(target, { recursive: true })
            }

            const files = fs.readdirSync(source)
            files.forEach((file) => {
              const sourcePath = path.join(source, file)
              const targetPath = path.join(target, file)
              copyFileRecursive(sourcePath, targetPath)
            })
          } else {
            // Only copy regular files, not sockets or other special files
            if (stats.isFile()) {
              const targetDir = path.dirname(target)
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true })
              }
              fs.copyFileSync(source, target)
              console.log(`Copied: ${source} -> ${target}`)
            }
          }
        }

        // Copy database directory
        const dbSourceDir = path.join(__dirname, 'electron', 'database')
        const dbTargetDir = path.join(__dirname, 'dist-electron', 'database')

        if (fs.existsSync(dbSourceDir)) {
          copyFileRecursive(dbSourceDir, dbTargetDir)
        }

        // Copy services directory
        const servicesSourceDir = path.join(__dirname, 'electron', 'services')
        const servicesTargetDir = path.join(__dirname, 'dist-electron', 'services')

        if (fs.existsSync(servicesSourceDir)) {
          copyFileRecursive(servicesSourceDir, servicesTargetDir)
        }

        // Copy utils directory
        const utilsSourceDir = path.join(__dirname, 'electron', 'utils')
        const utilsTargetDir = path.join(__dirname, 'dist-electron', 'utils')

        if (fs.existsSync(utilsSourceDir)) {
          copyFileRecursive(utilsSourceDir, utilsTargetDir)
        }

        // Copy core directory
        const coreSourceDir = path.join(__dirname, 'electron', 'core')
        const coreTargetDir = path.join(__dirname, 'dist-electron', 'core')

        if (fs.existsSync(coreSourceDir)) {
          copyFileRecursive(coreSourceDir, coreTargetDir)
        }
      },
    },
  ],
  server: {
    port: 5173,
  },
  clearScreen: false,
})
