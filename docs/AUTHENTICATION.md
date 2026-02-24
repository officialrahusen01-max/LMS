# Authentication System Documentation

## Overview

The authentication system implements JWT-based authentication with secure refresh token rotation, hashing, and role-based access control.

### Key Features

- **Registration**: Create new user accounts with email/password
- **Login**: Authenticate with email/password; returns access and refresh tokens
- **Token Refresh**: Rotate refresh tokens with automatic revocation of old tokens
- **Logout**: Revoke refresh tokens for immediate session termination
- **Profile Management**: Retrieve and update user profiles
- **Password Management**: Change password with old-password verification
- **Role-Based Access**: Fine-grained access control by role (admin, instructor, student)

---

## Architecture

### Models

**User** (`src/models/User.js`)
- Stores user credentials, profile, roles, and metadata
- Password hashing via bcrypt pre-save hook
- Methods: `comparePassword()`, `generateAccessToken()`, `generateRefreshToken()`

**RefreshToken** (`src/models/RefreshToken.js`)
- Stores hashed refresh tokens for rotation and revocation
- Supports audit trail (userAgent, ip, timestamps)
- Enforces unique tokenHash constraint

### Services

**AuthService** (`src/services/authService.js`)
- Core business logic for all auth operations
- Static methods for register, login, refresh, logout, profile operations
- Implements token rotation: new refresh token issued on refresh, old marked as replaced
- Refresh tokens are hashed before storage using SHA256

### Controllers

**AuthController** (`src/controllers/authController.js`)
- HTTP endpoint handlers for auth routes
- Wraps AuthService calls with catchAsync for error handling
- Captures userAgent and IP for audit trails

### Middleware

**Authentication** (`src/middleware/auth.js`)
- `authenticate`: Requires valid JWT; attaches `req.user` with decoded payload
- `authorize(roles)`: Role-based access control; checks if user has required roles
- `optionalAuth`: Attaches user if token present, but doesn't fail if missing

### Routes

**Auth Routes** (`src/routes/auth.js`)
- Public: `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`
- Protected: `/v1/auth/logout`, `/v1/auth/me`, `/v1/auth/change-password`

---

## Endpoints

### Register

```
POST /api/v1/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "publicUsername": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

Response (201):
{
  "status": true,
  "message": "User registered successfully",
  "data": {
    "user": { "_id", "fullName", "publicUsername", "email", "roles", ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "a1b2c3d4e5f6..."
  }
}
```

### Login

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "status": true,
  "message": "Login successful",
  "data": {
    "user": { "_id", "fullName", ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "a1b2c3d4e5f6..."
  }
}
```

### Refresh Token

```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}

Response (200):
{
  "status": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "new_token_xyz..."
  }
}

Notes:
- Old refresh token is revoked and marked as replaced
- New refresh token is issued
- Maintains continuous session rotation
```

### Logout

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}

Response (200):
{
  "status": true,
  "message": "Logged out successfully"
}

Notes:
- Refresh token is revoked
- Access token not revoked (expires naturally)
```

### Get Profile

```
GET /api/v1/auth/me
Authorization: Bearer <accessToken>

Response (200):
{
  "status": true,
  "message": "Profile retrieved",
  "data": {
    "_id": "...",
    "fullName": "John Doe",
    "publicUsername": "johndoe",
    "email": "john@example.com",
    "roles": ["student"],
    "bio": "...",
    "avatarUrl": "...",
    ...
  }
}
```

### Update Profile

```
PUT /api/v1/auth/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "bio": "Learning AI and web development",
  "avatarUrl": "https://..."
}

Response (200):
{
  "status": true,
  "message": "Profile updated successfully",
  "data": { ...updated user... }
}

Notes:
- Only specific fields can be updated (fullName, bio, avatarUrl)
- Other fields (email, roles) are protected and cannot be changed via this endpoint
```

### Change Password

```
POST /api/v1/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword456!"
}

Response (200):
{
  "status": true,
  "message": "Password changed successfully"
}
```

---

## Token Management

### Access Token

- **Format**: JWT (JSON Web Token)
- **Payload**: `{ id: userId, roles: [role1, role2], approvedInstructor: boolean }`
- **Expiry**: 1 hour (configurable via `JWT_EXPIRES_IN` in `.env`)
- **Storage**: Client-side (localStorage, sessionStorage, or memory)
- **Usage**: Attach to `Authorization: Bearer <token>` header for protected endpoints

### Refresh Token

- **Format**: Random 32-byte hex string (cryptographically secure)
- **Storage**: Database (hashed with SHA256)
- **Expiry**: 7 days (configurable via `REFRESH_TOKEN_EXPIRES_IN` in `.env`)
- **Rotation**: New token issued on each refresh, old token marked as replaced
- **Revocation**: Automatically revoked on logout
- **Security**: Hashed before storage; never exposed directly in responses

### Token Rotation Strategy

When a refresh token is used:

1. Client sends old refresh token
2. Server hashes it and looks up in database
3. Server validates: not revoked, not expired, user active
4. Server issues new access token
5. Server generates new refresh token and stores hashed version
6. Old refresh token is marked `revoked=true` with `replacedByTokenHash` pointing to new one
7. Client uses new tokens going forward

**Benefits:**
- Limits token lifetime exposure
- Detects token theft (old token used after rotation)
- Audit trail of token lifecycle

---

## Role-Based Access Control

### Roles

- **admin**: Full system access (manage users, courses, content, analytics)
- **instructor**: Create/edit own courses and content, view enrolled students
- **student**: Enroll in courses, track progress, participate in discussions

### Using `authorize` Middleware

```javascript
// Restrict endpoint to admin only
router.get('/admin/analytics', authenticate, authorize(['admin']), handler);

// Allow admin or instructor
router.post('/courses', authenticate, authorize(['admin', 'instructor']), handler);

// Any authenticated user (student, instructor, admin)
router.get('/me', authenticate, handler);
```

---

## Security Best Practices

### 1. Password Security
- Passwords hashed with bcrypt (saltRounds: 12)
- Password field excluded from queries by default (`select: false`)
- Old password verified before allowing change

### 2. Token Security
- Refresh tokens stored hashed (SHA256) in database
- Access tokens short-lived (1 hour)
- Refresh tokens rotated on each use
- Tokens include user agent and IP for audit trail

### 3. Validation & Sanitization
- Input validation in service layer
- Required fields checked before processing
- Email/username uniqueness enforced
- User status checked (active/inactive/suspended)

### 4. Error Handling
- Generic error messages for failed login (don't reveal if email exists)
- Proper HTTP status codes
- Detailed logging for debugging

### 5. HTTP Security
- HTTPS enforced in production
- Secure and HTTPOnly cookies for sensitive data (when needed)
- CORS configured for frontend origin

---

## Configuration

### Environment Variables

```env
# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=1h

# Refresh Token
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# Database
MONGODB_URI=mongodb://localhost:27017/learning-platform

# Email (for future password reset)
EMAIL_USER=noreply@platform.com
EMAIL_PASS=email-password

# Environment
NODE_ENV=production
PORT=5000
```

---

## Testing

### Register User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "publicUsername": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Get Profile (Protected)

```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## Future Enhancements

1. **Password Reset**: Implement email-based password reset with expiring tokens
2. **Two-Factor Authentication**: Add TOTP/SMS 2FA for sensitive accounts
3. **OAuth Integration**: Support Google, GitHub, Facebook login
4. **Device Management**: Track and manage multiple device sessions
5. **Activity Audit**: Log all authentication and authorization events
6. **Rate Limiting**: Implement sophisticated rate limiting per user/IP
7. **Account Recovery**: Security questions or recovery codes

---

## Troubleshooting

### "Invalid or expired token"
- Token may have expired (access tokens expire after 1 hour)
- Use refresh endpoint to get new access token
- Ensure `Authorization` header format is `Bearer <token>`

### "Access denied. No token provided."
- Protected endpoint requires `Authorization` header
- Token must be passed as `Authorization: Bearer <token>`

### "Refresh token has been revoked"
- Token was rotated (new refresh token issued)
- Use new token from previous refresh response
- Or re-authenticate with login

### "Email or username already registered"
- Email or username already exists
- Use unique values or login with existing credentials

---

## See Also

- [User Model](../models/User.js)
- [RefreshToken Model](../models/RefreshToken.js)
- [Authentication Middleware](../middleware/auth.js)
