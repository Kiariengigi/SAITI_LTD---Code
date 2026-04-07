import BaseRouter from "./router.js";
import AuthMiddleware from "../middlewares/Authentication/auth.middleware.js";
import UserController from "../controllers/Authentication/user.controller.js";
class UserRoutes extends BaseRouter {
    routes() {
        return [
            {
                // get user info
                method: "get",
                path: "/info", // api/user/info
                middlewares: [
                    AuthMiddleware.authenticateUser
                ],
                handler: UserController.getUser
            },
        ];
    }
}
export default new UserRoutes().router;
//# sourceMappingURL=user.router.js.map