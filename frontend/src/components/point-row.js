import { css, html, LitElement } from "lit";
import { when } from "lit/directives/when.js";

export class PointRow extends LitElement {
    static properties = {
        logo: { type: String },
        name: { type: String },
        points: { type: Number },
        shownPoints: { type: Number },
        pointsChange: { type: Number },
    };

    constructor() {
        super();
        this.logo = "";
        this.name = "";
        this.points = 0;
        this.shownPoints = 0;
        this.pointsChange = undefined;
    }

    /**
     * @param {import("lit").PropertyValues} _changedProperties
     */
    updated(_changedProperties) {
        if (_changedProperties.has("points")) {
            if (this.shownPoints != this.points) {
                this.addShownPointWithDelay();
            }
            this.pointsChange = this.points - _changedProperties.get("points");
        }
        if (_changedProperties.has("shownPoints")) {
            if (this.shownPoints < this.points) {
                //this.addShownPointWithDelay();
            }
        }
    }

    addShownPointWithDelay() {
        const delay = 25;
        setTimeout(
            () => {
                if (this.shownPoints === this.points) {
                    setTimeout(() => {
                        this.pointsChange = undefined;
                    }, 2000);
                    return;
                }
                if (this.shownPoints < this.points) {
                    this.shownPoints += 1;
                } else {
                    this.shownPoints -= 1;
                }
                this.addShownPointWithDelay();
            },
            Math.floor(Math.random() * delay * 2) + delay,
        );
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
                <p ?hidden=${!this.pointsChange} class="points-change">
                    ${this.pointsChange > 0 ? "+" : ""} ${this.pointsChange}
                </p>
                <p class="total-points">${this.shownPoints}</p>
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

        .logo-holder {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 150px;
        }

        .logo-holder img {
            width: 100%;
        }

        *[hidden] {
            display: none;
        }

        .points-change {
            padding: 0.5rem;
            background: lightblue;
            width: 4ch;
            text-align: center;
        }

        .total-points {
            padding: 0 0.5rem;
            width: 3ch;
            text-align: right;
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
