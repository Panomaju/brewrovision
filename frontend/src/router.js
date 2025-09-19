import { html, render } from "lit";
import { Suunta } from "suunta";
import { ScoreView } from "./views/ScoreView";
import { ParticipantView } from "./views/ParticipantView";

const routes = [
    {
        path: "/",
        view: ScoreView,
    },
    {
        path: "/participants",
        view: ParticipantView,
    },
];

const renderer = (view, route, renderTarget) => {
    render(html`${view}`, renderTarget);
};

const routerOptions = {
    routes,
    renderer,
    target: document.body,
};

const router = new Suunta(routerOptions);

router.start();
