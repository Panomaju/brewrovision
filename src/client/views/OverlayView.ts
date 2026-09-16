import { html } from "lit";
import { createState } from "suunta/state";
import { onNavigation } from "suunta/triggers";
import { apiUrl, wsUrl } from "../env.ts";
import "../components/points-manager.ts";
import type { StandingEntry } from "../../shared/types.ts";

// The stream overlay: a live, animated leaderboard of revealed points. It
// listens on the websocket and re-fetches whenever the admin reveals a ballot.
export function OverlayView() {
    let ws: WebSocket | undefined;

    const state = createState({
        standings: [] as StandingEntry[],
        connected: false,
    });

    async function updateData() {
        const data = await fetch(apiUrl("/api/overlay")).then((res) => res.json());
        state.standings = data.standings;
    }

    function initWs() {
        ws = new WebSocket(wsUrl());
        ws.onopen = () => {
            state.connected = true;
            updateData();
        };
        ws.onmessage = () => updateData();
        ws.onclose = () => {
            state.connected = false;
            setTimeout(initWs, 1000);
        };
    }

    initWs();
    onNavigation(() => updateData());

    return () => {
        if (!state.connected && state.standings.length === 0) {
            return html`<p style="color:#f8fafc">Connecting…</p>`;
        }
        return html`<points-manager .pointsData=${state.standings}></points-manager>`;
    };
}
