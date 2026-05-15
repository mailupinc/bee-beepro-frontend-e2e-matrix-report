# History Report

Dynamic E2E test failure matrix. Reads merged Cypress reports directly from S3
via a Next.js backend; the UI redeploys only when the application changes,
**not** when new reports are produced.

## Architecture

```
Browser ─► Next.js app (Vercel)
            ├── /api/filters  → S3 ListObjects → available env/branch/spec/baseUrl
            └── /api/reports  → S3 GetObject(merged.json) × N → aggregated matrix
```

- No database
- Per-instance in-memory cache (reports are immutable once written)
- Suite owners regenerated at build time from git history

## S3 layout consumed

```
<bucket>/<root-prefix>/env-<env>/branch-<branch>/spec-<spec>/base-<base>/YYYY-MM-DD/HH-MM-SS/merged.json
```

## API

### `GET /api/filters`

Returns the available filter values discovered on S3.

```json
{
  "envs": ["qa", "pre", "pre2"],
  "branches": ["main", "branch-..."],
  "specs": ["all", "..."],
  "baseUrls": ["default", "..."]
}
```

### `GET /api/reports`

Query parameters (all optional):

| Param        | Default     | Notes                                                 |
| ------------ | ----------- | ----------------------------------------------------- |
| `branch`     | `main`      | S3 path segment (without `branch-` prefix)            |
| `env`        | `qa`        | S3 path segment (without `env-` prefix)               |
| `spec`       | `all`       | S3 path segment (without `spec-` prefix)              |
| `base_url`   | `default`   | S3 path segment (without `base-` prefix)              |
| `n_reports`  | `15`        | Max number of most-recent reports to aggregate        |
| `search`     | _(none)_    | Case-insensitive substring filter on test names       |
| `owners`     | _(none)_    | Comma-separated GitHub handles; empty = all owners    |

## Local development

```bash
cd history_report
cp .env.example .env.local   # fill in AWS creds
yarn install
yarn dev
```

## Deployment (Vercel)

1. Import the repo into Vercel, set the **Root Directory** to `history_report`.
2. Add the env vars from `.env.example` in the Vercel project settings.
3. Builds run automatically on push to `main`.

No GitHub Pages deployment, no CI step after a test run.
