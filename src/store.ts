import { config } from "dotenv";

const evnFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
config({ path: evnFile });

const envLoader = <T>(varKey: string, transformer: (val: string) => T): T => {
  const varVal = process.env[varKey];
  if (!varVal) throw new Error(`Missing env variable: ${varKey}`);
  return transformer(varVal);
};

export const DB_URI = envLoader("DB_URI", String);
export const PORT = envLoader("PORT", Number);
export const HOST = envLoader("HOST", String);
export const TOKEN = envLoader("TOKEN", String);
