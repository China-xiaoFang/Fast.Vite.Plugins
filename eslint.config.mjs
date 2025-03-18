import fastChinaFlat from "@fast-china/eslint-config/flat";
import { defineConfig } from "eslint/config";

export default defineConfig(...fastChinaFlat, {
	name: "gejia/ignores",
	ignores: ["src/api", "src/icons"],
});
