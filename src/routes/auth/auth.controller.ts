import { Context } from "hono";
import { getMe, loginUser, logoutUser, refreshToken, registerUser } from "./auth.service";
import { LoginUserInput, RegisterUserInput } from "../../db/validators";
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from "../../auth/cookies";
import { ENV } from "../../config/env";
import { parseTtl } from "../../utils/ids";
import { conflictReponse, createdReponse, okReponse, sendResponse, serverErrorReponse, unauthorizedResponse } from "../../utils/response";


export const registerController = async (c: Context) => {
    const { email, passwordHash: password } = await c.req.json<RegisterUserInput>();
    try {
        const result = await registerUser(email, password);
        return createdReponse(c, result);
    } catch (e: any | Error) {
        if (e instanceof Error) {
            return conflictReponse(c, e.message)
        } else {
            return serverErrorReponse(c, e)
        }
    }
}
export const loginController = async (c: Context) => {
    const { email, passwordHash: password } = await c.req.json<LoginUserInput>();
    try {
        const result = await loginUser(email, password, c);
        return okReponse(c, result);
    } catch (e: any | Error) {
        if (e instanceof Error) {
            return unauthorizedResponse(c, e.message);
        } else {
            return serverErrorReponse(c, e);
        }
    }
}

export const refreshController = async (c: Context) => {
    const token = readRefreshCookie(c);
    if (!token) return unauthorizedResponse(c, "No Refresh Cookie Found");

    try {
        const { newAccessToken, newRefresh, oldJti, userId } = await refreshToken(token);
        setRefreshCookie(c, newRefresh, ENV, parseTtl(ENV.REFRESH_TOKEN_TTL));
        return okReponse(c, { accessToken: newAccessToken, refreshToken: newRefresh });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Invalid refresh token") {
                clearRefreshCookie(c, ENV);
                return unauthorizedResponse(c, error.message);
            }
            return serverErrorReponse(c);
        }
        return serverErrorReponse(c);
    }
}

export const logoutController = async (c: Context) => {
    const token = readRefreshCookie(c);
    clearRefreshCookie(c, ENV);
    if (!token) return okReponse(c, { ok: true })
    try {
        await logoutUser(token);
        return okReponse(c, { ok: true })
    } catch (e) {
        if (e instanceof Error) {
            return serverErrorReponse(c, e.message);
        }
        return serverErrorReponse(c);
    }
}

export const meController = async (c: Context) => {
    try {
        const userId = c.get("userId");
        const data = await getMe(userId);
        return okReponse(c, data);
    } catch (e) {
        if (e instanceof Error) {
            return unauthorizedResponse(c, e.message);
        }
        return serverErrorReponse(c);
    }
}



