// vite.config.ts
import { defineConfig } from "file:///C:/Users/User/Dropbox/code/pray_count/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/User/Dropbox/code/pray_count/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/User/Dropbox/code/pray_count/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  base: "/pray_count/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "\u529F\u8AB2\u7D00\u9304",
        short_name: "\u529F\u8AB2\u7D00\u9304",
        description: "\u4F5B\u6559\u529F\u8AB2\u6B21\u6578\u7D00\u9304\u8207\u5C0F\u7D44\u5171\u4FEE\u7D71\u8A08",
        theme_color: "#8d6e63",
        background_color: "#fbf7f0",
        display: "standalone",
        start_url: "/pray_count/",
        scope: "/pray_count/",
        lang: "zh-TW",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/rest/, /supabase/]
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERyb3Bib3hcXFxcY29kZVxcXFxwcmF5X2NvdW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERyb3Bib3hcXFxcY29kZVxcXFxwcmF5X2NvdW50XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9Vc2VyL0Ryb3Bib3gvY29kZS9wcmF5X2NvdW50L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXG5cbi8vIEdpdEh1YiBQYWdlcyBcdTY3MDNcdTkwRThcdTdGNzJcdTU3MjggaHR0cHM6Ly88XHU1RTMzXHU4NjVGPi5naXRodWIuaW8vcHJheV9jb3VudC9cbi8vIFx1NTZFMFx1NkI2NCBiYXNlIFx1OEEyRFx1NzBCQSAnL3ByYXlfY291bnQvJ1x1MzAwMlx1ODJFNVx1NEY2MFx1NzY4NCByZXBvIFx1NTQwRFx1N0EzMVx1NEUwRFx1NTQwQ1x1RkYwQ1x1NjUzOVx1OTAxOVx1ODhFMVx1NTM3M1x1NTNFRlx1MzAwMlxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogJy9wcmF5X2NvdW50LycsXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uc3ZnJ10sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnXHU1MjlGXHU4QUIyXHU3RDAwXHU5MzA0JyxcbiAgICAgICAgc2hvcnRfbmFtZTogJ1x1NTI5Rlx1OEFCMlx1N0QwMFx1OTMwNCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnXHU0RjVCXHU2NTU5XHU1MjlGXHU4QUIyXHU2QjIxXHU2NTc4XHU3RDAwXHU5MzA0XHU4MjA3XHU1QzBGXHU3RDQ0XHU1MTcxXHU0RkVFXHU3RDcxXHU4QTA4JyxcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjOGQ2ZTYzJyxcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmYmY3ZjAnLFxuICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgIHN0YXJ0X3VybDogJy9wcmF5X2NvdW50LycsXG4gICAgICAgIHNjb3BlOiAnL3ByYXlfY291bnQvJyxcbiAgICAgICAgbGFuZzogJ3poLVRXJyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7IHNyYzogJ2ljb24tMTkyLnBuZycsIHNpemVzOiAnMTkyeDE5MicsIHR5cGU6ICdpbWFnZS9wbmcnIH0sXG4gICAgICAgICAgeyBzcmM6ICdpY29uLTUxMi5wbmcnLCBzaXplczogJzUxMng1MTInLCB0eXBlOiAnaW1hZ2UvcG5nJyB9LFxuICAgICAgICAgIHsgc3JjOiAnaWNvbi01MTIucG5nJywgc2l6ZXM6ICc1MTJ4NTEyJywgdHlwZTogJ2ltYWdlL3BuZycsIHB1cnBvc2U6ICdtYXNrYWJsZScgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgd29ya2JveDoge1xuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrRGVueWxpc3Q6IFsvXlxcL3Jlc3QvLCAvc3VwYWJhc2UvXSxcbiAgICAgIH1cbiAgICB9KVxuICBdXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2UyxTQUFTLG9CQUFvQjtBQUMxVSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBSXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxhQUFhO0FBQUEsTUFDN0IsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFVBQ0wsRUFBRSxLQUFLLGdCQUFnQixPQUFPLFdBQVcsTUFBTSxZQUFZO0FBQUEsVUFDM0QsRUFBRSxLQUFLLGdCQUFnQixPQUFPLFdBQVcsTUFBTSxZQUFZO0FBQUEsVUFDM0QsRUFBRSxLQUFLLGdCQUFnQixPQUFPLFdBQVcsTUFBTSxhQUFhLFNBQVMsV0FBVztBQUFBLFFBQ2xGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsU0FBUztBQUFBLFFBQ1AsMEJBQTBCLENBQUMsV0FBVyxVQUFVO0FBQUEsTUFDbEQ7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
