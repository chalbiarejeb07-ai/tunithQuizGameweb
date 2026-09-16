# Firebase administration

## Configuration Firebase

1. Create a project in Firebase Console.
2. Activate Authentication providers **Google** and **Email/Password**.
3. Create a Firestore database.
4. Register a Web app and copy its configuration values from **Project settings > Your apps**.
5. Create `.env.local` at the project root from `.env.example`, then replace every placeholder with the real Firebase values.
6. Run `npm run check-env` to verify all six variables.
7. Start the app with `npm run dev`.

Restart Vite after every `.env.local` change because Vite does not reload environment variables at runtime.

```powershell
Copy-Item .env.example .env.local
npm run dev
```

The equivalent macOS/Linux commands are:

```bash
cp .env.example .env.local
npm run check-env
npm run dev
```

## Create the first admin

The first administrator must be created with the Firebase Admin SDK, outside the browser. Configure Application Default Credentials with a service-account key, then run:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
npm run create-admin -- admin@example.com "a-strong-password" "Admin name"
```

The same command accepts named options:

```powershell
npm run create-admin -- --email=admin@example.com --password="a-strong-password" --display-name="Admin name" --credentials="C:\path\to\service-account.json"
```

The command creates or updates the Firebase Auth account, sets the `admin` custom claim, and writes `Users/{uid}` with `role: "admin"`. Never commit the service-account JSON or put it in `VITE_*` variables.

Existing administrators can promote a user from the Admin Dashboard. The client can only promote to `admin`; Firestore rules reject self-assigned admin roles and all role demotions.

The credentials path can also be passed as the fourth argument, which is convenient for a single command:

```powershell
npm run create-admin -- admin@example.com "a-strong-password" "Admin name" "C:\path\to\service-account.json"
```
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
