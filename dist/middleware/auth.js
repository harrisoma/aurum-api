"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
const supabase_1 = require("../services/supabase");
const jwt = __importStar(require("jsonwebtoken"));
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Missing authorization token' });
    }
    try {
        // First try to verify token with admin client
        const { data, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !data.user) {
            // If admin client fails, try to decode JWT directly
            try {
                const decoded = jwt.decode(token);
                if (decoded?.sub && decoded?.email) {
                    req.user = {
                        id: decoded.sub,
                        email: decoded.email,
                    };
                    return next();
                }
            }
            catch (decodeError) {
                // Decoding also failed
            }
            return res.status(401).json({ error: 'Invalid token' });
        }
        // Attach user to request
        req.user = {
            id: data.user.id,
            email: data.user.email || '',
        };
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (token) {
        // Try to authenticate, but don't fail if it doesn't work
        supabase_1.supabaseAdmin.auth.getUser(token).then(({ data }) => {
            if (data.user) {
                req.user = {
                    id: data.user.id,
                    email: data.user.email || '',
                };
            }
            next();
        });
    }
    else {
        next();
    }
}
//# sourceMappingURL=auth.js.map