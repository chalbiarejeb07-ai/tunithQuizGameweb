import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Firebase pèse l'essentiel du bundle : on l'isole dans son propre
        // fichier pour qu'il soit mis en cache indépendamment du code du jeu,
        // qui lui change à chaque déploiement.
        advancedChunks: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@?firebase|@grpc|idb|protobufjs)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
