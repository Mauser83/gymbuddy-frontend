# Gemini Project Configuration

This file helps Gemini understand the project's structure, conventions, and commands, ensuring its assistance is accurate and effective.

## Project Overview

This is a React Native (Expo) mobile application written in TypeScript. It uses a modular, feature-based architecture with a GraphQL data layer powered by Apollo Client. The UI is component-driven with a centralized theming system.

## File Structure

- **`src/modules`**: Contains the core application logic, organized by feature (e.g., `auth`, `gym`, `exercise`).
- **`src/shared/components`**: Houses reusable UI components.
- **`src/shared/theme`**: Manages the application's visual styling and themes.
- **`src/routes`**: Defines the application's navigation structure and route guards.
- **`src/services/apollo`**: Configures the Apollo Client for GraphQL communication.
- **`*.graphql.ts`**: Files defining GraphQL queries, mutations, and subscriptions are located within their respective feature modules.

## Commands

- **`npm start`**: Starts the Expo development server.
- **`npm run android`**: Runs the app on an Android emulator or connected device.
- **`npm run ios`**: Runs the app on an iOS simulator or connected device.
- **`npm run web`**: Runs the app in a web browser.
- **`npm run lint`**: (Assumed) Lints the codebase using ESLint.
- **`npm run type-check`**: (Assumed) Type-checks the codebase using TypeScript.

## Dependencies

- **React Native (Expo)**: The core framework for building the mobile application.
- **TypeScript**: The primary programming language.
- **Apollo Client**: Used for managing GraphQL data.
- **React Navigation**: Handles routing and navigation.
- **Formik & Yup**: Used for form management and validation.
- **ESLint & Prettier**: Enforce code style and quality.

## Conventions

- **State Management**: Primarily managed within components or through Apollo Client's cache. React Context is also used for cross-cutting concerns like authentication (`AuthContext`).
- **Styling**: Uses a custom theming solution with `@shopify/restyle`.
- **File Naming**:
    - Components: `PascalCase.tsx` (e.g., `MyComponent.tsx`)
    - Screens: `PascalCaseScreen.tsx` (e.g., `LoginScreen.tsx`)
    - Hooks: `usePascalCase.ts` (e.g., `useAuthService.ts`)
    - GraphQL files: `feature.graphql.ts` or `feature.mutations.ts`, etc.
- **Imports**: Uses absolute paths relative to the `src` directory, configured in `tsconfig.json`.
- **Code Style**: Enforced by Prettier and ESLint. Key style points include single quotes, no trailing commas, and bracket spacing.
