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

    function isRevealed(fromId: number, catId: number): boolean {
        return state.votes.some(
            (x) => x.fromCountryId === fromId && x.categoryId === catId && x.revealed,
        );
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

    async function toggleReveal(fromId: number, catId: number) {
        const revealed = !isRevealed(fromId, catId);
        await fetch(apiUrl("/api/ballot/reveal"), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fromCountryId: fromId, categoryId: catId, revealed }),
        });
        await loadAll();
        flash(revealed ? "Revealed on overlay" : "Hidden from overlay");
    }

    const selectField = (fromId: number, catId: number, to: Country) => {
        const current = getPoints(fromId, catId, to.id);
        return html`
            <label class="flex items-center gap-3">
                <img class="w-7 rounded-sm" src="${to.flagImg}" alt="" />
                <span class="flex-1">${to.name}</span>
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
        const revealed = isRevealed(from.id, catId);
        return html`
            <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div class="flex items-center gap-3 mb-3">
                    <img class="w-8 rounded-sm" src="${from.flagImg}" alt="" />
                    <h3 class="text-lg font-bold flex-1">${from.name}'s votes</h3>
                    <span
                        class="text-xs px-2 py-0.5 rounded ${revealed
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-600/40 text-slate-300"}"
                    >
                        ${revealed ? "revealed" : "hidden"}
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
                    <div class="flex gap-3 mt-4">
                        <button
                            type="submit"
                            class="bg-sky-600 hover:bg-sky-500 rounded px-4 py-1.5 font-medium"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            @click=${() => toggleReveal(from.id, catId)}
                            class="${revealed
                                ? "bg-slate-600 hover:bg-slate-500"
                                : "bg-emerald-600 hover:bg-emerald-500"} rounded px-4 py-1.5 font-medium"
                        >
                            ${revealed ? "Hide" : "Reveal"}
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
