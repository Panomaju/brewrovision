import { css, html, LitElement } from "lit";

export class PointsDisplay extends LitElement {
    render() {
        return html` <slot></slot> `;
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
