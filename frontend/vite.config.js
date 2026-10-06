import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        collections: resolve(__dirname, 'collections.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        cart: resolve(__dirname, 'cart.html'),
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
      }
    }
  }
});
