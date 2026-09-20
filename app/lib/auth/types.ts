export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type StoredUser = AuthUser & {
  password: string;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_credentials" | "duplicate_email" | "missing_fields",
  ) {
    super(message);
    this.name = "AuthError";
  }
}
