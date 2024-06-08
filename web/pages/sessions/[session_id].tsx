import { useRouter } from "next/router";
import AuthLayout from "../../components/layout/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { User } from "@supabase/auth-helpers-react";
import { ReactElement, useEffect, useState } from "react";
import Link from "next/link";
import { Chart } from "react-google-charts";

interface SessionDetailProps {
  user: User;
  sessionData: any;
}

const SessionDetail = ({ user, sessionData }: SessionDetailProps) => {
  const router = useRouter();
  const { session_id } = router.query;

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (sessionData) {
      const sessionDetail = sessionData.find(
        (s: any) => s.session_id === session_id
      );
      setSession(sessionDetail);
    }
  }, [session_id, sessionData]);

  const transformData = (requests: any[]) => {
    return [
      [
        { type: "string", label: "Task ID" },
        { type: "string", label: "Task Name" },
        { type: "string", label: "Resource" },
        { type: "date", label: "Start Date" },
        { type: "date", label: "End Date" },
        { type: "number", label: "Duration" },
        { type: "number", label: "Percent Complete" },
        { type: "string", label: "Dependencies" },
      ],
      ...requests.map((request, index) => [
        `Request ${index + 1}`,
        request.path,
        request.path,
        new Date(request.created_at),
        new Date(
          new Date(request.created_at).getTime() + request.response_time
        ),
        null,
        100,
        null,
      ]),
    ];
  };

  const data = session ? transformData(session.requests) : [];

  const options = {
    height: 400,
    gantt: {
      trackHeight: 30,
    },
  };

  return (
    <div>
      <Link href="/sessions" legacyBehavior>
        <a className="text-blue-600 hover:text-blue-800">Back to Sessions</a>
      </Link>
      {session ? (
        <div className="mt-4">
          <h1 className="text-2xl font-bold">Session {session.session_id}</h1>
          <div className="mt-4">
            {data.length > 1 && (
              <Chart
                chartType="Gantt"
                width="100%"
                height="50vh"
                data={data}
                options={options}
              />
            )}
            <div className="mt-4">
              {session.requests.map((request: any, index: number) => (
                <div key={index} className="border-b pb-2 mb-2">
                  <p>
                    <strong>Request ID:</strong> {request.id}
                  </p>
                  <p>
                    <strong>Path:</strong> {request.path}
                  </p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Response Time:</strong> {request.response_time} ms
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

SessionDetail.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default SessionDetail;

export const getServerSideProps = withAuthSSR(async (options) => {
  // Replace with actual data fetching logic if necessary
  const sessionData = [
    {
      session_id: "1",
      count: 10,
      last_used: "2023-05-02T00:00:00Z",
      first_used: "2023-05-01T00:00:00Z",
      path: "/support/query",
      user: "user1",
      requests: [
        {
          id: "req1",
          created_at: "2023-05-01T00:00:00Z",
          path: "/support/query",
          response_time: 1000,
        },
        {
          id: "req2",
          created_at: "2023-05-01T00:01:00Z",
          path: "/support/query",
          response_time: 2000,
        },
      ],
    },
    {
      session_id: "2",
      count: 20,
      last_used: "2023-05-02T00:00:00Z",
      first_used: "2023-05-01T00:00:00Z",
      path: "/support/response",
      user: "user2",
      requests: [
        {
          id: "req3",
          created_at: "2023-05-01T00:00:00Z",
          path: "/support/response",
          response_time: 1500,
        },
        {
          id: "req4",
          created_at: "2023-05-01T00:01:00Z",
          path: "/support/response",
          response_time: 2500,
        },
      ],
    },
  ];

  return {
    props: {
      user: options.userData.user,
      sessionData,
    },
  };
});
