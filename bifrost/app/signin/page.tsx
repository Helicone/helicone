import { redirect } from "next/navigation";

export default async function Signin({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryString = new URLSearchParams(
    searchParams as Record<string, string>
  ).toString();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://us.helicone.ai";
  const baseUrl = `${appUrl}/signin`;

  const redirectUrl = `${baseUrl}${queryString ? `?${queryString}` : ""}`;
  redirect(redirectUrl);
}
