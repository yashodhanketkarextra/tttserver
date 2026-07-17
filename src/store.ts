import { configureEnv } from "@louriest/envisor";

export const config = configureEnv(
  {
    DB_URI: "string",
    PORT: "number",
    HOST: "string",
    TOKEN: "string",
  },
  {
    path: ".env.dev",
  },
);
