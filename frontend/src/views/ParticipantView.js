import { html } from "lit";
import "../components/points-manager.js";
import { createState } from "suunta/state";
import { getApiUrl } from "../env.js";
import { onNavigation } from "suunta/triggers";

export function ParticipantView() {
    const state = createState({
        participants: [],
    });

    onNavigation(async () => {
        const data = await fetch(getApiUrl() + "/get-data").then(res => res.json());
        state.participants = data.participantData;
    });

    function addParticipant() {
        state.participants = [...state.participants, { name: "Insert name", score: 0 }];
    }

    function getParticipants() {
        const participantElements = document.querySelectorAll(".participant");
        const participants = [...participantElements].map(part => {
            return {
                name: part.querySelector("input[name='name']").value,
                score: part.querySelector("input[name='score']").value,
            };
        });

        return participants;
    }

    function save() {
        const participants = getParticipants();
        state.participants = participants;
        fetch(getApiUrl() + "/update-participant-data", {
            method: "POST",
            body: JSON.stringify(participants),
        });
    }

    function deleteParticipant(index) {
        const participant = state.participants[index];
        const confirmation = confirm("Oletko varma että haluat poistaa kilpailijan " + participant.name);
        if (confirmation) {
            state.participants = state.participants.filter((item, i) => i !== index);
            setTimeout(() => {
                save();
            }, 100);
        }
    }

    return () => html`
        <div class="part-view">
            <div class="participants">
                <ul>
                    ${state.participants.map(
                        (part, i) => html`
                            <li class="participant">
                                <label>
                                    Name
                                    <input type="text" name="name" value="${part.name}" />
                                </label>

                                <label>
                                    Score
                                    <input type="text" name="score" value="${part.score}" />
                                </label>
                                <button @click=${() => deleteParticipant(i)}>POISTA</button>
                            </li>
                        `,
                    )}
                </ul>
                <button @click=${addParticipant}>Lisää osallistuja</button>
                <button @click=${save} class="save-button">Tallenna</button>
            </div>
        </div>
    `;
}
