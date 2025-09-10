import { z } from "zod";

export const registerDto = z.object({
    email: z.email(),
    password: z.string().min(8).max(72),
});

export const loginDto = registerDto;

export const tokenResponseDto = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
});

export const userDto = z.object({
    user: z.union([z.string(), z.null()]),
});

export const emailDto = z.object({ email: z.email() });

export type RegisterInput = z.infer<typeof registerDto>;
export type LoginInput = z.infer<typeof loginDto>;
