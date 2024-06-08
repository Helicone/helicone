export const useSessionsPage = ({
  timeFilter,
  timeZoneDifference,
  dbIncrement,
}: {
  timeFilter: any;
  timeZoneDifference: number;
  dbIncrement: string;
}) => {
  const overTimeData = {
    sessions: {
      data: {
        data: [
          { time: "2023-05-01T00:00:00Z", count: 10 },
          { time: "2023-05-02T00:00:00Z", count: 20 },
        ],
      },
    },
  };

  const metrics = {
    totalSessions: {
      data: {
        data: 30,
      },
    },
    totalUsers: {
      data: {
        data: 5,
      },
    },
    timeSpent: {
      data: {
        data: 120,
      },
    },
    topSessions: {
      data: {
        data: [
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
        ],
      },
    },
  };

  const isAnyLoading = false;

  return {
    overTimeData,
    metrics,
    isAnyLoading,
  };
};

export interface SessionsPageData {}
