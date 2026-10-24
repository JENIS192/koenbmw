# Apex & Bavaria Motors: Koenigsegg Jesko Absolut and BMW sale platform

A 3-tier e-commerce web application.

| Tier | Tech | Folder |
|------|------|--------|
| Presentation | HTML, CSS, JavaScript | `frontend/` |
| Application | Node.js + Express (port 5000) | `backend/` |
| Data | MySQL | database `jesko_bmw_store` (auto-created) |

## Run it

1. Make sure MySQL is running and you know the root (or other user) password.
2. Edit `backend/.env` and set `DB_USER` and `DB_PASSWORD`.
3. Start the server:

```bash
cd backend
npm install
npm start
```

On success the terminal prints:

```
✅ MySQL database connected successfully -> localhost:3306/jesko_bmw_store
📦 Database tables ready (10 tables)
🚀 Apex & Bavaria Motors is running
```

Open http://localhost:5000

Tables, 6 departments, 20 demo vehicles (with photos) and the admin account are created automatically on first start.

## Database file (with data)

`database/jesko_bmw_store.sql` contains the full schema plus the demo data (6 departments, 20 vehicles, 60 photo records, admin account). The car photos it refers to are in `backend/uploads/`.

Import it (optional, the server also creates everything automatically):

```bash
mysql -u root -p < database/jesko_bmw_store.sql
```

Then run `npm start` in `backend/`. The server detects the existing data and does not seed again.

## Admin login

- URL: http://localhost:5000/admin.html
- Email: `admin@jeskobmw.com`
- Password: `Admin@12345` (change it in `backend/.env` before the first start)

## Health check

`GET /api/hell/health` (the path `/api/health` does not exist, as requested).

## Individual .env files

- `backend/.env`: port, MySQL, JWT secret, admin account, upload limits.
- `frontend/.env`: app name, currency, locale, optional `API_BASE_URL`. The backend serves these values to the browser at `/config.js`.

## No CORS

There is no CORS package and no CORS headers. The Node server serves both the API and the `frontend/` folder from the same origin (port 5000), so the browser never makes a cross-origin request.

## Departments

Koenigsegg Hypercars, BMW M Performance, BMW Luxury Sedans, BMW SUV and X Models, BMW Electric (i), BMW Classics. Admins can add, edit and delete departments.

## Features

- Customer: register and log in, browse and filter vehicles, photo gallery, specs, reviews, wishlist, cart, checkout, order history with cancel, test drive and enquiry forms, profile and password change.
- Admin console: dashboard with revenue and inventory by department, add and edit vehicles with multi-photo upload (drag and drop, set cover photo, remove photos), departments, orders with status workflow, enquiries, customers.
- Safety: parameterised SQL, bcrypt passwords, JWT auth, admin-only routes, upload type and size checks, transactional checkout so one car cannot be sold twice.

## Troubleshooting

- `Access denied for user 'root'`: set the right `DB_PASSWORD` in `backend/.env`.
- On Ubuntu, if root uses socket login: `sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yourpassword'; FLUSH PRIVILEGES;"`, or create a dedicated user and set `DB_USER` and `DB_PASSWORD`.
- Port 5000 busy: change `PORT` in `backend/.env`.

Vehicle specs and prices are demo data for learning purposes.
"# koenbmw" 
