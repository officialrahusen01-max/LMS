import express from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import bodyParser from "body-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";
import globalErrorHandler from "./utils/globalErrorHandler.js";
import corsOptions from "./configuration/cors.js";
import logger from "./utils/logger.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import connectDatabase from "./configuration/database.js";
import { assertProductionAuthSecrets } from "./configuration/config.js";
import { sanitizeInputs } from "./middleware/security.js";
// Register before any Course.populate('pricing.subscriptionPlanId', ...)
import "./models/SubscriptionPlan.js";
import "./models/InstitutionUpdate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

assertProductionAuthSecrets();

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const globalMax = parseInt(process.env.API_RATE_LIMIT_MAX || "", 10);
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX || "", 10);

/** Prod: 100/15m. Dev: 5000/15m (Next + HMR = many /api calls). Override via .env */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:
    Number.isFinite(globalMax) && globalMax > 0
      ? globalMax
      : isProduction
        ? 100
        : 5000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:
    Number.isFinite(authMax) && authMax > 0 ? authMax : isProduction ? 5 : 100,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ Middleware stack
app.use(limiter);
app.use("/api/auth", authLimiter);
app.use(cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
// Do NOT use express-fileupload globally — it parses multipart before multer and causes
// "Unexpected end of form" on POST /api/v1/upload/*. Uploads use multer (memoryStorage).
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🛡️ Input sanitization
app.use(sanitizeInputs);

// 📁 Static files
app.use("/uploads", express.static(join(__dirname, "uploads")));

connectDatabase();

// 📋 Logger
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

// 🌐 Routes
app.use("/api", router);

// 🛠️ Global error handler
app.use(globalErrorHandler);

// Turn off ETag caching
app.disable("etag");

export default app;
