import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { mySessionStorage, type PublicData } from "~/services/session.server";

export const authenticator = new Authenticator<PublicData>(mySessionStorage);

authenticator.use(
	new FormStrategy(async ({ form, context }) => ({ ...(context?.user || {}) })),
	"credentials",
);
