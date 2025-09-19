export function getApiUrl() {
    return isDev() ? "http://localhost:3000" : "https://panomaju-api.matsu.beer";
}

export function isDev() {
    return window.location.origin.includes("localhost");
}
