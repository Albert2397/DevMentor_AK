import { describe, expect, it } from "vitest";

import { fakeEntityManager } from "../testing/fakeEntityManager";
import { MikroOrmUnitOfWork } from "./MikroOrmUnitOfWork";

describe("MikroOrmUnitOfWork", () => {
  it("commits by flushing the request's entity manager", async () => {
    const { fake, em } = fakeEntityManager();

    await new MikroOrmUnitOfWork({ em }).commit();

    expect(fake.flush).toHaveBeenCalledOnce();
  });
});
