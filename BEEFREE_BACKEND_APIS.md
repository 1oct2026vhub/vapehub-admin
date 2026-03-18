## Beefree Integration – Backend API Summary

This document lists the backend APIs required to support the Beefree Email Builder in our application.  
It is intentionally **short and implementation‑oriented**.

---

### 1. `POST /api/bee-auth`

**Purpose:**  
Proxy to Beefree `/loginV2` so the frontend can obtain a Beefree SDK token without exposing `client_secret`.

**Request (from frontend):**

```json
{
  "uid": "user-id-or-email"
}
```

**Backend behaviour:**

- Read `BEE_CLIENT_ID` and `BEE_CLIENT_SECRET` (or equivalent) from env.
- Call `https://auth.getbee.io/loginV2` with:

  ```json
  {
    "client_id": "BEE_CLIENT_ID",
    "client_secret": "BEE_CLIENT_SECRET",
    "uid": "..."
  }
  ```

- Return Beefree’s response JSON as‑is to the frontend.

**Response (to frontend):**

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "...": "other fields from Beefree"
}
```

Frontend passes this object directly to `new BeefreeSDK(token)`.

---

### 2. `POST /api/email-templates`

**Purpose:**  
Create or update an email template designed in Beefree.

**Request (from frontend `onSave` handler):**

```json
{
  "id": "optional-existing-id",
  "name": "Template name",
  "description": "Optional description",
  "designJson": { },
  "html": "<!doctype html>...",
  "folderId": "optional-folder-id",
  "tags": ["optional", "tags"]
}
```

Notes:

- `designJson` is the Beefree design JSON (parsed from `pageJson`).
- `html` is the exported HTML from `pageHtml` (optional but recommended).

**Response (to frontend):**

```json
{
  "id": "tmpl_123",
  "name": "Template name",
  "savedAt": "2026-03-13T10:00:00Z"
}
```

Backend stores `designJson` (and optionally `html`) in DB or file storage.

---

### 3. `GET /api/email-templates/:id`

**Purpose:**  
Load a previously saved template into the Beefree editor.

**Path params:**

- `id` – template identifier.

**Response (to frontend):**

```json
{
  "id": "tmpl_123",
  "name": "Template name",
  "description": "Optional description",
  "designJson": { },
  "lastHtml": "<!doctype html>...",
  "updatedAt": "2026-03-13T10:00:00Z"
}
```

Frontend passes `designJson` as the `template` argument to `bee.start(beeConfig, designJson)`.

---

### 4. `POST /api/email-templates/:id/export-html` (optional but recommended)

**Purpose:**  
Convert the current design JSON into HTML using Beefree **Content Services API**.

**Path params:**

- `id` – template identifier (for logging/auditing; not strictly required by Beefree).

**Request (from frontend):**

```json
{
  "designJson": { }
}
```

**Backend behaviour:**

- Read `CS_API_TOKEN` (Content Services API token) from env.
- Call `https://api.getbee.io/v1/message/html`:

  - `Authorization: Bearer CS_API_TOKEN`
  - Body: `designJson`.

- Return HTML string to frontend.

**Response (to frontend):**

```json
{
  "html": "<!doctype html>..."
}
```

Frontend can use this HTML for:

- Preview.
- Sending test emails.
- Storing as `lastHtml` via `/api/email-templates`.

---

### 5. Optional Management APIs

These are not required by Beefree itself but are useful for UI features.

#### 5.1 `GET /api/email-templates`

List templates for the current tenant/user.

**Query params (optional):** `search`, `folderId`, `page`, `pageSize`.

**Response:**

```json
{
  "items": [
    {
      "id": "tmpl_123",
      "name": "Welcome",
      "updatedAt": "2026-03-13T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### 5.2 `DELETE /api/email-templates/:id`

Soft or hard delete a template.

**Response:**

```json
{ "success": true }
```

---

### 6. Minimal vs. Full Setup

- **Minimal (MVP):**
  - `POST /api/bee-auth`
  - `POST /api/email-templates`
  - `GET /api/email-templates/:id`

- **Full featured:**
  - All of the above **plus**:
    - `POST /api/email-templates/:id/export-html`
    - `GET /api/email-templates`
    - `DELETE /api/email-templates/:id`

This API set is enough to embed Beefree, store designs, and generate HTML for sending emails.

