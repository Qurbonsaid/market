# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    # Market ERP

    Production-ready inventory, point-of-sale, debt, and staff management app built with React, TypeScript, Vite, and Firebase Firestore.

    ## Configure

    Create a `.env.local` file before running the app:

    ```env
    VITE_FIREBASE_API_KEY=your-api-key
    VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    VITE_FIREBASE_APP_ID=your-app-id
    VITE_IMGCDN_API_KEY=your-imgcdn-api-key
    VITE_IMGCDN_ENDPOINT=https://imgcdn.dev/api/1/upload
    ```

    Create the `staff`, `inventory`, `sales`, and `debts` collections in Firestore. The first administrator must be bootstrapped with an Email/Password Firebase Auth account using the virtual email `<9-digit-phone>@marketcom.local` and a `staff` document whose ID is that Auth UID. After signing in, administrators can create staff from the app: a secondary Firebase app creates the Auth account, then the primary Firestore connection writes `staff/{uid}` with `name`, `phone`, `role`, `isActive`, and `createdAt`. No demo or seeded records are included.

    The app normalizes phone input to exactly nine digits before sign-in. Terminal PINs are SHA-256 hashed and stored only in that browser's local storage; they are never staff profile fields.

    Configure Firebase Authentication or equivalent server-side access controls before exposing the app publicly. Firestore security rules must restrict staff, inventory, sales, and debt access to authorized users.

    ## Commands

    ```bash
    npm install
    npm run dev
    npm run build
    npm run lint
    ```
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
