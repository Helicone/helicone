import { Body, Controller, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
// Hosting screenshots via external image service (e.g., Imgur)
import { randomUUID } from "crypto";

type ShareScope = "dashboard" | "metrics" | "requests" | "logs";

@Route("/v1")
@Tags("Share")
export class ShareController extends Controller {
  @Security("api_key")
  @Post("/share/screenshot")
  public async createShareScreenshot(
    @Body()
    body: {
      name?: string | null;
      expires_at?: string | null;
      image_base64?: string; // optional if we later generate on backend
    },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<{ id: string; url: string }, string>> {
    try {
      const orgId = request.authParams.organizationId;
      if (!orgId) {
        this.setStatus(401);
        return err("Unauthorized");
      }

      const id = randomUUID();

      // Store link metadata (no filters needed for screenshot-only)
      const { error: insertErr } = await dbExecute(
        `insert into public_share_link (
            id, organization_id, scope, filters, time_start, time_end, name,
            allow_request_bodies, created_by, expires_at, revoked
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)`,
        [
          id,
          orgId,
          "metrics",
          null,
          null,
          null,
          body.name ?? null,
          false,
          request.authParams.userId,
          body.expires_at ?? null,
        ],
      );
      if (insertErr) {
        this.setStatus(500);
        return err(insertErr);
      }

      // If image provided, upload to external hosting (e.g., Imgur)
      let imageUrl: string | null = null;
      if (body.image_base64) {
        try {
          const clientId = process.env.IMGUR_CLIENT_ID;
          const match = body.image_base64.match(/^data:(.*?);base64,(.*)$/);
          const base64Data = match ? match[2] : body.image_base64;
          if (clientId && base64Data) {
            const form = new URLSearchParams();
            form.set("image", base64Data);
            form.set("type", "base64");
            const resp = await fetch("https://api.imgur.com/3/image", {
              method: "POST",
              headers: {
                Authorization: `Client-ID ${clientId}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: form.toString(),
            });
            const json = (await resp.json()) as any;
            if (resp.ok && json?.data?.link) {
              imageUrl = json.data.link as string;
            }
          }
        } catch (_) {
          // best-effort
        }
      }

      // Public consumable URL for this share id
      const url = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://us.helicone.ai"}/share/${id}`;

      this.setStatus(201);
      return ok({ id, url });
    } catch (e: any) {
      this.setStatus(500);
      return err(String(e?.message ?? e));
    }
  }
  @Security("api_key")
  @Post("/share")
  public async createShare(
    @Body()
    body: {
      scope: ShareScope;
      filters?: unknown;
      time_start?: string | null;
      time_end?: string | null;
      name?: string | null;
      allow_request_bodies?: boolean | null;
      expires_at?: string | null;
    },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<{ id: string }, string>> {
    try {
      const orgId = request.authParams.organizationId;
      if (!orgId) {
        this.setStatus(401);
        return err("Unauthorized");
      }

      const id = randomUUID();
      const { error } = await dbExecute(
        `insert into public_share_link (
            id, organization_id, scope, filters, time_start, time_end, name,
            allow_request_bodies, created_by, expires_at, revoked
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)`,
        [
          id,
          orgId,
          body.scope,
          imageUrl
            ? JSON.stringify({ ...(body.filters as any), image_url: imageUrl })
            : body.filters
            ? JSON.stringify(body.filters)
            : null,
          body.time_start ?? null,
          body.time_end ?? null,
          body.name ?? null,
          body.allow_request_bodies ?? false,
          request.authParams.userId,
          body.expires_at ?? null,
        ],
      );

      if (error) {
        this.setStatus(500);
        return err(error);
      }

      this.setStatus(201);
      return ok({ id });
    } catch (e: any) {
      this.setStatus(500);
      return err(String(e?.message ?? e));
    }
  }

  @Get("/public/share/{id}")
  public async getShare(
    @Path() id: string,
  ): Promise<
    Result<
      {
        id: string;
        organization_id: string;
        scope: ShareScope;
        filters: unknown | null;
        time_start: string | null;
        time_end: string | null;
        name: string | null;
        allow_request_bodies: boolean;
      },
      string
    >
  > {
    const now = new Date().toISOString();
    const { data, error } = await dbExecute<{
      id: string;
      organization_id: string;
      scope: ShareScope;
      filters: any | null;
      time_start: string | null;
      time_end: string | null;
      name: string | null;
      allow_request_bodies: boolean;
    }>(
      `select id, organization_id, scope, filters, time_start, time_end, name, allow_request_bodies
       from public_share_link
       where id = $1 and revoked = false and (expires_at is null or expires_at > $2)
       limit 1`,
      [id, now],
    );

    if (error) {
      this.setStatus(500);
      return err(error);
    }
    if (!data || data.length === 0) {
      this.setStatus(404);
      return err("Not found");
    }
    this.setStatus(200);
    return ok(data[0]);
  }
}


