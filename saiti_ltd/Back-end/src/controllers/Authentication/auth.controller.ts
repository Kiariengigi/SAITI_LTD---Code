import Send from "../../utils/Authentication/response.utils.js"
import { prisma } from "../../db.js";
import { Request, Response } from "express";
import authSchema from "../../validations/Authentication/auth.schema.js";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import authConfig from "../../config/Authentication/auth.config.js";

class AuthController {
    static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return Send.error(res, null, "Invalid credentials");

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash); // ← passwordHash
        if (!isPasswordValid) return Send.error(res, null, "Invalid credentials.");

        const accessToken = jwt.sign({ userId: user.id }, authConfig.secret, { expiresIn: authConfig.secret_expires_in as any });
        const refreshToken = jwt.sign({ userId: user.id }, authConfig.refresh_secret, { expiresIn: authConfig.refresh_secret_expires_in as any });

        await prisma.user.update({
            where: { email },
            data: { refreshToken } // ← needs refreshToken field in schema
        });

        res.cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 15 * 60 * 1000, sameSite: "strict" });
        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000, sameSite: "strict" });

        return Send.success(res, {
            id: user.id,
            fullName: user.fullName, // ← fullName not username
            email: user.email
        });
    } catch (error) {
        console.error("Login Failed:", error);
        return Send.error(res, null, "Login failed.");
    }
}
    static register = async (req: Request, res: Response) => {
    const { fullName, email, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return Send.error(res, null, "Email is already in use.");

        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash: await bcrypt.hash(password, 10),
                roleType: "merchant" // set a default or accept from body
            }
        });
        const accessToken = jwt.sign(
            { userId: newUser.id },
            authConfig.secret,
            { expiresIn: authConfig.secret_expires_in as any }
        );
        const refreshToken = jwt.sign(
            { userId: newUser.id },
            authConfig.refresh_secret,
            { expiresIn: authConfig.refresh_secret_expires_in as any }
        );

        // 3. Save refresh token to DB
        await prisma.user.update({
            where: { id: newUser.id },
            data: { refreshToken }
        });

        // 4. Set cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
            sameSite: "strict"
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: "strict"
        });
        
        return Send.success(res, {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email
        }, "User successfully registered.");
    } catch (error) {
        console.error("Registration failed:", error);
        return Send.error(res, null, "Registration failed.");
    }
}
    static logout = async (req: Request, res: Response) => {
        try {
            // 1. We will ensure the user is authenticated before running this controller
            //    The authentication check will be done in the middleware (see auth.routes.ts).
            //    The middleware will check the presence of a valid access token in the cookies.

            // 2. Remove the refresh token from the database (optional, if using refresh tokens)
            const userId = (req as any).user?.userId;  // Assumed that user data is added by the middleware
            if (userId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { refreshToken: null }  // Clear the refresh token from the database
                });
            }

            // 3. Remove the access and refresh token cookies
            // We clear both cookies here (accessToken and refreshToken)
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

            // 4. Send success response after logout
            return Send.success(res, null, "Logged out successfully.");

        } catch (error) {
            // 5. If an error occurs, return an error response
            console.error("Logout failed:", error); // Log the error for debugging
            return Send.error(res, null, "Logout failed.");
        }
    }
    static refreshToken = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId;  // Get userId from the refreshTokenValidation middleware
            const refreshToken = req.cookies.refreshToken;  // Get the refresh token from cookies

            // Check if the refresh token has been revoked
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || !user.refreshToken) {
                return Send.unauthorized(res, "Refresh token not found");
            }

            // Check if the refresh token in the database matches the one from the client
            if (user.refreshToken !== refreshToken) {
                return Send.unauthorized(res, { message: "Invalid refresh token" });
            }

            // Generate a new access token
            const newAccessToken = jwt.sign(
                { userId: user.id },
                authConfig.secret,
                { expiresIn: authConfig.secret_expires_in as any }
            );

            // Send the new access token in the response
            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000,  // 15 minutes
                sameSite: "strict"
            });

            return Send.success(res, { message: "Access token refreshed successfully" });

        } catch (error) {
            console.error("Refresh Token failed:", error);
            return Send.error(res, null, "Failed to refresh token");
        }
    }
}

export default AuthController;