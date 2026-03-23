# MediTrack Pro

A lightweight medical inventory tracker with a modern UI and role-based access:

- **Admin**: full CRUD (create, read, update, delete).
- **Pharmacist**: create/read/update, no delete permission.

## Features

- Two separate login forms for Admin and Pharmacist.
- Product CRUD operations.
- Expiry classification:
  - **Expired**
  - **Near Expiry** (configurable threshold, default 30 days)
  - **Safe**
- Dashboard statistics cards.
- Search + status filtering.
- Form and business validations:
  - Required fields
  - Quantity must be positive integer
  - Expiry must be after MFG date
  - Batch format validation
  - Duplicate name + batch prevention

## Demo credentials

- Admin: `admin` / `Admin@123`
- Pharmacist: `pharmacist` / `Pharma@123`

## Run locally

Open `index.html` directly in your browser, or run:

```bash
python -m http.server 8080
```

Then browse to <http://localhost:8080>.
