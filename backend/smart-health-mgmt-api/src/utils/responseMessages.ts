export const MESSAGE = {
  AUTH: {
    LOGIN_SUCCESS: "Login successful",
    LOGIN_FAILED: "Invalid email or password",
    REGISTER_SUCCESS: "Registration successful",
    UNAUTHORIZED: "Unauthorized access",
    TOKEN_EXPIRED: "Invalid or expired token",
  },

  USER: {
    EMAIL_EXISTS: "Email already exists",
    ACCOUNT_SUSPENDED: "Your account is suspended. Please contact the admin.",
  },

  COMMON: {
    SERVER_ERROR: "Something went wrong. Please try again later.",
    VALIDATION_ERROR: "Required fields are missing",
  },
} as const;
