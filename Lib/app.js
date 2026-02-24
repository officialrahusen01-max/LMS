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
import expressFileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import connectDatabase from "./configuration/database.js";
import { sanitizeInputs } from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// 🛡️ Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ Middleware stack
app.use(limiter);
app.use('/api/auth', authLimiter); // Apply stricter limit to auth routes
app.use(cors(corsOptions));
app.use(helmet({
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
    preload: true
  }
}));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' })); // Limit payload size
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(expressFileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🛡️ Input sanitization
app.use(sanitizeInputs);

// 📁 Static files
app.use("/uploads", express.static(join(__dirname, "app", "uploads")));

connectDatabase();

// 📋 Logger
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// 🌐 Routes
app.use("/api", router);

// 🛠️ Global error handler
app.use(globalErrorHandler);

// Turn off ETag caching
app.disable("etag");

export default app;
