
alter table "public"."request" add constraint "request_helicone_user_fkey" FOREIGN KEY (helicone_user) REFERENCES auth.users(id) not valid;

alter table "public"."request" validate constraint "request_helicone_user_fkey";

