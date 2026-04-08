import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { setTokenProvider } from "../api/client";

const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "";
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID ?? "";
const isCognitoConfigured = POOL_ID !== "" && CLIENT_ID !== "";

// Only create the pool when Cognito env vars are set.
// In local dev without Cognito, auth operations are no-ops.
const userPool = isCognitoConfigured
  ? new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: CLIENT_ID })
  : null;

export function getCognitoUserPool(): CognitoUserPool | null {
  return userPool;
}

export interface AuthUser {
  sub: string;
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  getAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const extractUser = useCallback((session: CognitoUserSession): AuthUser => {
    const payload = session.getIdToken().decodePayload();
    return {
      sub: payload.sub,
      email: payload.email,
    };
  }, []);

  useEffect(() => {
    if (!userPool) {
      setIsLoading(false);
      return;
    }

    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session?.isValid()) {
            setIsLoading(false);
            return;
          }
          setUser(extractUser(session));
          setIsLoading(false);
        },
      );
    } else {
      setIsLoading(false);
    }
  }, [extractUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!userPool) throw new Error("Cognito is not configured.");
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      return new Promise<void>((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => {
            setUser(extractUser(session));
            resolve();
          },
          onFailure: reject,
        });
      });
    },
    [extractUser],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "name", Value: displayName }),
      ];

      if (!userPool) throw new Error("Cognito is not configured.");
      return new Promise<void>((resolve, reject) => {
        userPool.signUp(email, password, attributes, [], (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    },
    [],
  );

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    if (!userPool) throw new Error("Cognito is not configured.");
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise<void>((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }, []);

  const signOut = useCallback(() => {
    userPool?.getCurrentUser()?.signOut();
    setUser(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const cognitoUser = userPool?.getCurrentUser();
    if (!cognitoUser) return null;

    return new Promise((resolve) => {
      cognitoUser.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session?.isValid()) {
            resolve(null);
            return;
          }
          resolve(session.getAccessToken().getJwtToken());
        },
      );
    });
  }, []);

  // Wire axios interceptor so all API calls include the access token.
  useEffect(() => {
    setTokenProvider(getAccessToken);
  }, [getAccessToken]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      confirmSignUp,
      signOut,
      getAccessToken,
    }),
    [user, isLoading, signIn, signUp, confirmSignUp, signOut, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
