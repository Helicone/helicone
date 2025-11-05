# Helicone Pricing Analysis - Data Export Specification

## Goal

Export customer data to CSV/Excel for AI-assisted pricing analysis. Instead of building complex dashboards, get raw data into Claude (or other AI) for flexible analysis and decision-making.

---

## Export Data Structure

### Primary Export: Organization Pricing Data

**File:** `organization_pricing_export.csv`

#### Core Fields

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `org_id` | string | PostgreSQL | Organization UUID |
| `org_name` | string | PostgreSQL | Organization name |
| `tier` | string | PostgreSQL | Current pricing tier (free/pro/team/enterprise/demo) |
| `created_at` | datetime | PostgreSQL | When org was created |
| `stripe_customer_id` | string | PostgreSQL | Stripe customer ID (null if no subscription) |

#### Team/Seats

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `seats` | number | PostgreSQL | Total seats (org member count) |
| `active_users_30d` | number | PostgreSQL | Unique users who logged in last 30 days |

#### Usage (30 days)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `requests_30d` | number | ClickHouse | Total API requests (logs) in last 30 days |
| `llm_cost_30d` | number | ClickHouse | Total LLM cost we incurred (USD) |
| `prompts_created` | number | PostgreSQL | Total prompts created by org (prompt_v3 table) |
| `prompts_used_30d` | number | ClickHouse | Requests using prompt_id (active usage) |

#### Revenue (Monthly)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `mrr` | number | Stripe | Monthly recurring revenue (USD) |
| `base_subscription` | number | Stripe | Base tier cost (e.g., $20/seat for Pro) |
| `usage_charges` | number | Stripe | Usage-based charges (request overages) |
| `addon_prompts` | number | Stripe | Prompts addon ($50) |

#### Customer Type

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `is_ptb` | boolean | ClickHouse | Has pass-through billing requests (AI Gateway) |
| `is_byok` | boolean | Derived | Has non-PTB requests (bring your own key) |
| `has_gateway_only` | boolean | Derived | PTB only, no BYOK requests |

#### Calculated Metrics (for AI analysis)

These can be calculated in Excel/Claude, but include for convenience:

| Field | Type | Formula | Purpose |
|-------|------|---------|---------|
| `cost_per_seat` | number | `llm_cost_30d / seats` | How much each seat costs us |
| `revenue_per_seat` | number | `mrr / seats` | How much we earn per seat |
| `cost_per_request` | number | `llm_cost_30d / requests_30d` | Cost per API call |
| `revenue_per_request` | number | `mrr / requests_30d` | Revenue per API call |
| `gross_margin_pct` | number | `(mrr - llm_cost_30d) / mrr * 100` | Profitability % |
| `seat_utilization_pct` | number | `active_users_30d / seats * 100` | How many seats are used |

---

## Data Queries

### PostgreSQL Queries

**Organizations with seats and active users:**

```sql
SELECT
  o.id as org_id,
  o.name as org_name,
  COALESCE(o.tier, 'free') as tier,
  o.created_at,
  o.stripe_customer_id,
  COALESCE(COUNT(DISTINCT om.member), 0) as seats,
  COALESCE(COUNT(DISTINCT CASE
    WHEN u.last_active >= NOW() - INTERVAL '30 days'
    THEN u.user_id END), 0) as active_users_30d
FROM organization o
LEFT JOIN organization_member om ON o.id = om.organization
LEFT JOIN user_settings u ON om.member = u.user_id
WHERE o.tier != 'demo' OR o.tier IS NULL
GROUP BY o.id, o.name, o.tier, o.created_at, o.stripe_customer_id
ORDER BY o.created_at DESC
```

**Prompts created by organization:**

```sql
SELECT
  organization as org_id,
  COUNT(*) as prompts_created
FROM prompt_v3
GROUP BY organization
```

### ClickHouse Queries

**30-day usage metrics:**

```sql
SELECT
  organization_id as org_id,
  COUNT(*) as requests_30d,
  SUM(cost) / 1000000000 as llm_cost_30d,
  countIf(prompt_id != '') as prompts_used_30d
FROM request_response_rmt
WHERE request_created_at >= now() - INTERVAL 30 DAY
GROUP BY organization_id
```

**PTB customer detection (from materialized view):**

```sql
SELECT
  organization_id as org_id,
  spend > 0 as is_ptb
FROM organization_ptb_spend
```

**BYOK detection:**

```sql
SELECT
  organization_id as org_id,
  countIf(is_passthrough_billing = false) > 0 as is_byok,
  countIf(is_passthrough_billing = false) > 0 AND
  countIf(is_passthrough_billing = true) = 0 as gateway_only
FROM request_response_rmt
WHERE request_created_at >= now() - INTERVAL 30 DAY
GROUP BY organization_id
```

### Stripe Data

For each organization with `stripe_customer_id`:

- Get active subscription
- Calculate MRR from subscription + usage charges
- Identify addon subscriptions (prompts only)
- Break down: base subscription vs usage vs addons

**Note:** Stripe API is slow (50+ calls). Consider:
1. Cache in database (daily refresh job)
2. OR skip for initial export, add later if needed
3. Use `organization.stripe_metadata` if available

---

## Export Implementation

### Backend Endpoint

**New endpoint:** `GET /v1/admin/pricing-analytics/export?format=csv`

**Query parameter:**
- `format`: `csv` or `xlsx` (default: `csv`)

**Response:**
- `Content-Type: text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="helicone_pricing_data_YYYY-MM-DD.csv"`

**Implementation:**
1. PricingAnalyticsManager: `exportData()` method
2. Query PostgreSQL + ClickHouse (same as segments endpoint)
3. Skip Stripe initially (too slow), or fetch async
4. Format as CSV/XLSX
5. Stream response

### Frontend Button

**Location:** `/web/pages/admin/pricing-analytics.tsx`

Add button to page header:

```tsx
<Button onClick={async () => {
  const response = await fetch('/api/v1/admin/pricing-analytics/export?format=csv');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `helicone_pricing_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}}>
  <Download /> Export to CSV
</Button>
```

---

## Analysis Workflow

### Step 1: Export Data
1. Go to `/admin/pricing-analytics`
2. Click "Export to CSV"
3. Download `helicone_pricing_YYYY-MM-DD.csv`

### Step 2: AI Analysis (Claude)
1. Upload CSV to Claude (web or desktop)
2. Ask questions like:
   - "Show me organizations with high usage but low revenue"
   - "What would revenue be if we charged 2% of LLM cost instead of seat-based?"
   - "Who are our most/least profitable customers?"
   - "Find free users who should be on paid plans"
   - "Calculate breakeven pricing tiers"

### Step 3: Pricing Decisions
Based on Claude's analysis:
- Identify underpriced customers (manual reach out)
- Design new pricing tiers
- Calculate migration impacts
- Set pricing thresholds

### Step 4: Test & Iterate
- Export data again after changes
- Compare before/after
- Repeat analysis

---

## Key Pricing Questions to Answer

Using the exported data + AI:

1. **Underpriced customers:** High `requests_30d` or `llm_cost_30d` but low `mrr`
2. **Upgrade candidates:** `tier = 'free'` but high usage
3. **Churn risk:** Negative gross margin (`llm_cost_30d > mrr`)
4. **Pricing model comparison:**
   - Seat-based: `mrr` vs `seats`
   - Usage-based: `mrr` vs `requests_30d`
   - % of cost: `mrr` vs `llm_cost_30d * percentage`
5. **Feature adoption:** Who uses prompts addon? Should it be included in base tiers?
6. **PTB vs BYOK:** Different pricing for gateway-only customers?

---

## Next Steps

1. **Implement export endpoint** (backend)
2. **Add export button** (frontend)
3. **Test export with production data**
4. **Upload to Claude and start analysis**
5. **Document findings** (add to this file)
6. **Make pricing decisions based on data**

---

## Future Enhancements

Once we know what matters:

1. **Cache Stripe data** - Store MRR/addons in database for faster exports
2. **Scheduled exports** - Daily CSV emailed to team
3. **Comparison exports** - Side-by-side current vs proposed pricing
4. **Segment exports** - Pre-filtered CSVs (e.g., "PTB only", "High usage free tier")
5. **API for Claude** - Let Claude query our DB directly via MCP server
