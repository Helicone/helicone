ALTER TABLE response
ADD COLUMN "model" TEXT;
ALTER TABLE request
ADD COLUMN "model" TEXT;
ALTER TABLE request
ADD COLUMN "model_override" TEXT;