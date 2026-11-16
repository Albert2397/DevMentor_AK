import { createContainer, InjectionMode, type AwilixContainer } from "awilix";

export { asClass, asFunction, asValue, Lifetime } from "awilix";
export type { AwilixContainer, Resolver } from "awilix";

// PROXY mode survives minification (no reliance on parameter names); strict mode
// rejects lifetime leaks such as a singleton depending on a scoped registration.
export function createDiContainer<Cradle extends object>(): AwilixContainer<Cradle> {
  return createContainer<Cradle>({ injectionMode: InjectionMode.PROXY, strict: true });
}
