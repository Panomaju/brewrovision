import { html } from "lit";
import "../components/points-manager.js";
import { getApiUrl } from "../env.js";
import { createState } from "suunta/state";
import { onNavigation } from "suunta/triggers";

export function ScoreView() {
    let ws;

    function initWs() {
        console.log("Attempting to open ws connection");
        ws = new WebSocket(getApiUrl() + "/ws");

        ws.onmessage = msg => {
            console.log("mssage ", msg);
            updateData();
        };

        ws.onclose = () => {
            setTimeout(() => {
                initWs();
            }, 1000);
        };
    }

    initWs();

    const state = createState({
        participants: [],
    });

    onNavigation(async () => {
        await updateData();
    });

    async function updateData() {
        const data = await fetch(getApiUrl() + "/get-score-data").then(res => res.json());
        state.participants = data.participantData.participants;
    }

    return () => html`<points-manager .pointsData=${state.participants}></points-manager>`;
}
