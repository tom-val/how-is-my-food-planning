import * as jose from "jose";

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const REGION = process.env.AWS_REGION || "eu-central-1";

let jwks;

/**
 * Lambda authorizer for API Gateway (REQUEST type, simple response format).
 * Validates JWTs issued by AWS Cognito using JWKS discovery.
 */
export const handler = async (event) => {
  try {
    const authHeader = event.headers?.authorization ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      console.log("[Authorizer] Missing or malformed Authorization header.");
      return { isAuthorized: false };
    }

    const token = authHeader.slice("Bearer ".length);

    if (!jwks) {
      const jwksUrl = `https://cognito-idp.${REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
      jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
    }

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
    });

    const userId = payload.sub;
    if (!userId) {
      console.log("[Authorizer] Token has no sub claim.");
      return { isAuthorized: false };
    }

    return {
      isAuthorized: true,
      context: { userId },
    };
  } catch (error) {
    console.error("[Authorizer] Token verification failed:", error.message);
    return { isAuthorized: false };
  }
};
