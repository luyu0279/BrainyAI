const cacheMap = new Map<string, string>();

let workerInstance: Worker | null = null;

function getUserConfiguration(): [number, string, number, number, string, string, string, string, string, number] {
    return [
        navigator.hardwareConcurrency + window.screen.width + window.screen.height,
        new Date().toString(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        performance.memory.jsHeapSizeLimit,
        0,
        navigator.userAgent,
        "",
        "",
        navigator.language,
        Array.from(navigator.languages).join(","),
        0
    ];
}

function createWorker(): Worker {
    return new Worker(chrome.runtime.getURL("/resources/js/worker.js"));
}

async function getComputationResult(seed: string, difficulty: string): Promise<any> {
    if (!workerInstance) {
        workerInstance = createWorker();
    }
    const config = getUserConfiguration();
    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (workerInstance) {
                workerInstance.removeEventListener("message", handleMessage);
            }
            resolve(event.data);
        };
        const handleError = (event: ErrorEvent) => {
            if (workerInstance) {
                workerInstance.removeEventListener("error", handleError);
            }
            reject(event);
        };
        if (workerInstance) {
            workerInstance.addEventListener("message", handleMessage);
            workerInstance.addEventListener("error", handleError);
            workerInstance.postMessage({
                seed: seed,
                difficulty: difficulty,
                config: config
            });
        }
    });
}

export async function fetchAndCacheResult(seed: string): Promise<string> {
    if (!cacheMap.has(seed)) {
        const result = await getComputationResult(seed, "0");
        cacheMap.set(seed, result);
    }
    return "gAAAAAC" + cacheMap.get(seed) as string;
}
