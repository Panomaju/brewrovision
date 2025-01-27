import { html, render } from "lit";
import "./components/points-display.js";
import "./components/point-row.js";
import "./components/points-manager.js";

const POINTS_MOCK = [
    { name: "Finland", points: 0, logo: "https://flagsapi.com/FI/flat/64.png" },
    { name: "Switzerland", points: 0, logo: "https://flagsapi.com/CH/flat/64.png" },
    { name: "Portugal", points: 0, logo: "https://flagsapi.com/PT/flat/64.png" },
    { name: "Italy", points: 0, logo: "https://flagsapi.com/IT/flat/64.png" },
    { name: "Bulgaria", points: 0, logo: "https://flagsapi.com/BG/flat/64.png" },
    { name: "Malta", points: 0, logo: "https://flagsapi.com/MT/flat/64.png" },
    { name: "Netherlands", points: 0, logo: "https://flagsapi.com/NL/flat/64.png" },
    { name: "Germany", points: 0, logo: "https://flagsapi.com/DE/flat/64.png" },
];

export function renderPointsView() {
    const view = html`
        <h2>Panomaju</h2>

        <points-manager .pointsData=${POINTS_MOCK}></points-manager>
    `;

    render(view, document.body);
}

renderPointsView();
