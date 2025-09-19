import { html } from "lit";
import "../components/points-manager.js";
import { getApiUrl } from "../env.js";
import { createState } from "suunta/state";
import { onNavigation } from "suunta/triggers";

export function ScoreView() {
    const ws = new WebSocket(getApiUrl() + "/ws");

    ws.onmessage = msg => {
        console.log("mssage ", msg);
        updateData();
    };

    const state = createState({
        participants: [],
    });

    onNavigation(async () => {
        await updateData();
    });

    async function updateData() {
        const data = await fetch(getApiUrl() + "/get-data").then(res => res.json());
        state.participants = data.participantData;
    }

    return () => html`<points-manager .pointsData=${state.participants}></points-manager>`;
}
