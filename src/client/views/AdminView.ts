import { html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { createState } from "suunta/state";
import { onNavigation } from "suunta/triggers";
import { apiUrl } from "../env.ts";
import type { Category, Country, Vote } from "../../shared/types.ts";

// Central score-entry console. The crew picks a category, then for each country
// records how many points that country awarded to every other country (from the
// Eurovision ladder), saves, and reveals the ballot to the overlay.
export function AdminView() {
    const state = createState({
        countries: [] as Country[],
        categories: [] as Category[],
        ladder: [] as number[],
        votes: [] as Vote[],
        selectedCategoryId: 0,
        message: "",
        // Bumped on every flash so the state always changes (even for the same
        // text) and the toast node is re-created to replay its entrance.
        messageNonce: 0,
    });

    // A single shared timer so rapid saves keep the toast up for the full
    // duration after the *last* press, instead of an earlier press clearing it.
    let toastTimer: ReturnType<typeof setTimeout> | undefined;

    async function loadAll() {
        const [boot, votes] = await Promise.all([
            fetch(apiUrl("/api/bootstrap")).then((r) => r.json()),
            fetch(apiUrl("/api/votes")).then((r) => r.json()),
        ]);
        state.countries = boot.countries;
        state.categories = boot.categories;
        state.ladder = boot.ladder;
        state.votes = votes.votes;
        if (!state.selectedCategoryId && state.categories.length) {
            state.selectedCategoryId = state.categories[0].id;
        }
    }

    onNavigation(() => loadAll());

    function getPoints(fromId: number, catId: number, toId: number): number {
        const v = state.votes.find(
            (x) => x.fromCountryId === fromId && x.categoryId === catId && x.toCountryId === toId,
        );
        return v ? v.points : 0;
    }

    function isVoteRevealed(fromId: number, catId: number, toId: number): boolean {
        const v = state.votes.find(
            (x) => x.fromCountryId === fromId && x.categoryId === catId && x.toCountryId === toId,
        );
        return v ? v.revealed : false;
    }

    // The 3 to-countries this ballot gave the highest ("top") or lowest
    // ("bottom") actual points to. Votes with 0 points (unallocated) are
    // excluded so empty ballots don't fall back to UI order.
    function topBottomIds(fromId: number, catId: number, which: "top" | "bottom"): number[] {
        const votes = state.votes
            .filter(
                (v) =>
                    v.fromCountryId === fromId && v.categoryId === catId && v.points > 0,
            )
            .slice()
            .sort((a, b) => (which === "top" ? b.points - a.points : a.points - b.points));
        return votes.slice(0, 3).map((v) => v.toCountryId);
    }

    function allRevealed(fromId: number, catId: number, toIds: number[]): boolean {
        return toIds.length > 0 && toIds.every((id) => isVoteRevealed(fromId, catId, id));
    }

    function revealedCount(fromId: number, catId: number): number {
        return state.votes.filter(
            (v) => v.fromCountryId === fromId && v.categoryId === catId && v.revealed,
        ).length;
    }

    function flash(msg: string) {
        state.message = msg;
        state.messageNonce += 1;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => (state.message = ""), 6000);
    }

    async function saveBallot(fromId: number, catId: number, form: HTMLFormElement) {
        const data = new FormData(form);
        const votes = state.countries
            .filter((c) => c.id !== fromId)
            .map((c) => ({
                toCountryId: c.id,
                points: parseInt((data.get(`to-${c.id}`) as string) ?? "0", 10) || 0,
            }));

        await fetch(apiUrl("/api/ballot"), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fromCountryId: fromId, categoryId: catId, votes }),
        });
        await loadAll();
        flash("Saved");
    }

    async function revealGroup(
        fromId: number,
        catId: number,
        toCountryIds: number[],
        revealed: boolean,
    ) {
        if (toCountryIds.length === 0) return;
        await fetch(apiUrl("/api/ballot/reveal"), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                fromCountryId: fromId,
                categoryId: catId,
                revealed,
                toCountryIds,
            }),
        });
        await loadAll();
        flash(revealed ? "Revealed on overlay" : "Hidden from overlay");
    }

    const eyeOpenIcon = () => html`
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5 text-emerald-400"
            aria-label="revealed"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    `;

    const eyeShutIcon = () => html`
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5 text-slate-500"
            aria-label="hidden"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"
            />
        </svg>
    `;

    const selectField = (fromId: number, catId: number, to: Country) => {
        const current = getPoints(fromId, catId, to.id);
        const revealed = isVoteRevealed(fromId, catId, to.id);
        return html`
            <label class="flex items-center gap-3">
                <img class="w-7 rounded-sm" src="${to.flagImg}" alt="" />
                <span class="flex-1">${to.name}</span>
                ${revealed ? eyeOpenIcon() : eyeShutIcon()}
                <select
                    name="to-${to.id}"
                    class="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-100"
                >
                    <option value="0" ?selected=${current === 0}>—</option>
                    ${state.ladder.map(
                        (p) => html`<option value="${p}" ?selected=${current === p}>${p}</option>`,
                    )}
                </select>
            </label>
        `;
    };

    const ballotCard = (from: Country, catId: number) => {
        const total = Math.max(state.countries.length - 1, 0);
        const revealed = revealedCount(from.id, catId);
        const bottomIds = topBottomIds(from.id, catId, "bottom");
        const topIds = topBottomIds(from.id, catId, "top");
        const bottomRevealed = allRevealed(from.id, catId, bottomIds);
        const topRevealed = allRevealed(from.id, catId, topIds);
        return html`
            <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div class="flex items-center gap-3 mb-3">
                    <img class="w-8 rounded-sm" src="${from.flagImg}" alt="" />
                    <h3 class="text-lg font-bold flex-1">${from.name}'s votes</h3>
                    <span
                        class="text-xs px-2 py-0.5 rounded ${revealed === total && total > 0
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-600/40 text-slate-300"}"
                    >
                        ${revealed}/${total} revealed
                    </span>
                </div>
                <form
                    @submit=${(e: Event) => {
                        e.preventDefault();
                        saveBallot(from.id, catId, e.target as HTMLFormElement);
                    }}
                >
                    <div class="flex flex-col gap-2">
                        ${state.countries
                            .filter((c) => c.id !== from.id)
                            .map((to) => selectField(from.id, catId, to))}
                    </div>
                    <div class="flex gap-3 mt-4 flex-wrap">
                        <button
                            type="submit"
                            class="bg-sky-600 hover:bg-sky-500 rounded px-4 py-1.5 font-medium"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            @click=${() =>
                                revealGroup(from.id, catId, bottomIds, !bottomRevealed)}
                            class="${bottomRevealed
                                ? "bg-slate-600 hover:bg-slate-500"
                                : "bg-emerald-600 hover:bg-emerald-500"} rounded px-4 py-1.5 font-medium"
                        >
                            ${bottomRevealed ? "Hide bottom 3" : "Reveal bottom 3"}
                        </button>
                        <button
                            type="button"
                            @click=${() => revealGroup(from.id, catId, topIds, !topRevealed)}
                            class="${topRevealed
                                ? "bg-slate-600 hover:bg-slate-500"
                                : "bg-emerald-600 hover:bg-emerald-500"} rounded px-4 py-1.5 font-medium"
                        >
                            ${topRevealed ? "Hide top 3" : "Reveal top 3"}
                        </button>
                    </div>
                </form>
            </div>
        `;
    };

    return () => {
        const catId = state.selectedCategoryId;
        return html`
            <div class="flex items-center gap-4 mb-2">
                <a href="/standings" class="text-sky-400 text-sm">Standings →</a>
                <a href="/" class="text-sky-400 text-sm">Overlay →</a>
            </div>
            <h1 class="text-3xl font-bold mb-6">Score entry</h1>

            ${state.countries.length === 0
                ? html`<p class="text-red-400">Could not reach the server. Refresh to retry.</p>`
                : html`
                      <div class="flex flex-wrap gap-2 mb-6">
                          ${state.categories.map(
                              (cat) => html`
                                  <button
                                      @click=${() => (state.selectedCategoryId = cat.id)}
                                      class="${cat.id === catId
                                          ? "bg-sky-600"
                                          : "bg-slate-700 hover:bg-slate-600"} rounded px-3 py-1.5 text-sm font-medium"
                                  >
                                      ${cat.name}
                                  </button>
                              `,
                          )}
                      </div>

                      <div class="grid gap-4 md:grid-cols-2">
                          ${state.countries.map((from) => ballotCard(from, catId))}
                      </div>
                  `}

            ${state.message
                ? keyed(
                      state.messageNonce,
                      html`<div
                          class="toast-anim fixed bottom-4 right-4 bg-emerald-600 text-white rounded px-4 py-2 shadow-lg"
                      >
                          ${state.message}
                      </div>`,
                  )
                : ""}
        `;
    };
}
