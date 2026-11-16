import { describe, expect, it } from "vitest";

import { AppInfoService } from "./AppInfoService";

describe("AppInfoService", () => {
  it("maps app config to page metadata", () => {
    const service = new AppInfoService({
      appConfig: { name: "DevMentor", description: "Mentoring for developers" },
    });

    expect(service.getMetadata()).toEqual({
      title: "DevMentor",
      description: "Mentoring for developers",
    });
  });
});
