CREATE UNIQUE INDEX experiments_waitlist_email_key ON public.experiments_waitlist USING btree (email);

alter table "public"."experiments_waitlist" add constraint "experiments_waitlist_email_key" UNIQUE using index "experiments_waitlist_email_key";


