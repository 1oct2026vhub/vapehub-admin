# Bulk Order Status Jobs — API Requirements

## Overview

The admin Orders section supports asynchronous bulk status updates. Users may start **multiple bulk update jobs concurrently** (e.g. two batches of 100 orders each). The API must allow the frontend to:

1. **Identify** which orders belong to each bulk update job.
2. **Track** processing history per job and per order.
3. **Distinguish** queued, processing, completed, failed, and skipped orders within a job.

This document defines the API contract required to support an **Activity / Jobs center** UI in the admin panel.

---

## Goals

| Goal | Requirement |
|------|-------------|
| Concurrent jobs | Multiple jobs may run at the same time; each is independently trackable. |
| Job identity | Every job has a stable `job_id` and metadata (target status, timestamps, counts). |
| Per-order state | Each order in a job has an explicit `item_status`. |
| History | Completed jobs remain queryable for a configurable retention period. |
| Pagination | Job lists and per-order results support pagination (batches up to 500 orders). |
| Backward compatibility | Existing start + poll endpoints continue to work; responses are extended, not broken. |

---

## Non-Goals

- Real-time push (WebSockets/SSE) — polling is acceptable for v1.
- Cancelling in-flight jobs — optional future enhancement.
- Retry of failed orders from the API — optional future enhancement.

---

## Existing Endpoints (Baseline)

These endpoints already exist and are used by the admin frontend.

### Start async bulk update

```
POST /api/admin/orders/bulk-status/async
```

**Request body**

```json
{
  "order_ids": [101, 102, 103],
  "status": "shipped"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|---------------|
| `order_ids` | `number[]` | Yes | 1–500 unique IDs per request |
| `status` | `string` | Yes | Valid `OrderStatus` value |

**Response `201 Created`**

```json
{
  "success": true,
  "message": "Bulk status update queued",
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Poll job status (aggregate)

```
GET /api/admin/orders/bulk-status/jobs/:jobId
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress_percent": 62,
    "successful": 62,
    "failed": 3,
    "skipped": 0,
    "pending": 35,
    "total": 100,
    "errors": [
      {
        "order_id": 205,
        "order_unique_id": "ORD-2024-00205",
        "error": "ShipStation API timeout"
      }
    ]
  }
}
```

---

## Required Enhancements

### 1. Extend job poll response (backward compatible)

Add fields to `GET /api/admin/orders/bulk-status/jobs/:jobId` without removing existing fields.

**Additional fields on `data`**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_status` | `string` | Yes | Status the job is applying (e.g. `"shipped"`) |
| `created_at` | `string` (ISO 8601) | Yes | When the job was queued |
| `started_at` | `string` (ISO 8601) \| `null` | Yes | When processing began (`null` while `queued`) |
| `completed_at` | `string` (ISO 8601) \| `null` | Yes | When job reached a terminal state |
| `created_by` | `number` \| `null` | No | Admin user ID who submitted the job |
| `order_count` | `number` | Yes | Total orders submitted (`order_ids.length`) |

**Example enhanced response**

```json
{
  "success": true,
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "target_status": "shipped",
    "progress_percent": 62,
    "order_count": 100,
    "total": 100,
    "successful": 62,
    "failed": 3,
    "skipped": 0,
    "pending": 35,
    "created_at": "2026-06-24T10:15:00.000Z",
    "started_at": "2026-06-24T10:15:02.000Z",
    "completed_at": null,
    "created_by": 42,
    "errors": []
  }
}
```

**Invariants**

- `order_count` === `total` === `successful + failed + skipped + pending` at all times.
- `progress_percent` = `Math.round(((successful + failed + skipped) / total) * 100)` (define rounding rule consistently).
- `errors` contains only orders with `item_status: "failed"` (may be a subset when paginated — see note below).

> **Note:** For jobs with many failures, `errors` on the aggregate endpoint may remain a preview (e.g. first 50). Full failure list is available via the per-order endpoint (Section 3).

---

### 2. List jobs

```
GET /api/admin/orders/bulk-status/jobs
```

Returns active and recent jobs for the Activity / Jobs center and session resume after page refresh.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | `string` | — | Filter: `active`, `completed`, `failed`, or a specific job status (see enums below) |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Page size (max 50) |
| `sort` | `string` | `created_at` | Sort field: `created_at`, `completed_at` |
| `order` | `string` | `DESC` | `ASC` or `DESC` |

**`status=active`** means jobs where `status` is `queued` or `processing`.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "job_id": "550e8400-e29b-41d4-a716-446655440000",
        "status": "processing",
        "target_status": "shipped",
        "progress_percent": 62,
        "order_count": 100,
        "successful": 62,
        "failed": 3,
        "skipped": 0,
        "pending": 35,
        "created_at": "2026-06-24T10:15:00.000Z",
        "started_at": "2026-06-24T10:15:02.000Z",
        "completed_at": null
      },
      {
        "job_id": "660e8400-e29b-41d4-a716-446655440001",
        "status": "queued",
        "target_status": "packed",
        "progress_percent": 0,
        "order_count": 100,
        "successful": 0,
        "failed": 0,
        "skipped": 0,
        "pending": 100,
        "created_at": "2026-06-24T10:16:30.000Z",
        "started_at": null,
        "completed_at": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

**Retention**

- Return jobs created within the last **7 days** by default (configurable server-side).
- Terminal jobs older than retention may return `404` on individual poll or be omitted from list.

---

### 3. List orders in a job (per-order status)

```
GET /api/admin/orders/bulk-status/jobs/:jobId/orders
```

This is the primary endpoint for answering: *which orders belong to this batch, and what is each one's state?*

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `item_status` | `string` | — | Filter: `queued`, `processing`, `completed`, `failed`, `skipped` |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `50` | Page size (max 100) |
| `search` | `string` | — | Optional search by `order_unique_id` |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "target_status": "shipped",
    "job_status": "processing",
    "orders": [
      {
        "order_id": 101,
        "order_unique_id": "ORD-2024-00101",
        "item_status": "completed",
        "previous_status": "packed",
        "new_status": "shipped",
        "error": null,
        "processed_at": "2026-06-24T10:15:05.000Z"
      },
      {
        "order_id": 205,
        "order_unique_id": "ORD-2024-00205",
        "item_status": "failed",
        "previous_status": "packed",
        "new_status": null,
        "error": "ShipStation API timeout",
        "processed_at": "2026-06-24T10:15:18.000Z"
      },
      {
        "order_id": 310,
        "order_unique_id": "ORD-2024-00310",
        "item_status": "queued",
        "previous_status": "processing",
        "new_status": null,
        "error": null,
        "processed_at": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "total_pages": 2
    },
    "summary": {
      "queued": 35,
      "processing": 0,
      "completed": 62,
      "failed": 3,
      "skipped": 0
    }
  }
}
```

**Per-order fields**

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | `number` | Internal order ID |
| `order_unique_id` | `string` | Display ID shown in admin UI |
| `item_status` | `string` | State of this order within the job (see enums) |
| `previous_status` | `string` \| `null` | Order status before update attempt |
| `new_status` | `string` \| `null` | Order status after success; `null` if not yet completed or failed |
| `error` | `string` \| `null` | Failure reason when `item_status` is `failed` |
| `processed_at` | `string` \| `null` | ISO 8601 timestamp when item reached a terminal item state |

---

## Enums

### Job status (`status`)

| Value | Terminal | Description |
|-------|----------|-------------|
| `queued` | No | Job accepted; orders not yet being processed |
| `processing` | No | At least one order is being processed |
| `completed` | Yes | All orders succeeded |
| `partial_failed` | Yes | Mix of successful and failed/skipped |
| `failed` | Yes | Job failed entirely (e.g. system error before processing) |

### Per-order item status (`item_status`)

| Value | Terminal | Description |
|-------|----------|-------------|
| `queued` | No | Waiting to be processed |
| `processing` | No | Currently being updated |
| `completed` | Yes | Status updated successfully |
| `failed` | Yes | Update attempted and failed |
| `skipped` | Yes | Intentionally skipped (e.g. invalid transition, duplicate) |

### Valid `OrderStatus` values (request `status` / `target_status`)

```
draft | pending | processing | packed | shipped | delivered | completed |
fail | cancel | return_requested | return_approved | return_received | refunded
```

---

## Concurrent Job Behavior

### Multiple simultaneous jobs

- The API **must allow** multiple active jobs from the same admin user (and optionally across users).
- Each job maintains its own order membership and progress counters.
- Jobs are processed independently; queue ordering is backend-defined (FIFO per worker is acceptable).

### Overlapping order IDs

When the same `order_id` appears in two active jobs:

| Policy | Recommendation |
|--------|----------------|
| **Warn (soft)** | Accept both jobs; document that later job may overwrite earlier result. Return overlap info in start response (optional). |
| **Block (strict)** | Reject start request with `409 Conflict` if any `order_id` is already in an active job. |

**Recommended for v1:** Block with `409` to prevent ambiguous state.

**`409 Conflict` response (strict policy)**

```json
{
  "success": false,
  "message": "Some orders are already in an active bulk update job",
  "data": {
    "conflicting_order_ids": [101, 102],
    "active_job_ids": ["550e8400-e29b-41d4-a716-446655440000"]
  }
}
```

---

## Error Responses

Standard error shape across all endpoints:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "order_ids", "msg": "Maximum 500 orders per batch" }
  ]
}
```

| HTTP Status | When |
|-------------|------|
| `400` | Invalid request body, invalid status, empty `order_ids`, batch > 500 |
| `401` | Unauthenticated |
| `403` | Insufficient permissions |
| `404` | Job not found or expired (retention) |
| `409` | Overlapping orders in active job (if strict policy enabled) |
| `422` | One or more `order_ids` do not exist |
| `500` | Internal server error |

---

## Authentication & Authorization

- All endpoints require admin authentication (same as existing `/api/admin/orders/*` routes).
- Jobs should be scoped to the authenticated admin account or organization, consistent with existing order access rules.
- `created_by` should be populated from the authenticated user when available.

---

## Polling Guidance (for frontend consumers)

| Endpoint | Suggested interval | Stop when |
|----------|-------------------|-----------|
| `GET /jobs/:jobId` | 2–3 seconds | `status` is terminal |
| `GET /jobs/:jobId/orders` | On demand (user opens detail) | Job is terminal and UI is static |
| `GET /jobs?status=active` | 5–10 seconds | No active jobs |

---

## Implementation Phases

### Phase 1 — Minimum viable multi-job support

- [ ] Extend `GET /jobs/:jobId` with `target_status`, timestamps, `order_count`
- [ ] Add `GET /jobs` with `status=active` filter and pagination
- [ ] Persist job metadata server-side (do not rely on client to store `target_status`)

### Phase 2 — Per-order tracking

- [ ] Add `GET /jobs/:jobId/orders` with `item_status` filter and pagination
- [ ] Persist per-order rows at job creation time with initial `item_status: "queued"`
- [ ] Update item rows as processing proceeds

### Phase 3 — Hardening

- [ ] Overlap detection (`409`) for orders in active jobs
- [ ] Job retention policy (7-day default)
- [ ] Optional: `POST /jobs/:jobId/retry-failed` to re-queue failed orders

---

## TypeScript Reference (frontend alignment)

These types mirror `src/services/apiOrder.ts` and should be updated when the API ships.

```typescript
export type BulkStatusJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "partial_failed"
  | "failed";

export type BulkStatusItemStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export interface BulkStatusJobData {
  job_id: string;
  status: BulkStatusJobStatus;
  target_status: OrderStatus;
  progress_percent: number;
  order_count: number;
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  pending: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by?: number | null;
  errors?: BulkStatusJobError[];
}

export interface BulkStatusJobOrderItem {
  order_id: number;
  order_unique_id: string;
  item_status: BulkStatusItemStatus;
  previous_status: OrderStatus | null;
  new_status: OrderStatus | null;
  error: string | null;
  processed_at: string | null;
}

export interface BulkStatusJobOrdersResponse {
  success: boolean;
  data: {
    job_id: string;
    target_status: OrderStatus;
    job_status: BulkStatusJobStatus;
    orders: BulkStatusJobOrderItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
    summary: Record<BulkStatusItemStatus, number>;
  };
}
```

---

## Open Questions

1. **Retention period** — Is 7 days sufficient, or should completed jobs be kept indefinitely?
2. **Overlap policy** — Block (`409`) vs warn-and-allow for duplicate `order_id` across active jobs?
3. **Cross-user visibility** — Can any admin see all jobs, or only jobs they created?
4. **`skipped` semantics** — What business rules cause an order to be skipped rather than failed?
5. **Packed status** — Does `target_status: "packed"` trigger ShipStation side effects per order? Should `error` surface ShipStation-specific messages?

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-06-24 | Admin frontend team | Initial requirements for multi-job bulk status tracking |
