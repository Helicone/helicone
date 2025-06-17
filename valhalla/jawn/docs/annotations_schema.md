# Annotations Schema Documentation

## Overview

The annotations system allows users to annotate requests within datasets. This document describes the schema and API for working with annotations, starting with A/B annotations.

## Schema Design

### ClickHouse Table: `annotations`

The annotations table stores all annotation data with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier for the annotation |
| dataset_id | UUID | The dataset this annotation belongs to |
| dataset_row_id | UUID | The specific dataset row being annotated |
| request_id | UUID | The original request ID being annotated |
| organization_id | String | Organization that owns this annotation |
| annotation_type | Enum | Type of annotation: 'A/B', 'Labeling', 'RL', or 'SFT' |
| annotation_data | String (JSON) | JSON data containing annotation-specific fields |
| annotator_id | String | ID of the user who created the annotation |
| created_at | DateTime64 | When the annotation was created |
| updated_at | DateTime64 | When the annotation was last updated |

### A/B Annotation Data Structure

For A/B annotations, the `annotation_data` JSON contains:

```json
{
  "prompt": "The prompt text",
  "response_a": "First response option",
  "response_b": "Second response option",
  "choice": "a" or "b"
}
```

## API Endpoints

### Create A/B Annotation

```
POST /v1/annotation/ab
```

Request body:
```json
{
  "datasetId": "uuid",
  "datasetRowId": "uuid",
  "requestId": "uuid",
  "prompt": "What is the capital of France?",
  "responseA": "The capital of France is Paris.",
  "responseB": "Paris is the capital city of France.",
  "choice": "a"
}
```

### Get Annotations

```
GET /v1/annotation?datasetId={uuid}&annotationType=A/B&limit=100&offset=0
```

Query parameters:
- `datasetId` (optional): Filter by dataset
- `requestId` (optional): Filter by request
- `annotationType` (optional): Filter by type ('A/B', 'Labeling', 'RL', 'SFT')
- `annotatorId` (optional): Filter by annotator
- `limit` (optional): Number of results to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

### Get Annotation by ID

```
GET /v1/annotation/{id}
```

### Update A/B Annotation

```
PUT /v1/annotation/ab/{id}
```

Request body (all fields optional):
```json
{
  "prompt": "Updated prompt",
  "responseA": "Updated response A",
  "responseB": "Updated response B",
  "choice": "b"
}
```

### Get Dataset Annotations

```
GET /v1/annotation/dataset/{datasetId}?limit=100&offset=0
```

### Get A/B Annotation Statistics

```
GET /v1/annotation/dataset/{datasetId}/ab/stats
```

Response:
```json
{
  "data": {
    "total": 150,
    "choice_a_count": 80,
    "choice_b_count": 70,
    "annotators_count": 5
  },
  "error": null
}
```

### Get Annotations by Request

```
GET /v1/annotation/request/{requestId}
```

### Get Annotations by Annotator

```
GET /v1/annotation/annotator/{annotatorId}?datasetId={uuid}&annotationType=A/B
```

## Usage Flow

1. **Create a Dataset**: Users first create a dataset using the existing dataset APIs
2. **Add Requests to Dataset**: Requests are added to the dataset
3. **Create Annotations**: Annotators can then annotate specific requests within the dataset
4. **Review Annotations**: Annotations can be queried, updated, and analyzed

## Future Annotation Types

The schema is designed to support additional annotation types:

### Labeling
For classification tasks:
```json
{
  "labels": ["positive", "negative", "neutral"],
  "selected_label": "positive",
  "confidence": 0.95
}
```

### RL (Reinforcement Learning)
For reward/ranking tasks:
```json
{
  "responses": ["response1", "response2", "response3"],
  "rankings": [1, 3, 2],
  "rewards": [0.9, 0.3, 0.6]
}
```

### SFT (Supervised Fine-Tuning)
For instruction-following tasks:
```json
{
  "instruction": "Write a poem about spring",
  "expected_response": "Spring arrives with gentle rain...",
  "corrections": ["spelling", "grammar"]
}
```

## Performance Considerations

- The table uses `ReplacingMergeTree` engine to handle updates efficiently
- Indexes are created on commonly queried fields (dataset_id, request_id, annotator_id)
- Data is partitioned by month for better query performance
- JSON extraction is used for filtering within annotation_data

## Security

- All operations require authentication via API key
- Annotations are scoped to the organization
- Users can only access annotations for datasets they have permission to view 