import { describe, expect, it } from "vitest";

import * as core from "./index";

describe("@devmentor/core public API", () => {
  it("exposes the app name, DI helpers, services, schemas and errors", () => {
    expect(core.APP_NAME).toBe("DevMentor");
    expect(Object.keys(core)).toEqual(
      expect.arrayContaining([
        "asClass",
        "asFunction",
        "asValue",
        "createDiContainer",
        "Lifetime",
        "AppInfoService",
        "isAdmin",
        "signInSchema",
        "signUpSchema",
        "DomainError",
        "ForbiddenError",
        "NotFoundError",
        "HealthService",
        "toUserProfileDto",
        "UserProfileService",
        "updateProfileSchema",
        "registerCore",
      ]),
    );
  });
});
