import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function NavBar() {
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  return (
    <div className="w-full py-5 h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mx-10 gap-3">
        <div className="flex flex-row justify-start items-center gap-5">
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
        </div>
        {!user || <div className="text-sm font-semibold ">{user.email}</div>}
        <div className="flex flex-row justify-end items-center gap-5">
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
                  supabaseClient.auth.signOut();
                  router.push("/");
                }}
              >
                Logout
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
