import { css, html, LitElement } from "lit";

// Simple vertical container that lays out the point rows with a gap.
export class PointsDisplay extends LitElement {
    render() {
        return html`<slot></slot>`;
    }

    static styles = css`
        slot {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
    `;
}

if (!customElements.get("points-display")) {
    customElements.define("points-display", PointsDisplay);
}
