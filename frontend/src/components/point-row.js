import { css, html, LitElement } from "lit";

export class PointRow extends LitElement {
    static properties = {
        logo: { type: String },
        name: { type: String },
        points: { type: Number },
        pointsChange: { type: Number },
    };

    constructor() {
        super();
        this.logo = "";
        this.name = "";
        this.points = 0;
        this.pointsChange = undefined;
    }

    render() {
        return html`
            <div class="left-side">
                <div class="logo-holder">
                    <img src="${this.logo}" />
                </div>
                <p class="name-field">${this.name}</p>
            </div>

            <div class="right-side">
                <p>${this.points}</p>
            </div>
        `;
    }

    static styles = css`
        :host {
            display: flex;
            background: #fff;
        }

        :host > div {
            display: flex;
            flex: 1;
            align-items: center;
        }

        p {
            margin: 0;
            font-weight: bold;
            font-size: 1.6rem;
        }

        .name-field {
            padding: 0 1rem;
        }

        .right-side {
            padding: 0 1rem;
            justify-content: flex-end;
        }
    `;
}

if (!customElements.get("point-row")) {
    customElements.define("point-row", PointRow);
}
