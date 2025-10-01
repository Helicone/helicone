mkdir -p db

echo "generating types"
npx supabase gen types typescript --local > temp.types.ts
echo "types generated, updating local files"
cp temp.types.ts web/db/database.types.ts
cp temp.types.ts worker/supabase/database.types.ts
cp temp.types.ts valhalla/jawn/src/lib/db/database.types.ts
cp temp.types.ts helicone-cron/src/db/database.types.ts
git add web/db/database.types.ts
git add worker/supabase/database.types.ts
git add valhalla/jawn/src/lib/db/database.types.ts
git add helicone-cron/src/db/database.types.ts
rm temp.types.ts
echo "done"