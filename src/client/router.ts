import { html, render } from "lit";
import { Suunta } from "suunta";
import { OverlayView } from "./views/OverlayView.ts";
import { AdminView } from "./views/AdminView.ts";
import { StandingsView } from "./views/StandingsView.ts";

const routes = [
    { path: "/", name: "overlay", view: OverlayView },
    { path: "/admin", name: "admin", view: AdminView },
    { path: "/standings", name: "standings", view: StandingsView },
];

const renderer = (view: unknown, route: any, renderTarget: any) => {
    // The overlay route stays transparent for keying over video; every other
    // route gets the normal padded, dark page chrome.
    document.body.classList.toggle("app", route?.name !== "overlay");
    render(html`${view}`, renderTarget);
};

const router = new Suunta({
    routes,
    renderer,
    target: document.body,
});

router.start();
