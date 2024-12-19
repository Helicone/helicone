import { redirect } from "next/navigation";

export default async function Signin({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryString = new URLSearchParams(
    searchParams as Record<string, string>
  ).toString();

  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/signin"
      : "https://us.helicone.ai/signin";

  const redirectUrl = `${baseUrl}${queryString ? `?${queryString}` : ""}`;
  redirect(redirectUrl);
}
