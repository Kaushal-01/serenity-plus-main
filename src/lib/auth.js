import { verifyToken } from "./jwt";

/**
 * Verify authentication from request headers
 * @param {Request} request - The incoming request
 * @returns {Promise<{authenticated: boolean, user?: any, error?: string}>}
 */
export async function verifyAuth(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    
    if (!token) {
      return { authenticated: false, error: "No token provided" };
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return { authenticated: false, error: "Invalid token" };
    }

    return { 
      authenticated: true, 
      user: { 
        id: payload.id,
        email: payload.email,
        name: payload.name
      } 
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { authenticated: false, error: "Authentication failed" };
  }
}
