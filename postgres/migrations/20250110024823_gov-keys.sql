drop policy "only users can view and edit their helicone keys" on "public"."helicone_api_keys";

alter table "public"."helicone_api_keys" add column "governance" boolean not null default false;

REVOKE ALL ON TABLE "public"."helicone_api_keys" FROM anon;
REVOKE ALL ON TABLE "public"."helicone_api_keys" FROM authenticated;



