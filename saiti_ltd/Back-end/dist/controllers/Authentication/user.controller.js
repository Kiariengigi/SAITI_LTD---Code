var _a;
import Send from "../../utils/Authentication/response.utils.js";
import { prisma } from "../../db.js";
class UserController {
}
_a = UserController;
/**
 * Get the user information based on the authenticated user.
 * The userId is passed from the AuthMiddleware.
 */
UserController.getUser = async (req, res) => {
    try {
        const userId = req.userId; // Extract userId from the authenticated request
        // Fetch the user data from the database (Prisma in this case)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                // Add other fields you want to return
            }
        });
        // If the user is not found, return a 404 error
        if (!user) {
            return Send.notFound(res, {}, "User not found");
        }
        // Return the user data in the response
        return Send.success(res, { user });
    }
    catch (error) {
        console.error("Error fetching user info:", error);
        return Send.error(res, {}, "Internal server error");
    }
};
export default UserController;
//# sourceMappingURL=user.controller.js.map