"use server";

import { headers as getHeaders } from "next/headers";
import type { User } from "@/payload-types";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import type { Payload } from "payload";

export async function getUser(): Promise<User | null> {
  // we get our headers
  const headers = await getHeaders();
  const payload: Payload = await getPayload({ config: await configPromise });
  // and see if we get a user back from payload.auth
  const { user } = await payload.auth({ headers });

  if (user?.collection === "users") {
    // if we get a user, we'll return that user
    return user || null;
  }
  // if we don't, we return null
  return null;
}
