import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/server/auth/auth";

const auth = getAuth();

export const { GET, POST } = toNextJsHandler(auth);
