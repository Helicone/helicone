ALTER TABLE response
ADD COLUMN helicone_org_id uuid null;
ALTER TABLE response
ADD CONSTRAINT unique_request_helicone_org_id UNIQUE (request, helicone_org_id);
ALTER TABLE request
ADD CONSTRAINT unique_id_helicone_org_id UNIQUE (id, helicone_org_id);