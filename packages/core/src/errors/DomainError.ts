export type DomainErrorCode = "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "VALIDATION";

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
}
