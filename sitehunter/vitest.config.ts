import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
// fileURLToPath evita o caminho inválido "/C:/..." no Windows
export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } } });
