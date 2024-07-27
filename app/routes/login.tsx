import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "@remix-run/node";
import { Form, Link, useFetcher } from "@remix-run/react";
import { useForm } from "react-hook-form";
import { type z, ZodError } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import bcrypt from "bcrypt";
import { Button } from "~/components/ui/button";
import {
	FormProvider,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Alert } from "~/components/ui/alert";
import { db } from "~/db";
import { loginSchema } from "~/lib/validation";
import { authenticator } from "~/services/auth.server";

export const meta: MetaFunction = () => {
	return [{ title: "Login" }, { name: "Login" }];
};

export default function LoginPage() {
	const fetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
	const data = fetcher.data as Awaited<ReturnType<typeof action>> | undefined;
	const form = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	function onSubmit(values: z.infer<typeof loginSchema>) {
		fetcher.submit(values, {
			method: "POST",
		});
	}

	return (
		<div className="min-h-dvh flex justify-center">
			<FormProvider {...form}>
				<Form
					onSubmit={form.handleSubmit(onSubmit)}
					className="h-fit w-[400px] flex flex-col gap-4 mt-24 p-2 md:p-16"
				>
					{data?.message && <Alert variant="destructive">{data.message}</Alert>}
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										placeholder="example@gmail.com"
										autoComplete="email"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="password"
										autoComplete="new-password"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex flex-col justify-center gap-2">
						<Button type="submit">Submit</Button>
						<Link to="/signup" className="flex flex-col">
							<Button variant="outline">Sign up</Button>
						</Link>
					</div>
				</Form>
			</FormProvider>
		</div>
	);
}

export async function action({ request }: ActionFunctionArgs) {
	try {
		const formData = await request.clone().formData();

		const { email, password } = loginSchema.parse({
			email: formData.get("email"),
			password: formData.get("password"),
		});

		const userWithPassword = await db.user.findUnique({
			where: { email },
		});

		if (!userWithPassword || !userWithPassword.hashedPassword) {
			throw "Invaild combination of username and password";
		}

		const isMatch = await bcrypt.compare(
			password,
			userWithPassword.hashedPassword,
		);

		if (!isMatch) {
			throw "Invaild combination of username and password";
		}

		return await authenticator.authenticate("credentials", request, {
			successRedirect: "/",
			failureRedirect: "/login",
			context: {
				user: {
					username: userWithPassword.name,
					userId: userWithPassword.id,
					role: userWithPassword.role,
				},
			},
		});
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (error: any) {
		if (error instanceof Response) {
			// let the redirect
			throw error;
		}

		if (error instanceof ZodError) {
			return {
				zodError: error,
			};
		}

		if (typeof error === "string") return { message: error };

		console.error("Unexpeceted error: ", error);
		return {
			message: "Unknown server error",
		};
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const res = await authenticator.isAuthenticated(request, {
		successRedirect: "/",
	});

	return res;
}
