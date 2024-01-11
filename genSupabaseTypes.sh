supabase gen types typescript --local > web/supabase/database.types.ts
supabase gen types typescript --local > worker/supabase/database.types.ts
supabase gen types typescript --local > valhalla/jawn/src/lib/db/database.types.ts

git add web/supabase/database.types.ts
git add worker/supabase/database.types.ts
git add valhalla/jawn/src/db/database.types.ts