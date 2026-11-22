import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useCountDown, useHeliconeLogin } from "@/app/pi/useHeliconeLogin";

const mockPost = jest.fn();

jest.mock("@/lib/clients/jawnHook", () => ({
  useJawnClient: () => ({ POST: mockPost }),
}));

jest.mock("@/app/pi/first_page/useTestApiKey", () => ({
  testAPIKey: jest.fn(),
}));

const sessionResponse = (sessionUUID: string | null) => ({
  data: { data: sessionUUID ? { sessionUUID } : null },
});

const advanceSeconds = async (seconds: number) => {
  for (let i = 0; i < seconds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
};

describe("useCountDown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls onFinish once at zero and holds at zero", async () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() => useCountDown(3, onFinish));

    await advanceSeconds(3);
    expect(result.current.countDown).toBe(0);
    expect(onFinish).toHaveBeenCalledTimes(1);

    await advanceSeconds(5);
    expect(result.current.countDown).toBe(0);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("restarts from the full duration on reset", async () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() => useCountDown(3, onFinish));

    await advanceSeconds(3);
    act(() => result.current.reset());
    expect(result.current.countDown).toBe(3);

    await advanceSeconds(3);
    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  it("does not count down when seconds is zero", async () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() => useCountDown(0, onFinish));

    await advanceSeconds(3);
    expect(result.current.countDown).toBe(0);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("leaves no pending timer after unmount", () => {
    const { unmount } = renderHook(() => useCountDown(3, jest.fn()));

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useHeliconeLogin countdown", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockPost.mockReset();
    mockPost.mockImplementation(async (path: string) =>
      path === "/v1/public/pi/session"
        ? sessionResponse("session-1")
        : { data: { data: null } }
    );
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  const sessionCalls = () =>
    mockPost.mock.calls.filter(([path]) => path === "/v1/public/pi/session");

  it("does not restart the countdown when the expiry refetch returns null", async () => {
    const { result } = renderHook(() => useHeliconeLogin(true), { wrapper });
    await waitFor(() => expect(result.current.sessionUUID).toBe("session-1"));

    mockPost.mockImplementation(async (path: string) =>
      path === "/v1/public/pi/session"
        ? sessionResponse(null)
        : { data: { data: null } }
    );

    await advanceSeconds(600);
    await waitFor(() => expect(result.current.sessionUUID).toBeNull());
    expect(sessionCalls()).toHaveLength(2);

    await advanceSeconds(5);
    expect(result.current.countDown).toBe(0);
  });

  it("restarts the countdown when the expiry refetch issues a new session", async () => {
    const { result } = renderHook(() => useHeliconeLogin(true), { wrapper });
    await waitFor(() => expect(result.current.sessionUUID).toBe("session-1"));

    mockPost.mockImplementation(async (path: string) =>
      path === "/v1/public/pi/session"
        ? sessionResponse("session-2")
        : { data: { data: null } }
    );

    await advanceSeconds(600);
    await waitFor(() => expect(result.current.sessionUUID).toBe("session-2"));
    expect(result.current.countDown).toBe(600);
  });
});
