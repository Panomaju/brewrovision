import { css, html, LitElement, type PropertyValues } from "lit";

// A single country row on the overlay. `points` is the true total; `shownPoints`
// ticks up toward it for the animated count-up, and `pointsChange` briefly shows
// the delta of the last reveal.
export class PointRow extends LitElement {
    static properties = {
        logo: { type: String },
        name: { type: String },
        points: { type: Number },
        shownPoints: { type: Number },
        pointsChange: { type: Number },
    };

    logo = "";
    name = "";
    points = 0;
    shownPoints = 0;
    pointsChange: number | undefined = undefined;

    updated(changed: PropertyValues) {
        if (changed.has("points")) {
            if (this.shownPoints != this.points) {
                this.addShownPointWithDelay();
            }
            const prev = changed.get("points") as number | undefined;
            if (prev !== undefined) {
                this.pointsChange = this.points - prev;
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
                    }, 20000);
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
                    <img src="${this.logo}" alt="" />
                </div>
                <p class="name-field">${this.name}</p>
            </div>

            <div class="right-side">
                <p ?hidden=${!this.pointsChange} class="points-change">
                    ${this.pointsChange && this.pointsChange > 0 ? "+" : ""}${this.pointsChange}
                </p>
                <p class="total-points">${this.shownPoints}</p>
            </div>
        `;
    }

    static styles = css`
        :host {
            display: flex;
            background: linear-gradient(90deg, #1e3a8a, #2563eb);
            color: #fff;
            padding: 0.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
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
            width: 84px;
        }

        .logo-holder img {
            width: 100%;
            border-radius: 3px;
        }

        *[hidden] {
            display: none;
        }

        .points-change {
            padding: 0.5rem;
            background: #fbbf24;
            color: #1e3a8a;
            width: 4ch;
            text-align: center;
            border-radius: 0.375rem;
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
            gap: 0.75rem;
            justify-content: flex-end;
        }
    `;
}

if (!customElements.get("point-row")) {
    customElements.define("point-row", PointRow);
}
