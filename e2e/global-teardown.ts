import { disposeDb } from "./helpers/db";

export default async function globalTeardown() {
  await disposeDb();
}
