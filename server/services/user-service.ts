import { getUserByIdentifier } from "@/lib/repositories/users-repository";

export async function getUserByUsernameOrEmail(identifier: string) {
  return getUserByIdentifier(identifier);
}

