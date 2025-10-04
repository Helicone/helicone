import { redirect } from "next/navigation";

export default async function Signin({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryString = new URLSearchParams(
    searchParams as Record<string, string>,
  ).toString();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://us.helicone.ai");
  const baseUrl = `${appUrl}/signin`;

  const redirectUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
  redirect(redirectUrl);
}
