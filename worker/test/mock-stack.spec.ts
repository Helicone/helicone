import { fetchMock } from "cloudflare:test";

export function mockRequiredServices() {
  const callTrackers = {
    s3Called: false,
    loggingCalled: false,
    oauthCalled: false,
  };

  const s3Mock = fetchMock
    .get("http://localhost:9000")
    .intercept({
      path: /.*/,
      method: "PUT",
    })
    .reply(() => {
      callTrackers.s3Called = true;
      return { statusCode: 200, data: "" };
    })
    .persist();

  const loggingMock = fetchMock
    .get("http://localhost:8585")
    .intercept({
      path: "/v1/log/request",
      method: "POST",
    })
    .reply(() => {
      callTrackers.loggingCalled = true;
      return { statusCode: 200, data: { success: true } };
    })
    .persist();

  // Mock Google OAuth endpoint - follow same pattern as working test-utils mocks
  const oauthMock = fetchMock
    .get("https://oauth2.googleapis.com")
    .intercept({
      path: "/token",
      method: "POST",
    })
    .reply(() => {
      callTrackers.oauthCalled = true;
      return {
        statusCode: 200,
        data: {
          access_token: "ya29.mock-access-token-for-tests",
          expires_in: 3600,
          token_type: "Bearer",
        },
      };
    });

  return { s3Mock, loggingMock, oauthMock, callTrackers };
}
