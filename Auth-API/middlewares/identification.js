import jwt from "jsonwebtoken";

export const identifier = (req, res, next) => {
    let token;

    // Determine token source based on client type
    if (req.headers.client === 'not-browser') {
        token = req.headers.authorization;
    } else {
        token = req.cookies['Authorization'];
    }

    // If no token is found
    if (!token) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized: Token not found"
        });
    }

    try {
        console.log("Raw token received:", token);

        // ✅ Strip 'Bearer' prefix if present (case-insensitive)
        const userToken = token.replace(/^bearer\s*/i, '');
        console.log("Parsed token to verify:", userToken);

        // ✅ Verify the token using secret
        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);

        // ✅ Attach only the needed fields to req.user
        // Assumes token was signed like: jwt.sign({ userId: user._id }, secret)
        req.user = {
            userId: jwtVerified.userId
        };

        next();
    } catch (error) {
        console.error("❌ JWT verification failed:", error.message);
        return res.status(403).json({
            success: false,
            message: "Unauthorized: Invalid or expired token"
        });
    }
};
