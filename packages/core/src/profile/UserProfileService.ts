import { isAdmin, type Actor } from "../auth/Actor";
import { ForbiddenError } from "../errors/DomainError";
import type { UnitOfWork } from "../persistence/UnitOfWork";
import { toUserProfileDto, type UserProfile, type UserProfileDto } from "./UserProfile";
import type { UserProfileRepository } from "./UserProfileRepository";
import type { UpdateProfileInput } from "./schemas";

export class UserProfileService {
  private readonly userProfileRepository: UserProfileRepository;
  private readonly unitOfWork: UnitOfWork;

  constructor({
    userProfileRepository,
    unitOfWork,
  }: {
    userProfileRepository: UserProfileRepository;
    unitOfWork: UnitOfWork;
  }) {
    this.userProfileRepository = userProfileRepository;
    this.unitOfWork = unitOfWork;
  }

  async getOwnProfile(actor: Actor): Promise<UserProfileDto> {
    const profile = await this.findOrAdd(actor);
    await this.unitOfWork.commit();
    return toUserProfileDto(profile);
  }

  async updateOwnProfile(actor: Actor, input: UpdateProfileInput): Promise<UserProfileDto> {
    const profile = await this.findOrAdd(actor);
    profile.displayName = input.displayName;
    profile.bio = input.bio === "" ? null : input.bio;
    await this.unitOfWork.commit();
    return toUserProfileDto(profile);
  }

  async listProfiles(actor: Actor, limit = 50): Promise<UserProfileDto[]> {
    if (!isAdmin(actor)) {
      throw new ForbiddenError("Only admins can list profiles.");
    }
    const profiles = await this.userProfileRepository.listRecent(limit);
    return profiles.map(toUserProfileDto);
  }

  private async findOrAdd(actor: Actor): Promise<UserProfile> {
    const existing = await this.userProfileRepository.findByUserId(actor.userId);
    return (
      existing ?? this.userProfileRepository.add({ userId: actor.userId, displayName: actor.name })
    );
  }
}
