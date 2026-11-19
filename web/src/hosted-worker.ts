/** Load the immutable Python baseline once, then serve requests off the UI thread. */
import { hostedRoute, Snapshot } from "./hosted-engine";
let data: Promise<Snapshot> | undefined;
self.onmessage = async ({ data: request }) => {
  try {
    data ??= fetch("/snapshot.json").then((response) => {
      if (!response.ok)
        throw new Error("The deployed analysis snapshot could not be loaded.");
      return response.json();
    });
    const snapshot = await data;
    self.postMessage({
      id: request.id,
      result: hostedRoute(snapshot, request.path, request.body),
    });
  } catch (error) {
    self.postMessage({ id: request.id, error: (error as Error).message });
  }
};
