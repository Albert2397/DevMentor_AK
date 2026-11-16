import { describe, expect, it } from "vitest";

import { DomainError, ForbiddenError, NotFoundError } from "./DomainError";

describe("domain errors", () => {
  it.each([
    [ForbiddenError, "FORBIDDEN"],
    [NotFoundError, "NOT_FOUND"],
  ] as const)("%o carries code %s and the message", (ErrorClass, code) => {
    const error = new ErrorClass("nope");

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.message).toBe("nope");
  });
});
