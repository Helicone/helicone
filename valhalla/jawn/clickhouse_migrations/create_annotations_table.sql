-- Create the annotations table in ClickHouse
CREATE TABLE IF NOT EXISTS annotations
(
    -- Primary fields
    id UUID,
    -- dataset_id UUID, Query by dataset_id
    dataset_row_id UUID,
    -- request_id UUID,
    organization_id String,
    
    -- Annotation metadata
    annotation_type Enum8('A/B' = 1, 'Labeling' = 2, 'RL' = 3, 'SFT' = 4),
    annotation_data String, -- JSON string containing the annotation data
    annotator_id String,
    
    -- Timestamps
    created_at DateTime64(3, 'UTC'),
    updated_at DateTime64(3, 'UTC')
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYYYYMM(created_at)`
ORDER BY (organization_id, dataset_id, id, created_at)
SETTINGS index_granularity = 8192;

-- TODO Add indexes in line
-- TODO Make annotation type a string
-- TODO Don't store directly annotation data, store the prompt instead, truncated

-- Create indexes for common queries
ALTER TABLE annotations ADD INDEX idx_dataset_id dataset_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE annotations ADD INDEX idx_request_id request_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE annotations ADD INDEX idx_annotator_id annotator_id TYPE bloom_filter GRANULARITY 1;
ALTER TABLE annotations ADD INDEX idx_annotation_type annotation_type TYPE minmax GRANULARITY 1;

-- Example query to get A/B annotation stats
-- SELECT 
--     count(*) as total,
--     countIf(JSONExtractString(annotation_data, 'choice') = 'a') as choice_a_count,
--     countIf(JSONExtractString(annotation_data, 'choice') = 'b') as choice_b_count,
--     uniqExact(annotator_id) as annotators_count
-- FROM annotations
-- WHERE dataset_id = '...'
-- AND organization_id = '...'
-- AND annotation_type = 'A/B'; 