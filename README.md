# API.AI.COM - Learning Management System

A comprehensive Node.js-based Learning Management System with AI integration, built with Express.js and MongoDB.

## 🚀 Features

- **User Management**: Multi-role authentication (SuperAdmin, Manager, Admin, User)
- **Course Management**: Create, manage, and organize courses with lessons
- **Enrollment System**: User enrollment and progress tracking
- **AI Integration**: OpenAI-powered features for enhanced learning
- **File Uploads**: Cloudinary integration for media files
- **Blog System**: Content management and blogging capabilities
- **Certificate Generation**: Automated certificate creation for completed courses
- **Security**: Rate limiting, CORS, helmet security, input sanitization
- **Logging**: Winston-based logging system

## 📁 Project Structure

```
├── configuration/          # Configuration files
│   ├── config.js          # Environment variables configuration
│   ├── cors.js            # CORS settings
│   └── database.js        # Database connection
├── controllers/           # Route controllers
│   ├── authController.js
│   ├── courseController.js
│   ├── enrollmentController.js
│   ├── aiController.js
│   └── ...
├── middleware/            # Custom middleware
│   ├── auth.js
│   ├── validation.js
│   └── security.js
├── models/               # MongoDB models
│   ├── User.js
│   ├── Course.js
│   ├── Enrollment.js
│   └── ...
├── routes/               # API routes
│   ├── index.js         # Main router
│   ├── auth.js
│   ├── courses.js
│   ├── enrollments.js
│   ├── ai.js
│   └── ...
├── services/            # Business logic services
│   ├── authService.js
│   ├── emailService.js
│   ├── aiService.js
│   └── ...
├── utils/               # Utility functions
│   ├── logger.js
│   ├── globalErrorHandler.js
│   └── ...
├── uploads/             # File upload directory
├── logs/                # Application logs
├── docs/                # Documentation
├── app.js               # Express app configuration
├── server.js            # Server startup
├── package.json
├── .env.example         # Environment variables template
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd api.ai.com
npm install
```

### 2. Environment Configuration
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Required Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `REFRESH_TOKEN_SECRET`: Refresh token secret
- `EMAIL_USER` & `EMAIL_PASS`: Email configuration
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `CLOUDINARY_*`: Cloudinary configuration for file uploads

### 4. Start the Server
```bash
# Development mode with auto-reload
npm start

# Or directly with node
node server.js
```

## 🌐 API Endpoints

### Base URL: `http://localhost:3000/api/v1`

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - User logout

### Courses
- `GET /courses` - Get all courses
- `GET /courses/:id` - Get course by ID
- `POST /courses` - Create new course (Admin+)
- `PUT /courses/:id` - Update course (Admin+)
- `DELETE /courses/:id` - Delete course (Admin+)

### Enrollments
- `POST /enrollments` - Enroll in course
- `GET /enrollments/user/:userId` - Get user enrollments
- `GET /enrollments/course/:courseId` - Get course enrollments

### AI Features
- `POST /ai/chat` - AI chat functionality
- `POST /ai/generate-content` - Generate AI content

### Upload
- `POST /upload` - Upload files
- `GET /uploads/:filename` - Access uploaded files

## 🔐 Security Features

- **Rate Limiting**: 100 requests per 15 minutes, 5 for auth endpoints
- **CORS**: Configured cross-origin resource sharing
- **Helmet**: Security headers and protections
- **Input Sanitization**: XSS and injection prevention
- **JWT Authentication**: Secure token-based authentication
- **File Upload Limits**: 50MB maximum file size

## 📝 Logging

The application uses Winston for structured logging:
- Development: Console output
- Production: File-based logging in `/logs` directory

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up reverse proxy (nginx/Apache)
4. Configure SSL certificates
5. Set up process manager (PM2 recommended)

### Environment Variables for Production
- Use strong, unique secrets
- Configure production database
- Set up email service
- Configure cloud storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API endpoints above

## 🔄 Version History

- **v1.0.0** - Initial release with core LMS features
- AI integration
- Multi-role authentication
- Course and enrollment management
