export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  churchName: string;
  denomination?: string;
  churchAddress?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  profileId: string;
  churchId: string;
  churchName: string;
  role: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  userId: string;
  email?: string;
  requiresTwoFactor?: boolean;
  twoFactorEmail?: string;
  profile?: {
    profileId: string;
    churchId: string;
    branchId?: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  profile?: LoginResponse["profile"];
}

export interface AuthError {
  message: string;
  statusCode: number;
}
