import Send from "../../utils/Authentication/response.utils.js";
import { ZodError } from "zod";
class ValidationMiddleware {
    static validateBody(schema) {
        return (req, res, next) => {
            try {
                schema.parse(req.body);
                next();
            }
            catch (error) {
                if (error instanceof ZodError) {
                    // Format errors like { email: ['error1', 'error2'], password: ['error1'] }
                    const formattedErrors = {};
                    error.issues.forEach((err) => {
                        const field = err.path.join("."); // Get the field name
                        if (!formattedErrors[field]) {
                            formattedErrors[field] = [];
                        }
                        formattedErrors[field].push(err.message); // Add validation message
                    });
                    return Send.validationErrors(res, formattedErrors);
                }
                // If it's another type of error, send a generic error response
                return Send.error(res, "Invalid request data");
            }
        };
    }
}
export default ValidationMiddleware;
//# sourceMappingURL=validation.middleware.js.map