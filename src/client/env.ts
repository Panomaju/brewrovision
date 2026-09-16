// The client is served same-origin as the API (directly in prod, via the Vite
// proxy in dev), so all URLs are relative.

export function apiUrl(path: string): string {
    return path;
}

export function wsUrl(): string {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}/ws`;
}
