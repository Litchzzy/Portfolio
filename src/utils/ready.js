let resolveReady;
export const siteReady = new Promise((resolve) => { resolveReady = resolve; });
export const markReady = () => resolveReady();