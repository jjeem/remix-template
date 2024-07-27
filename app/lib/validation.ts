import z from "zod";

export const role = z.enum(["USER", "ADMIN"]).default("USER");

export const email = z
	.string()
	.email()
	.transform((str) => str.toLowerCase().trim());

export const password = z
	.string()
	.min(8, "Password must contain at least 8 characters")
	.max(100, "Password must not exceed 100 characters");

export const loginSchema = z.object({
	email,
	password,
});

export const signupSchema = z.object({
	email,
	password,
	// username: z.string(),
});
