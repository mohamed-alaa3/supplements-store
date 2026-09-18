export type UserRole = "customer" | "seller" | "admin";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  preferredLanguage: "ar" | "en";
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface ResendVerificationData {
  email: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  data: { verified: boolean };
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    requiresVerification?: boolean;
  };
  message?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  preferredLanguage?: "ar" | "en";
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
