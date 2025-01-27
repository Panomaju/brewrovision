import { animate } from "@lit-labs/motion";
import { css, html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";

export class PointsManager extends LitElement {
    static properties = {
        pointsData: { type: Array },
    };

    constructor() {
        super();
        this.pointsData = [];
    }

    givePoints() {
        this.pointsData = this.pointsData
            .map(row => {
                row.points += Math.floor(Math.random() * 10) + 1;
                return row;
            })
            .sort((a, b) => b.points - a.points);
    }

    render() {
        return html`
            <points-display>
                ${repeat(
                    this.pointsData,
                    row => row.name,
                    row => html`
                        <point-row
                            ${animate()}
                            logo="${row.logo}"
                            name="${row.name}"
                            points="${row.points}"
                        ></point-row>
                    `,
                )}
            </points-display>

            <button style="margin-top:2rem" @click=${this.givePoints}>Give Points</button>
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
