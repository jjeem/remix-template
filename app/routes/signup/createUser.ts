import bcrypt from "bcrypt";
import { db } from "~/db";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);

if (!SALT_ROUNDS) {
	console.error("[Error]: Salt variable was not provided!");
	process.exit();
}

export async function createUser({
	email,
	password,
}: { email: string; password: string }) {
	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

	return await db.user.create({
		data: {
			email,
			hashedPassword,
		},
	});
}
