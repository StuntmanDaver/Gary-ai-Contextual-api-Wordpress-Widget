import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Entry point for the chat widget
  build: {
    lib: {
      entry: resolve(__dirname, 'src/chat-widget.js'),
      name: 'GaryAIChatWidget',
      fileName: 'chat-widget',
      formats: ['iife'] // WordPress-compatible IIFE format
    },
    rollupOptions: {
      output: {
        dir: 'assets/js/',
        // Place CSS in assets/css/
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return '../css/[name].[ext]';
          }
          return '[name].[ext]';
        },
        // Ensure single bundle file
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js'
      }
    },
    target: 'es2022',
    minify: 'terser',
    sourcemap: true,
    // Optimize for size (target: 39KB gzipped)
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Development server configuration
  server: {
    port: 3000,
    open: false,
    cors: true
  },
  // CSS configuration for modules
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: 'gary-ai-[local]-[hash:base64:5]'
    }
  },
  // Define WordPress globals
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
