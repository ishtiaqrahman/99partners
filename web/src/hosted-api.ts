/** Correlate browser-worker requests with promises used by existing UI screens. */
let worker: Worker;
let sequence = 0;
const pending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();
export function hostedRequest<T>(path: string, body?: unknown): Promise<T> {
  if (!worker) {
    worker = new Worker(new URL("./hosted-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }) => {
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      if (data.error) request.reject(new Error(data.error));
      else request.resolve(data.result);
    };
    worker.onerror = () => {
      for (const request of pending.values())
        request.reject(
          new Error(
            "The analysis worker could not start. Reload the page to retry.",
          ),
        );
      pending.clear();
    };
  }
  const id = ++sequence;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: (result) => resolve(result as T), reject });
    worker.postMessage({ id, path, body });
  });
}
