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
export { registerCore, type CoreCradle } from "./register";
