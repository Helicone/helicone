import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AiFillGithub } from "react-icons/ai";

export default function NavBar() {
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  return (
    <div className="w-full py-5 h-full">
      <div className="flex flex-col items-center md:flex-row md:justify-between md:items-top mx-10 gap-3">
        <div className="flex flex-row justify-start items-top gap-5">
          <div
            className="text-sm font-semibold ml-2 hover:cursor-pointer"
            onClick={() => {
              router.push("/");
            }}
          >
            Home
          </div>
          <div
            className="text-sm font-semibold ml-2 hover:cursor-pointer"
            onClick={() => {
              router.push("/dashboard");
            }}
          >
            Dashboard
          </div>
          <Link
            className="text-sm font-semibold ml-2 hover:cursor-pointer"
            href={"https://discord.gg/2TkeWdXNPQ"}
          >
            Discord
          </Link>
        </div>

        <div>
          <div className="flex flex-row justify-center md:justify-end items-center gap-5">
            {!user ? (
              <>
                <Link
                  className="text-sm font-semibold ml-2 hover:cursor-pointer"
                  href="/login"
                >
                  Login
                </Link>
                {" / "}
                <Link
                  className="text-sm font-semibold ml-2 hover:cursor-pointer"
                  href="/register"
                >
                  Signup
                </Link>
              </>
            ) : (
              <>
                <div
                  className="text-sm font-semibold  hover:cursor-pointer"
                  onClick={() => {
                    router.push("/settings/keys");
                  }}
                >
                  Keys
                </div>
                <div
                  className="text-sm font-semibold hover:cursor-pointer"
                  onClick={() => {
                    supabaseClient.auth.signOut().then(() => {
                      router.push("/");
                    });
                  }}
                >
                  Logout
                </div>
                <Link
                  href="https://github.com/Helicone/valyr"
                  className="text-lg font-semibold ml-2 hover:cursor-pointer"
                >
                  <AiFillGithub />
                </Link>
              </>
            )}
          </div>
          {!user || (
            <div className="text-xs font-semibold mt-2 opacity-50">
              <i>{user.email}</i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
