export type Role = "user" | "admin";

export type Actor = {
  userId: string;
  role: Role;
  name: string;
};

export function isAdmin(actor: Actor): boolean {
  return actor.role === "admin";
}
