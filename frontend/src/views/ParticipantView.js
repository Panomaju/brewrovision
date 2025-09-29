import { html } from "lit";
import "../components/points-manager.js";
import { createState } from "suunta/state";
import { getApiUrl } from "../env.js";
import { onNavigation } from "suunta/triggers";

const TERMS = {
    Tallenna:
        "Tallentaminen tarkoittaa, että tiedot on tallennettu taustajärjestelmään. Tallennettu tieto ladataan aina kun sivun lataa uudelleen",
    Julkaisu:
        "Julkaiseminen tarkoittaa, että tieto näkyy striimi-elementissä. Julkaistaksesi yhden maan pisteen, klikkaa checkbox 'julkaistu', ja Tallenna pisteet. Jos haluat julkaista useammat pisteet kerralla, valitset vain useammat yhden kategorian pisteet ja painat jokaisesti 'Julkaistu' ja tallennat koko muutoksen kerralla painikkeella 'Tallenna pisteet'",
};

export function ParticipantView() {
    const state = createState({
        participants: [],
    });

    onNavigation(async () => {
        const data = await fetch(getApiUrl() + "/get-data").then(res => res.json());
        state.participants = data.participantData.participants;
    });

    async function save(target) {
        const res = await fetch(getApiUrl() + "/update-participant-data", {
            method: "POST",
            body: JSON.stringify({ participants: state.participants }),
        });

        if (res.ok) {
            const successText = target.nextElementSibling;
            successText.innerText = "✅ Tallennus onnistui";
            setTimeout(() => {
                successText.innerText = "";
            }, 2000);
        }
    }

    function saveCategory(participant, categoryName, target) {
        const formData = new FormData(target.closest("form"));

        state.participants
            .find(part => part.country.id === participant.country.id)
            .scores[categoryName].forEach(score => {
                //@ts-ignore
                score.score = parseInt(formData.get(score.countryId.toString()));
                score.published = formData.get(score.countryId.toString() + "-published") === "on";
            });

        save(target);
    }

    return () => {
        const COUNTRIES = state.participants.reduce((acc, part) => {
            acc.push(part.country);
            return acc;
        }, []);

        const COUNTRIES_MAP = COUNTRIES.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
        }, {});

        return html`
            <h1 class="text-2xl font-bold mb-6">Brewrovision Score board</h1>

            <div class="help mb-12">
                <h2 class="text-xl font-bold">Apuja termeihin</h2>
                ${Object.entries(TERMS).map(
                    ([term, explanation]) => html`
                        <ul>
                            <li><b>${term}</b>: ${explanation}</li>
                        </ul>
                    `,
                )}
            </div>

            <div class="participants">
                ${state.participants.map(
                    participant => html`
                        <div class="flex flex-col">
                            <h2 class="text-xl flex gap-4">
                                <img class="w-10" src="${participant.country.flag}" /> ${participant.country.name}
                            </h2>
                            <sl-tab-group>
                                ${[...Object.entries(participant.scores)].map(
                                    ([categoryName, scores]) => html`
                                        <sl-tab slot="nav" panel="${categoryName}">${categoryName}</sl-tab>

                                        <sl-tab-panel
                                            name="${categoryName}"
                                            class="mb-6 p-6 border-solid border-2 border-gray-400"
                                        >
                                            <form>
                                                <h3 class="text-lg font-bold mb-4">${categoryName}</h3>

                                                <ul class="flex flex-col gap-4">
                                                    ${scores.map(score => {
                                                        const country = COUNTRIES_MAP[score.countryId];
                                                        return html`
                                                            <li class="flex gap-6 items-end">
                                                                <sl-input
                                                                    placeholder="Pisteet tähän!"
                                                                    size="medium"
                                                                    label="${country.name}"
                                                                    name="${country.id}"
                                                                    type="number"
                                                                    value="${score.score}"
                                                                >
                                                                    <img
                                                                        slot="prefix"
                                                                        class="w-8 ml-2"
                                                                        src="${country.flag}"
                                                                    />
                                                                </sl-input>

                                                                <sl-checkbox
                                                                    ?checked=${score.published}
                                                                    name="${country.id}-published"
                                                                >
                                                                    Julkaistu
                                                                </sl-checkbox>
                                                            </li>
                                                        `;
                                                    })}
                                                </ul>

                                                <div class="mt-12 flex gap-6">
                                                    <div class="button-holder flex gap-4 items-center">
                                                        <sl-button
                                                            variant="primary"
                                                            @click=${ev =>
                                                                saveCategory(participant, categoryName, ev.target)}
                                                        >
                                                            <sl-icon name="floppy2" slot="prefix"></sl-icon>
                                                            Tallenna pisteet
                                                        </sl-button>
                                                        <p class="success-text text-green-500"></p>
                                                    </div>
                                                </div>
                                            </form>
                                        </sl-tab-panel>
                                    `,
                                )}
                            </sl-tab-group>
                        </div>
                    `,
                )}
            </div>
        `;
    };
}
