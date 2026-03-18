## Beefree Email Builder Integration – API Design

### 1. Overview

This document describes how to integrate the **Beefree Email Builder** into our app, focusing on:

- **How many APIs** we need (and what they do).
- **What data flows** between frontend and backend.
- **How to store templates** in a database or file storage.

The goal is to support:

- Opening the Beefree editor (authenticated).
- Creating and editing templates.
- Saving templates (JSON + HTML) into our own storage.
- Exporting HTML that can be sent via our email system.

---

### 2. High‑level API Architecture

There are **two layers** of APIs involved:

1. **Beefree APIs (external)**  
   - `POST https://auth.getbee.io/loginV2` – authentication for the SDK.  
   - `POST https://api.getbee.io/v1/message/html` – Content Services API: JSON → HTML.  
   - (Optional) other Content Services / Template Catalog endpoints.

2. **Our backend APIs (internal)**  
   These wrap Beefree and talk to our own database/file storage.

For a **complete, production‑ready integration**, you typically need at least:

1. **Auth proxy:** `POST /api/bee-auth`  
2. **Template save/update:** `POST /api/email-templates` (or `PUT /api/email-templates/:id`)  
3. **Template load:** `GET /api/email-templates/:id`  
4. **Export HTML (optional but recommended):** `POST /api/email-templates/:id/export-html`  
5. **(Nice to have)** List/delete: `GET /api/email-templates`, `DELETE /api/email-templates/:id`

So think of it as **3 core endpoints** (auth + save + load) plus **1–2 optional** endpoints for export and management.

---

### 3. Required APIs in Detail

#### 3.1 `POST /api/bee-auth` – Beefree auth proxy (required)

**Purpose:**  
Frontend gets a **short‑lived token** to start the Beefree editor, without ever seeing `client_secret`.

**Backend responsibilities:**

- Read `client_id` / `client_secret` from environment (e.g. `BEE_CLIENT_ID`, `BEE_CLIENT_SECRET`).
- Receive `{ uid: string }` from frontend (user identifier).
- Call:

  ```http
  POST https://auth.getbee.io/loginV2
  Content-Type: application/json

  {
    "client_id": "...",
    "client_secret": "...",
    "uid": "user-id"
  }
  ```

- Return Beefree’s response JSON to the frontend.

**Frontend usage (simplified):**

```ts
const res = await fetch('/api/bee-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uid: currentUserId }),
});

const token = await res.json();           // pass to BeefreeSDK
const bee = new BeefreeSDK(token);
bee.start(beeConfig, initialTemplateJson);
```

---

#### 3.2 `POST /api/email-templates` – Save / update template (required)

You can split into create/update, but a single “upsert” endpoint is common.

**Request body from frontend:**

```json
{
  "id": "optional-template-id",
  "name": "Welcome campaign",
  "description": "Onboarding series email 1",
  "designJson": { },
  "html": "<!doctype html>...",
  "folderId": "optional-folder-id",
  "tags": ["welcome", "promo"]
}
```

**Backend actions:**

- If `id` is missing → create new row and return generated `id`.
- If `id` exists → update existing row.
- Persist `designJson` as JSON (or stringified JSON) in DB or file storage.
- Optionally persist `html` if provided.

**Example DB schema (SQL‑ish):**

```sql
email_templates (
  id              uuid primary key,
  name            text not null,
  description     text,
  design_json     jsonb not null,
  last_html       text,
  folder_id       uuid null,
  tags            text[] null,
  created_by      uuid not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
)
```

---

#### 3.3 `GET /api/email-templates/:id` – Load template (required)

**Purpose:**  
When user re‑opens a template, frontend needs the **saved design JSON** to give to Beefree as the `template` argument of `bee.start()`.

**Backend response example:**

```json
{
  "id": "tmpl_123",
  "name": "Welcome campaign",
  "description": "Onboarding series email 1",
  "designJson": { },
  "lastHtml": "<!doctype html>...",
  "updatedAt": "2026-03-13T10:00:00Z"
}
```

**Frontend usage:**

```ts
const res = await fetch(`/api/email-templates/${templateId}`);
const template = await res.json();

const bee = new BeefreeSDK(token);
bee.start(beeConfig, template.designJson);
```

---

#### 3.4 `POST /api/email-templates/:id/export-html` – Export HTML (recommended)

You have two main options:

- **Option A:** Export HTML on every save (inside `onSave`) and send it to your backend in the `/api/email-templates` call.  
- **Option B:** Export HTML on demand via **Content Services API**.

Option B flow:

1. **Frontend** calls:

   ```http
   POST /api/email-templates/:id/export-html
   Content-Type: application/json

   {
     "designJson": { }
   }
   ```

2. **Backend** forwards to Beefree:

   ```http
   POST https://api.getbee.io/v1/message/html
   Authorization: Bearer <CS_API_TOKEN>
   Content-Type: application/json

   { ...designJson... }
   ```

3. Backend sends back the HTML as `text/html` or JSON:

   ```json
   {
     "html": "<!doctype html>..."
   }
   ```

4. Frontend can:
   - Show a preview.
   - Include `html` in a “Send test email” call.
   - Save it via `/api/email-templates`.

---

#### 3.5 Optional management APIs

Not strictly required for the builder itself but usually needed:

- `GET /api/email-templates` – list templates with filters/pagination.
- `DELETE /api/email-templates/:id` – soft delete or hard delete.
- `POST /api/email-templates/:id/duplicate` – clone `designJson` into a new template.

---

### 4. Frontend–Backend Data Contracts

#### 4.1 Data the frontend needs from backend

**To start the editor:**

- From `/api/bee-auth`:
  - Whatever Beefree returns for `/loginV2` (access token and related fields). The whole object is passed to `new BeefreeSDK(token)`.

**To load a template:**

- From `/api/email-templates/:id`:

  ```ts
  type EmailTemplate = {
    id: string;
    name: string;
    description?: string;
    designJson: unknown;
    lastHtml?: string;
    folderId?: string;
    tags?: string[];
    updatedAt: string;
  };
  ```

**To save a template:**

- Frontend should send at least:

  ```ts
  type SaveTemplatePayload = {
    id?: string;
    name: string;
    description?: string;
    designJson: unknown;
    html?: string;
  };
  ```

Typically, **designJson is the source of truth**; HTML is a derived artifact you can regenerate with Content Services API if needed.

---

### 5. Where frontend gets `designJson` and `html`

Inside the Beefree config:

```ts
const beeConfig = {
  container: 'beefree-email-editor',
  trackChanges: true,
  onSave: (
    pageJson: string,
    pageHtml: string,
    ampHtml: string | null,
    templateVersion: number,
    language: string | null
  ) => {
    // pageJson → designJson
    // pageHtml → exported HTML
    // send to backend via /api/email-templates
  },
  onChange: (json: unknown) => {
    // optional: keep live designJson in component state
  },
  onError: (err: unknown) => { /* handle errors */ },
};
```

From here you build your save payload:

```ts
await fetch('/api/email-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: currentTemplateId,
    name,
    description,
    designJson: JSON.parse(pageJson),
    html: pageHtml,
  }),
});
```

---

### 6. Minimal Setup vs. Full Functionality

- **Minimal (MVP):**
  - `POST /api/bee-auth`
  - `POST /api/email-templates` (save `designJson` + optional HTML)
  - `GET /api/email-templates/:id`

- **Full-featured:**
  - All of the above **plus**:
    - `POST /api/email-templates/:id/export-html` (or inline export in save).
    - `GET /api/email-templates` (list)  
    - `DELETE /api/email-templates/:id`  
    - Optional “send test email” endpoint that uses the exported HTML.

This gives you everything needed to embed the Beefree Email Builder, manage templates, and generate production‑ready HTML for sending.

