export const AUTH_CONFIG = {
  OTP: {
    MAX_ATTEMPTS: 3,
    COOLDOWN_SECONDS: 60,
    EXPIRES_MINUTES: 10 * 60 * 1000,
    RESET_AFTER_HOURS: 1,
  },
} as const;
