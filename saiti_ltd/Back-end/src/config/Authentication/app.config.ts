import * as dotenv from "dotenv";

dotenv.config();

const resolvedPort = Number(process.env.PORT ?? process.env.APP_PORT ?? 4000);

// Render requires binding to 0.0.0.0, not localhost.
const envHost = process.env.APP_HOST?.trim();
const isLoopbackHost = envHost === "localhost" || envHost === "127.0.0.1";
const resolvedHost = !envHost || envHost.length === 0 || isLoopbackHost ? "0.0.0.0" : envHost;

const appConfig = {
    host: resolvedHost,
    port: Number.isFinite(resolvedPort) ? resolvedPort : 4000,
}

export default appConfig;