import jwt from 'jsonwebtoken';

const userAuth = (req, res, next) => {
    console.log(`\n🛑 [AUTH CHECK] Intercepted: ${req.method} ${req.originalUrl}`);
    console.log("👉 Origin:", req.headers.origin);
    console.log("👉 All Cookies Received by Express:", req.cookies);

    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log("❌ AUTH FAILED: The browser sent zero tokens.");
        return res.status(401).json({ success: false, message: 'Unauthorized access: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("✅ AUTH SUCCESS: Access granted to User ID ->", req.user.id);
        next();
    } catch (error) {
        console.log("❌ AUTH FAILED: Token is invalid or expired ->", error.message);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

export default userAuth;