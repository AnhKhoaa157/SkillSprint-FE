export { Footer } from "./layout/Footer";

// Backwards-compatible re-export: some pages import from "../components/Footer"
// This file keeps those imports working while the real implementation lives
// in `components/layout/Footer.tsx`.
