import nodemailer from "nodemailer";
import config from "../configuration/config.js";
import otpMailTemplate from "../middleware/mailTemplate/otpMailTemplate.js";
import logger from "./logger.js";

function tlsOptions() {
  const flag = String(config.SMTP_TLS_REJECT_UNAUTHORIZED ?? "").trim().toLowerCase();
  const isProduction =
    String(config.NODE_ENV || "").toLowerCase() === "production";

  if (flag === "true") {
    return {};
  }
  if (flag === "false") {
    logger.warn(
      "[sendOtp] SMTP_TLS_REJECT_UNAUTHORIZED=false — TLS cert verification off for SMTP"
    );
    return { tls: { rejectUnauthorized: false } };
  }
  if (!isProduction) {
    logger.warn(
      "[sendOtp] Non-production: SMTP TLS verify relaxed. Use NODE_ENV=production + SMTP_TLS_REJECT_UNAUTHORIZED=true for strict certs."
    );
    return { tls: { rejectUnauthorized: false } };
  }
  return {};
}

/**
 * Build transporter: custom SMTP if SMTP_HOST set, else Gmail (STARTTLS on 587).
 */
function createMailTransporter(forceInsecureTls = false) {
  const user = String(config.EMAIL_USER || "").trim();
  const pass = String(config.EMAIL_PASS || "").trim();
  if (!user || !pass) {
    throw new Error("Email is not configured (EMAIL_USER / EMAIL_PASS)");
  }

  const extra = forceInsecureTls
    ? { tls: { rejectUnauthorized: false } }
    : tlsOptions();

  if (config.SMTP_HOST) {
    const port = parseInt(String(config.SMTP_PORT || "587"), 10) || 587;
    const secure =
      String(config.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
    return nodemailer.createTransport({
      host: String(config.SMTP_HOST).trim(),
      port,
      secure,
      auth: { user, pass },
      ...(port === 587 && !secure ? { requireTLS: true } : {}),
      ...extra,
    });
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    ...extra,
  });
}

function formatSendError(err) {
  const msg = String(err?.message || err || "unknown");
  const code = err?.code || "";
  const response = String(err?.response || "");

  if (
    /invalid login|535|authentication failed|eauth/i.test(msg + response) ||
    code === "EAUTH"
  ) {
    return (
      "Gmail (or SMTP) rejected the username/password. " +
      "For Gmail: enable 2-Step Verification, then create an **App password** " +
      "(Google Account → Security → App passwords) and put that 16-character value in EMAIL_PASS — not your normal Gmail password."
    );
  }
  if (/self signed certificate|certificate chain|unable to verify/i.test(msg)) {
    return (
      "TLS certificate error. Set Lib/.env SMTP_TLS_REJECT_UNAUTHORIZED=false and restart API, " +
      "or ensure NODE_ENV is not production without that flag (non-production relaxes TLS by default in current code)."
    );
  }
  if (/econnrefused|etimedout|enotfound/i.test(msg) || code === "ECONNECTION") {
    return "Could not reach the mail server. Check SMTP_HOST / network / firewall.";
  }
  return msg;
}

/**
 * @param {string} email
 * @param {string} otp
 * @param {{ subject?: string; productName?: string }} [opts]
 */
const sendOtp = async (email, otp, opts = {}) => {
  const transporter = createMailTransporter();
  const authUser = String(config.EMAIL_USER || "").trim();
  const fromAddr = String(config.EMAIL_FROM || authUser).trim();

  const productName = opts.productName ?? "AiNextro LMS";
  const html = otpMailTemplate(otp, productName);

  const mailOptions = {
    from: fromAddr.includes("<") ? fromAddr : `"${productName}" <${fromAddr}>`,
    to: email,
    subject: opts.subject ?? `${productName} — your login code`,
    html,
    text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    const raw =
      String(err?.message || "") +
      String(err?.cause?.message || "") +
      String(err?.code || "");
    const isCertIssue =
      /self[- ]?signed|certificate chain|unable to verify|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO_SELF_SIGNED_CERT/i.test(
        raw
      );
    if (isCertIssue) {
      logger.warn(
        "[sendOtp] TLS verify failed; retrying with relaxed TLS (587 then Gmail 465)"
      );
      try {
        const fallback587 = createMailTransporter(true);
        await fallback587.sendMail(mailOptions);
        return true;
      } catch (err2) {
        logger.warn("[sendOtp] 587+relaxed failed, trying smtp.gmail.com:465", {
          err: err2?.message,
        });
      }
      if (!config.SMTP_HOST) {
        try {
          const user = String(config.EMAIL_USER || "").trim();
          const pass = String(config.EMAIL_PASS || "").trim();
          const fallback465 = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
          });
          await fallback465.sendMail(mailOptions);
          return true;
        } catch (err3) {
          logger.error("[sendOtp] 465 fallback failed", { err: err3?.message });
        }
      }
    }
    logger.error("[sendOtp] sendMail failed", {
      to: email,
      hint: formatSendError(err),
      err: err?.message,
      code: err?.code,
    });
    const friendly = formatSendError(err);
    throw new Error(`${friendly} (raw: ${err?.message || err?.code || "error"})`);
  }
};

export default sendOtp;
