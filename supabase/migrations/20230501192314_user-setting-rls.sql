create policy "Enable insert access for all users"
on "public"."user_settings"
as permissive
for insert
to public
with check ((auth.uid() = "user"));



