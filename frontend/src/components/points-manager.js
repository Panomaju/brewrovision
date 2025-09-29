import { animate } from "@lit-labs/motion";
import { css, html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";
import "./points-display.js";
import "./point-row.js";

export class PointsManager extends LitElement {
    static properties = {
        pointsData: { type: Array },
    };

    constructor() {
        super();
        this.pointsData = [];
    }

    render() {
        return html`
            <points-display>
                ${repeat(
                    this.pointsData,
                    row => row.name,
                    row => html`
                        <point-row ${animate()} logo="${row.flag}" name="${row.name}" points="${row.score}"></point-row>
                    `,
                )}
            </points-display>
        `;
    }

    static styles = css`
        :host {
            position: relative;
        }
    `;
}

if (!customElements.get("points-manager")) {
    customElements.define("points-manager", PointsManager);
}
