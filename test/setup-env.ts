import { configureEnv } from "@louriest/envisor";

export const testConfig = configureEnv(
  { DB_URI: "string", PORT: "number", HOST: "string", TOKEN: "string" },
  { path: ".env.test" },
);
