import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { ORG_ID_COOKIE_KEY } from "@/lib/constants";
import Cookies from "js-cookie";
import { useMemo, useEffect } from "react";

export default function AuthDebug() {
  const user = useUser();
  const session = useSession();
  const router = useRouter();

  const orgFromCookie = useMemo(() => Cookies.get(ORG_ID_COOKIE_KEY) ?? "", []);
  const supabase = useSupabaseClient();
  const testQuery = useQuery({
    queryKey: ["test"],
    queryFn: async () => {
      return await supabase.from("organization").select("*");
    },
  });

  const testQueryBackend = useQuery({
    queryKey: ["testBackend"],
    queryFn: async () => {
      return await fetch("/api/auth-debug").then((res) => res.json());
    },
  });
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAll = () => {
    const allData = {
      user,
      session,
      testQuery: testQuery.data,
      testQueryBackend: testQueryBackend.data,
    };
    copyToClipboard(JSON.stringify(allData, null, 2));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="text-lg font-semibold text-gray-800">
              Current User:{" "}
              <span className="font-normal text-gray-600">{user.email}</span>
            </div>
            <div className="text-lg font-semibold text-gray-800">
              Org from cookie:{" "}
              <span className="font-normal text-gray-600">
                {orgFromCookie || "None"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={copyAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Copy All Data
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              User Information
            </h2>
            <button
              onClick={() => copyToClipboard(JSON.stringify(user, null, 2))}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Session Information
            </h2>
            <button
              onClick={() => copyToClipboard(JSON.stringify(session, null, 2))}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Test Client PostGrest Query Results
            </h2>
            <button
              onClick={() =>
                copyToClipboard(JSON.stringify(testQuery, null, 2))
              }
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
            {JSON.stringify(testQuery, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Test Backend Query Results
            </h2>
            <button
              onClick={() =>
                copyToClipboard(JSON.stringify(testQueryBackend, null, 2))
              }
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
            {JSON.stringify(testQueryBackend, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
