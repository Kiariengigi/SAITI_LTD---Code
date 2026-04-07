import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.router.js";
import appConfig from "./config/Authentication/app.config.js";
import userRoutes from "./routes/user.router.js";
class App {
    constructor() {
        this.app = express();
        this.initMiddlewares();
        this.initRoutes();
    }
    initMiddlewares() {
        this.app.use(express.json());
        this.app.use(cookieParser());
        this.app.use(cors({
            origin: [
                'http://localhost:5173', // your frontend url
                'https://mywebsite.com' // your production url optional
            ],
            methods: ["GET", "POST", "DELETE"],
            credentials: true
        }));
    }
    initRoutes() {
        // /api/auth/*
        this.app.use("/api/auth", authRoutes);
        // /api/user/*
        this.app.use("/api/user", userRoutes);
    }
    start() {
        const { port, host } = appConfig;
        this.app.listen(port, host, () => {
            console.log(`server is running on http://${host}:${port}`);
        });
    }
}
export default App;
//# sourceMappingURL=app.js.map