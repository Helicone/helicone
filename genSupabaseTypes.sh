mkdir -p db
supabase gen types typescript --local > db/temp.types.ts
cp db/temp.types.ts web/db/database.types.ts
cp db/temp.types.ts worker/supabase/database.types.ts
cp db/temp.types.ts valhalla/jawn/src/lib/db/database.types.ts
cp db/temp.types.ts helicone-cron/src/db/database.types.ts
git add web/db/database.types.ts
git add worker/supabase/database.types.ts
git add valhalla/jawn/src/lib/db/database.types.ts
git add helicone-cron/src/db/database.types.ts
rm db/temp.types.ts