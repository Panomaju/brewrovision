import { animate } from "@lit-labs/motion";
import { css, html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";
import "./points-display.ts";
import "./point-row.ts";
import type { StandingEntry } from "../../shared/types.ts";

// Renders the ordered list of point rows and animates their reordering as
// totals change (FLIP via @lit-labs/motion).
export class PointsManager extends LitElement {
    static properties = {
        pointsData: { type: Array },
    };

    pointsData: StandingEntry[] = [];

    render() {
        return html`
            <points-display>
                ${repeat(
                    this.pointsData,
                    (row) => row.countryId,
                    (row) => html`
                        <point-row
                            ${animate()}
                            logo="${row.flagImg}"
                            name="${row.name}"
                            points="${row.points}"
                        ></point-row>
                    `,
                )}
            </points-display>
        `;
    }

    static styles = css`
        :host {
            position: relative;
            display: block;
        }
    `;
}

if (!customElements.get("points-manager")) {
    customElements.define("points-manager", PointsManager);
}
