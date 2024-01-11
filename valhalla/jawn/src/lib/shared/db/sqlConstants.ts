export const modelSQL = `coalesce(request.body ->> 'model'::text, request.body ->> 'model'::text)`;
