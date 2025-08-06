import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
       // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
       // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        //  'process.env.DB_HOST': JSON.stringify(env.DB_HOST),
        //  'process.env.DB_PORT': JSON.stringify(env.DB_PORT),
        //  'process.env.DB_NAME': JSON.stringify(env.DB_NAME),
         // 'process.env.DB_USER': JSON.stringify(env.DB_USER),
         // 'process.env.DB_PASSWORD': JSON.stringify(env.DB_PASSWORD),
         /// 'process.env.JWT_SECRET': JSON.stringify(env.JWT_SECRET),
        //  'process.env.AWS_REGION': JSON.stringify(env.AWS_REGION),
        //  'process.env.AWS_BUCKET_NAME': JSON.stringify(env.AWS_BUCKET_NAME),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
