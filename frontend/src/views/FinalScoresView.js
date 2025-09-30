import { html } from "lit";
import { getApiUrl } from "../env";
import { onNavigation } from "suunta/triggers";
import { createState } from "suunta/state";

export function FinalScoresView() {
    const state = createState({
        standings: {},
    });

    onNavigation(async () => {
        await updateData();
    });

    async function updateData() {
        const data = await fetch(getApiUrl() + "/get-final-score-data").then(res => res.json());
        state.standings = data.standings;
    }

    return () => html`
        <h1 class="text-2xl font-bold">Final scores</h1>

        <div class="">
            ${[...Object.entries(state.standings)].map(
                ([category, standings]) => html`
                    <div class="flex flex-col my-6 p-4 gap-4 border-black border-solid border-2">
                        <h2 class="text-xl font-bold">${category}</h2>
                        <ul class="flex flex-col gap-4">
                            ${standings.map(
                                standing => html`
                                    <li class="flex gap-2">
                                        <img class="w-10" src="${standing.flag}" /> ${standing.countryName}:
                                        <b>${standing.score}</b>
                                    </li>
                                `,
                            )}
                        </ul>
                    </div>
                `,
            )}
        </div>
    `;
}
