import type { NewUserProfile, UserProfile, UserProfileRepository } from "@devmentor/core";
import type { EntityManager } from "@mikro-orm/postgresql";

import { UserProfileEntity } from "../entities/UserProfile";

export class MikroOrmUserProfileRepository implements UserProfileRepository {
  private readonly em: EntityManager;

  constructor({ em }: { em: EntityManager }) {
    this.em = em;
  }

  findByUserId(userId: string): Promise<UserProfile | null> {
    return this.em.findOne(UserProfileEntity, { userId });
  }

  add(data: NewUserProfile): UserProfile {
    return this.em.create(UserProfileEntity, { ...data, bio: null });
  }

  listRecent(limit: number): Promise<UserProfile[]> {
    return this.em.find(UserProfileEntity, {}, { orderBy: { updatedAt: "desc" }, limit });
  }
}
