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

    // Roles
    SUPERADMIN : process.env.SUPERADMIN,
    MANAGER : process.env.MANAGER,
    ADMIN : process.env.ADMIN,
    USER : process.env.USER
};
export default config;