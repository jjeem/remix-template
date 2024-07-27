import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "@remix-run/node";
import { Form, Link, useFetcher } from "@remix-run/react";
import { type z, ZodError } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { signupSchema } from "~/lib/validation";
import { authenticator } from "~/services/auth.server";
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
import { createUser } from "./createUser";

export const meta: MetaFunction = () => {
	return [{ title: "Sign up" }, { name: "Signup" }];
};

export default function SignupPage() {
	const fetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
	const data = fetcher.data as Awaited<ReturnType<typeof action>> | undefined;
	const form = useForm<z.infer<typeof signupSchema>>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	function onSubmit(values: z.infer<typeof signupSchema>) {
		fetcher.submit(values, {
			method: "POST",
		});
	}

	return (
		<div className="min-h-dvh flex justify-center">
			<FormProvider {...form}>
				<Form
					onSubmit={form.handleSubmit(onSubmit)}
					className="h-fit min-w-[400px] flex flex-col gap-4 mt-28 p-2 md:p-16"
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
						<Link to="/login" className="flex flex-col">
							<Button variant="outline">login</Button>
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

		const { email, password } = signupSchema.parse({
			email: formData.get("email"),
			password: formData.get("password"),
		});

		const userWithPassword = await createUser({ email, password });

		return await authenticator.authenticate("credentials", request, {
			successRedirect: "/",
			throwOnError: true,
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

		if (error instanceof PrismaClientKnownRequestError) {
			console.error(error.message);
			switch (error.code) {
				case "P2002": {
					return {
						message: "This email is already registered!",
					};
				}
			}
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
