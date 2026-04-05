import jwt from 'jsonwebtoken';
import config from '../configuration/config.js';

const authentication = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const RoleAccess = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. You do not have permission to perform this action.' });
        }
        next();
    };
}


export { authentication, RoleAccess };