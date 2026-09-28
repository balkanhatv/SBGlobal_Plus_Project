import { getFirstPartyWebHandler } from "../../../../server/app/first-party-web-composition.js";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function handle(request:Request):Promise<Response>{
  return getFirstPartyWebHandler()(request);
}

export { handle as GET, handle as POST };
