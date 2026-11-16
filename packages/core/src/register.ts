import { AppInfoService, type AppConfig } from "./app-info/AppInfoService";
import { asClass, asValue, type AwilixContainer } from "./di/container";

export type CoreCradle = {
  appConfig: AppConfig;
  appInfo: AppInfoService;
};

export function registerCore<Cradle extends CoreCradle>(
  container: AwilixContainer<Cradle>,
  config: AppConfig,
): void {
  container.register("appConfig", asValue(config));
  container.register("appInfo", asClass(AppInfoService).singleton());
}
