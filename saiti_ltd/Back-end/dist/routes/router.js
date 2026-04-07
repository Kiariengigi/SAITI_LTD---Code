import { Router } from "express";
// Abstract base class for creating routes
export default class BaseRouter {
    // Constructor that initializes the router
    constructor() {
        this.router = Router(); // Create a new Express Router instance
        this.registerRoutes(); // Register routes when the instance is created
    }
    // Private method that registers all the routes defined in the `routes` method
    registerRoutes() {
        this.routes().forEach(({ method, path, handler, middlewares = [] }) => {
            // Use the appropriate HTTP method to register the route, applying any middlewares before the handler
            this.router[method](path, ...middlewares, handler);
        });
    }
}
//# sourceMappingURL=router.js.map