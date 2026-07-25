# LogLens Frontend

This frontend is a React + Vite single-page application with a 3D animated background. It provides a log submission form, history list, and detailed report pages by consuming the backend AI log analysis API.

## What each file does

- `Dockerfile`
  - Builds the frontend in a Node.js container using `npm install` and `npm run build`.
  - Serves the generated static files from Nginx with a custom `nginx.conf`.

- `package.json`
  - Defines project metadata, React dependencies, Recharts for charts, Three.js for the animated background, and Vite build scripts.

- `index.html`
  - The SPA HTML shell.
  - Loads the app by mounting `src/main.jsx` into the `#root` element.
  - Includes custom font imports.

- `nginx.conf`
  - Serves the built app on port `5173`.
  - Proxies `/api/` requests to the backend service at `http://backend:8000/api/`.
  - Proxies `/healthz` and `/metrics` to the backend.
  - Supports SPA routing by falling back to `index.html`.

- `src/main.jsx`
  - React application entrypoint.
  - Defines UI, routing, and interactions.
  - Uses React Router for routes:
    - `/` for the log analyzer form.
    - `/history` for a report search / history page.
    - `/reports/:id` for viewing a single analysis report.
  - Fetches recent reports and report details from the backend API.
  - Submits logs to `POST /api/logs/analyze` and navigates to the generated report.
  - Renders the report summary, severity badges, counts, charts, top patterns, root causes, suggested fixes, and raw logs.

- `src/background3d.js`
  - Renders a decorative WebGL background using Three.js.
  - Displays a rotating wireframe icosahedron and particle field behind the UI.
  - Adds responsive resizing and mouse parallax.

- `src/index.css`
  - Global Tailwind CSS imports and custom styling.
  - Defines the dark gradient theme, glass surfaces, button styles, cards, and animations.

## Running locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app in your browser at the displayed Vite URL.

## Notes

- The frontend uses `VITE_API_URL` if provided to override the backend base URL.
- In Docker, Nginx is configured to proxy API requests to a service named `backend`.
- The `src/main.jsx` file contains both the UI and the API interaction logic.
