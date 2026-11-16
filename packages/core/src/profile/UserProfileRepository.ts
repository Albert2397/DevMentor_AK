import type { NewUserProfile, UserProfile } from "./UserProfile";

export interface UserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>;
  /** Registers a new profile; it is written on the next UnitOfWork.commit(). */
  add(data: NewUserProfile): UserProfile;
  listRecent(limit: number): Promise<UserProfile[]>;
}
