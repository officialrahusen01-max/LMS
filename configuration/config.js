import dotenv from 'dotenv';
dotenv.config();

const config = {
    PORT : process.env.PORT,
    NODE_ENV : process.env.NODE_ENV,
    MONGODB_URI : process.env.MONGODB_URI,
    JWT_SECRET : process.env.JWT_SECRET,
    JWT_EXPIRES_IN : process.env.JWT_EXPIRES_IN,
    REFRESH_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN : process.env.REFRESH_TOKEN_EXPIRES_IN,
    
    EMAIL_USER : process.env.EMAIL_USER,
    EMAIL_PASS : process.env.EMAIL_PASS,
    /** Optional: override Gmail default (e.g. SendGrid, Outlook, Mailtrap) */
    SMTP_HOST : process.env.SMTP_HOST,
    SMTP_PORT : process.env.SMTP_PORT,
    SMTP_SECURE : process.env.SMTP_SECURE,
    /** Optional "From" display; defaults to EMAIL_USER */
    EMAIL_FROM : process.env.EMAIL_FROM,
    /**
     * Set to "false" only if you get "self-signed certificate in certificate chain"
     * (e.g. corporate SSL inspection). Weakens TLS verification — avoid in production if possible.
     */
    SMTP_TLS_REJECT_UNAUTHORIZED : process.env.SMTP_TLS_REJECT_UNAUTHORIZED,

    // Roles
    SUPERADMIN : process.env.SUPERADMIN,
    MANAGER : process.env.MANAGER,
    ADMIN : process.env.ADMIN,
    USER : process.env.USER
};

/** Call once at process startup. Fails fast in production if secrets are missing or placeholder. */
export function assertProductionAuthSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  const placeholders = new Set([
    "your-super-secret-jwt-key-here",
    "your-super-secret-refresh-token-key-here",
  ]);
  const j = config.JWT_SECRET;
  const r = config.REFRESH_TOKEN_SECRET;
  if (!j || j.length < 32 || placeholders.has(String(j).trim())) {
    throw new Error(
      "Production: set a strong JWT_SECRET in .env (min 32 characters, not the example placeholder).",
    );
  }
  if (!r || r.length < 32 || placeholders.has(String(r).trim())) {
    throw new Error(
      "Production: set a strong REFRESH_TOKEN_SECRET in .env (min 32 characters, not the example placeholder).",
    );
  }
}

export default config;