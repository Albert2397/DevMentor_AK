import { describe, expect, it } from "vitest";

import { registerCore, type CoreCradle } from "../register";
import { asClass, createDiContainer } from "./container";

class ScopedDependency {
  readonly id = Symbol("scoped");
}

class LeakingSingleton {
  readonly dependency: ScopedDependency;

  constructor({ scopedDependency }: { scopedDependency: ScopedDependency }) {
    this.dependency = scopedDependency;
  }
}

describe("createDiContainer", () => {
  it("rejects a singleton that depends on a scoped registration", () => {
    const container = createDiContainer<{
      scopedDependency: ScopedDependency;
      leakingSingleton: LeakingSingleton;
    }>();
    container.register("scopedDependency", asClass(ScopedDependency).scoped());
    container.register("leakingSingleton", asClass(LeakingSingleton).singleton());

    expect(() => container.createScope().resolve("leakingSingleton")).toThrow(/shorter lifetime/);
  });

  it("creates a fresh instance per scope for scoped registrations", () => {
    const container = createDiContainer<{ scopedDependency: ScopedDependency }>();
    container.register("scopedDependency", asClass(ScopedDependency).scoped());

    const first = container.createScope();
    const second = container.createScope();

    expect(first.resolve("scopedDependency")).toBe(first.resolve("scopedDependency"));
    expect(first.resolve("scopedDependency")).not.toBe(second.resolve("scopedDependency"));
  });
});

describe("registerCore", () => {
  it("registers app info as a singleton built from the given config", () => {
    const container = createDiContainer<CoreCradle>();
    registerCore(container, { name: "DevMentor", description: "d" });

    expect(container.createScope().resolve("appInfo")).toBe(
      container.createScope().resolve("appInfo"),
    );
    expect(container.resolve("appInfo").getMetadata().title).toBe("DevMentor");
  });
});
