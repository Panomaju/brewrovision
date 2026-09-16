import { html } from "lit";
import { createState } from "suunta/state";
import { onNavigation } from "suunta/triggers";
import { apiUrl } from "../env.ts";
import type { CategoryStandings, StandingEntry } from "../../shared/types.ts";

// Read-only results page: overall standings plus a breakdown per category.
// Reflects only what has been revealed on stream.
export function StandingsView() {
    const state = createState({
        overall: [] as StandingEntry[],
        categories: [] as CategoryStandings[],
    });

    async function updateData() {
        const data = await fetch(apiUrl("/api/standings")).then((res) => res.json());
        state.overall = data.overall;
        state.categories = data.categories;
    }

    onNavigation(() => updateData());

    const entryRow = (e: StandingEntry, i: number) => html`
        <li class="flex items-center gap-3 py-1">
            <span class="w-6 text-right text-slate-400">${i + 1}.</span>
            <img class="w-8 rounded-sm" src="${e.flagImg}" alt="" />
            <span class="flex-1">${e.name}</span>
            <b class="text-amber-400">${e.points}</b>
        </li>
    `;

    return () => html`
        <a href="/admin" class="text-sky-400 text-sm">← Admin</a>
        <h1 class="text-3xl font-bold mt-2 mb-8">Standings</h1>

        <section class="mb-10 rounded-lg border border-slate-700 bg-slate-800/50 p-5">
            <h2 class="text-xl font-bold mb-3">Overall</h2>
            <ul>${state.overall.map(entryRow)}</ul>
        </section>

        <div class="grid gap-6 md:grid-cols-2">
            ${state.categories.map(
                (cat) => html`
                    <section class="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
                        <h2 class="text-lg font-bold mb-3">${cat.categoryName}</h2>
                        ${cat.entries.length === 0
                            ? html`<p class="text-slate-400 text-sm">Nothing revealed yet.</p>`
                            : html`<ul>${cat.entries.map(entryRow)}</ul>`}
                    </section>
                `,
            )}
        </div>
    `;
}
