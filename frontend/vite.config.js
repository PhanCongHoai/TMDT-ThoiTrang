import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync } from 'node:fs';

export default defineConfig({
  // Classic scripts use window globals and must retain their execution order.
  plugins: [{
    name: 'copy-classic-browser-assets',
    writeBundle(output) {
      for (const directory of ['js', 'assets']) {
        cpSync(resolve(__dirname, directory), resolve(output.dir, directory), { recursive: true });
      }
    }
  }],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy: {
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        collections: resolve(__dirname, 'collections.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        cart: resolve(__dirname, 'cart.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        shipping: resolve(__dirname, 'shipping.html'),
        wishlist: resolve(__dirname, 'wishlist.html'),
        login: resolve(__dirname, 'login.html'),
        profile: resolve(__dirname, 'profile.html'),
        admin: resolve(__dirname, 'admin.html'),
        blog: resolve(__dirname, 'blog.html'),
        blogDetail: resolve(__dirname, 'blog-detail.html'),
        warrantyPolicy: resolve(__dirname, 'warranty-policy.html'),
        returnPolicy: resolve(__dirname, 'return-policy.html'),
        shippingPolicy: resolve(__dirname, 'shipping-policy.html'),
        privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
        shipper: resolve(__dirname, 'shipper.html'),
        adminDispatch: resolve(__dirname, 'admin-dispatch.html'),
      }
    }
  }
});
