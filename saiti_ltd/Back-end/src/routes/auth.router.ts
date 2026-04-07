import AuthController from "../controllers/Authentication/auth.controller.js";
import BaseRouter, { RouteConfig } from "./router.js";
import ValidationMiddleware from "../middlewares/Authentication/validation.middleware.js";
import authSchema from "../validations/Authentication/auth.schema.js";
import AuthMiddleware from "../middlewares/Authentication/auth.middleware.js";

class AuthRouter extends BaseRouter {
    protected routes(): RouteConfig[] {
        return [
            {
                // login
                method: "post",
                path: "/login",
                middlewares: [
                    ValidationMiddleware.validateBody(authSchema.login)
                ],
                handler: AuthController.login
            },
            {
                // register
                method: "post",
                path: "/register",
                middlewares: [
                    ValidationMiddleware.validateBody(authSchema.register)
                ],
                handler: AuthController.register
            },
            {
                // logout
                method: "post",
                path: "/logout",
                middlewares: [
                    // check if user is logged in
                    AuthMiddleware.authenticateUser
                ],
                handler: AuthController.logout
            },

            {
                // refresh token
                method: "post",
                path: "/refresh-token",
                middlewares: [
                    // checks if refresh token is valid
                    AuthMiddleware.refreshTokenValidation
                ],
                handler: AuthController.refreshToken
            },
        ]
    }
}

export default new AuthRouter().router;