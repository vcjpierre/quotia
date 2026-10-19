import {
  defineConfig,
  loadEnv,
  type ConfigEnv,
  type UserConfig,
} from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const projectRoot = path.resolve(import.meta.dirname);

export async function createViteConfig({
  command,
  mode,
}: ConfigEnv): Promise<UserConfig> {
  if (command === "build") {
    const env = loadEnv(mode, projectRoot, "VITE_");

    if (!env.VITE_NEON_AUTH_URL) {
      throw new Error(
        "VITE_NEON_AUTH_URL is required for a production build; set it in .env",
      );
    }
  }

  return {
    plugins: [react()],
    preview: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      allowedHosts: [
        'freelance-billing-calculator.up.railway.app'
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "client", "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
    root: path.resolve(projectRoot, "client"),
    envDir: projectRoot,
    build: {
      outDir: path.resolve(projectRoot, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
}

export default defineConfig(createViteConfig);
