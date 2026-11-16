export const APP_NAME = "DevMentor";

export {
  asClass,
  asFunction,
  asValue,
  createDiContainer,
  Lifetime,
  type AwilixContainer,
  type Resolver,
} from "./di/container";
export { AppInfoService, type AppConfig, type AppMetadata } from "./app-info/AppInfoService";
export { isAdmin, type Actor, type Role } from "./auth/Actor";
export { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "./auth/schemas";
export {
  DomainError,
  ForbiddenError,
  NotFoundError,
  type DomainErrorCode,
} from "./errors/DomainError";
export { HealthService, type DatabaseHealthCheck, type HealthReport } from "./health/HealthService";
export type { UnitOfWork } from "./persistence/UnitOfWork";
export {
  toUserProfileDto,
  type NewUserProfile,
  type UserProfile,
  type UserProfileDto,
} from "./profile/UserProfile";
export type { UserProfileRepository } from "./profile/UserProfileRepository";
export { UserProfileService } from "./profile/UserProfileService";
export { updateProfileSchema, type UpdateProfileInput } from "./profile/schemas";
export { registerCore, type CoreCradle, type CorePorts } from "./register";
