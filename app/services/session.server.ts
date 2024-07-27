import { createSessionStorage } from "@remix-run/node";
import { db } from "../db";

const SESSION_SECRET = process.env.SESSION_SECRET || "defalult-secret";

if (SESSION_SECRET === "defalult-secret") {
	console.warn(
		"⚠  Secret is not provided in the env variables! \n",
		"Useing default secret!",
	);
}

export type PublicData = {
	username?: string;
	userId?: number;
	role?: string;
};

interface SessionData {
	user: PublicData;
	strategy?: string;
}

export const mySessionStorage = createSessionStorage<SessionData>({
	cookie: {
		name: "_appSession", // use any name you want here
		sameSite: "lax",
		path: "/", // add this so the cookie will work in all routes
		maxAge: 60 * 60 * 24 * 7, // a week
		httpOnly: true,
		secrets: [SESSION_SECRET],
		secure: process.env.NODE_ENV === "production",
	},

	async createData(data, expires) {
		if (!data.user || !data.user.userId) {
			throw { message: "No user" };
		}

		const { id } = await db.session.create({
			data: {
				user: {
					connect: { id: data.user?.userId },
				},
				expiresAt: expires,
				publicData: JSON.stringify(data),
			},
		});

		return `${id}`;
	},

	async readData(_id) {
		const id = Number(_id);
		try {
			const res = await db.session.findUnique({
				where: { id },
				include: { user: { select: { role: true } } },
			});

			if (!res) return null;

			if (res.expiresAt && res.expiresAt.getTime() < new Date().getTime()) {
				// expired
				await db.session.deleteMany({ where: { id } });
				return null;
			}

			if (res.publicData) {
				return JSON.parse(res.publicData);
			}

			return null;
		} catch (error) {
			console.error(error);
			return null;
		}
	},

	async updateData(id, data, expires) {
		// TODO:
	},

	async deleteData(id) {
		await db.session.deleteMany({
			where: { id: Number(id) },
		});
	},
});
