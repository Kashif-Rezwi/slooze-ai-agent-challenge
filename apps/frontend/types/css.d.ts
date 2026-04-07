// Allows TypeScript to recognise CSS side-effect imports (e.g. import './globals.css').
// Next.js normally provides this via next-env.d.ts which is generated on first run.
// This declaration ensures `tsc --noEmit` passes before the first dev/build invocation.
declare module '*.css' {}
