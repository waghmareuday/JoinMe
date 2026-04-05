import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../config/redis.js';

const userAuth = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized access: No token provided' });
    }

    try {
        // Check Redis blacklist (logged-out tokens)
        const blacklisted = await isTokenBlacklisted(token);
        if (blacklisted) {
            return res.status(401).json({ success: false, message: 'Token has been revoked. Please login again.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired, please login again' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

export default userAuth;