export type UserProfile = {
  readonly id: string;
  readonly userId: string;
  displayName: string;
  bio: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
};

export type NewUserProfile = Pick<UserProfile, "userId" | "displayName">;

export type UserProfileDto = {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  updatedAt: string;
};

export function toUserProfileDto(profile: UserProfile): UserProfileDto {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    updatedAt: profile.updatedAt.toISOString(),
  };
}
