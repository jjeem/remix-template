import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { authenticator } from "~/services/auth.server";

export const meta: MetaFunction = () => {
	return [
		{ title: "New Remix App" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export default function Index() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex flex-col justify-center items-center gap-4 font-sans p-4">
			<h1 className="text-3xl">Welcome to Remix</h1>
			<strong>
				{data.userId} - {data.role}
			</strong>
			<div className="w-fit space-x-4">
				<Button>Click me</Button>
				<Form action="/logout" method="post" className="inline-flex">
					<Button variant="destructive">Logout</Button>
				</Form>
			</div>
		</div>
	);
}

export async function loader({ request }: LoaderFunctionArgs) {
	const res = await authenticator.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	return res;
}
