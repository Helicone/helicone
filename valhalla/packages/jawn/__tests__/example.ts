import { describe, expect, test, afterAll } from "@jest/globals";
import e from "express";
// import { helloWorld } from "../src";
import { createValhallaClient } from "helicone-shared-ts";
import { uuid } from "uuidv4";

require("dotenv").config({
  path: "./.env",
});

describe("make sure the healthcheck endpoints are working (sanity check)", () => {
  test("healthcheck", async () => {
    const health = await fetch("http://127.0.0.1:8585/healthcheck");
    expect(health.status).toBe(200);
    const healthDB = await fetch("http://127.0.0.1:8585/healthcheck-db");
    expect(healthDB.status).toBe(200);
  });
});

const exampleTestKey = "Bearer sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa";

const exampleRequestV1 = JSON.stringify({
  body: { h: "b" },
  url_href: "string",
  provider: "string",
  user_id: "string",
  properties: {},
  helicone_api_key_id: 0,
  helicone_org_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  helicone_proxy_key_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  request_id: uuid(),
  requestReceivedAt: new Date().toISOString(),
});

describe("Make sure the OpenAPI validator is working", () => {
  test("invalid schema", async () => {
    const response = await fetch("http://127.0.0.1:8585/v1/request", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Helicone-Authorization": exampleTestKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request: {
          notBody: { h: "b" },
        },
        response: {
          body: {},
        },
      }),
    });
    expect(response.status).toBe(400);
  });
});

describe("checks to make sure an invalid authorization header is being blocked", () => {
  test("Invalid Auth", async () => {
    const response = await fetch("http://127.0.0.1:8585/v1/request", {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: "Bearer sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqb", //off by one
        "Content-Type": "application/json",
      },
      body: exampleRequestV1,
    });
    console.log(await response.text());
    expect(response.status).toBe(401);
  });
});

describe("Check adding a request puts it into the DB", () => {
  test("Post Request", async () => {
    const valhallaDB = await createValhallaClient();
    const response = await fetch("http://127.0.0.1:8585/v1/request", {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: exampleTestKey,
        "Content-Type": "application/json",
      },
      body: exampleRequestV1,
    });
    const res: any = await response.json();

    expect(response.status).toBe(200);

    expect(res).toMatchObject({
      message: "Request received! :)",
      orgId: "83635a30-5ba6-41a8-8cc6-fb7df941b24a",
    });

    expect(res.requestId).toBeDefined();

    const request = await valhallaDB.query(
      "SELECT * FROM request WHERE id = $1",
      [res.requestId]
    );
    expect(request.error).toBeNull();
    expect(request?.data?.rows.length).toBe(1);

    // Handle the response here
  });
});
