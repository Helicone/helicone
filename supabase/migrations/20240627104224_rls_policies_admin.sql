CREATE POLICY "Enable read access for authenticated users"
ON public.organization
FOR INSERT 
TO authenticated 
WITH CHECK (true);

