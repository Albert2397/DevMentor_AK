import { AppInfoService, type AppConfig } from "./app-info/AppInfoService";
import { asClass, asValue, type AwilixContainer } from "./di/container";
import { HealthService, type DatabaseHealthCheck } from "./health/HealthService";
import type { UnitOfWork } from "./persistence/UnitOfWork";
import type { UserProfileRepository } from "./profile/UserProfileRepository";
import { UserProfileService } from "./profile/UserProfileService";

/** Ports core depends on; another package (db) must register them. */
export type CorePorts = {
  databaseHealthCheck: DatabaseHealthCheck;
  unitOfWork: UnitOfWork;
  userProfileRepository: UserProfileRepository;
};

export type CoreCradle = CorePorts & {
  appConfig: AppConfig;
  appInfo: AppInfoService;
  healthService: HealthService;
  userProfileService: UserProfileService;
};

export function registerCore<Cradle extends CoreCradle>(
  container: AwilixContainer<Cradle>,
  config: AppConfig,
): void {
  container.register("appConfig", asValue(config));
  container.register("appInfo", asClass(AppInfoService).singleton());
  container.register("healthService", asClass(HealthService).scoped());
  container.register("userProfileService", asClass(UserProfileService).scoped());
}
