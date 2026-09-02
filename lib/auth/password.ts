import "server-only";

// This hash is intentionally not a secret. Comparing against it keeps an
// unknown-account login close to the timing of a real bcrypt verification.
export const DUMMY_PASSWORD_HASH = "$2b$12$J7cCmEOx0VTubAR5YYHq9eMF4h7turt/NkmG3VFmJvBOLcdpHbUPi";
