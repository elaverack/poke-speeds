import { Generations, toID } from '@smogon/calc';

import { championsSpeedRange } from './speed';
import './style.css';

const SETDEX_URL = `${import.meta.env.BASE_URL}setdex_pikalytics_champions_v11.js`;
const GEN9 = Generations.get(9);
const SPECIES_ALIASES: Record<string, string> = {
  Aegislash: 'Aegislash-Blade',
  'Meowstic-Mega': 'Meowstic',
  'Floette-Eternal-Mega': 'Floette-Eternal',
  'Tauros-Paldea': 'Tauros-Paldea-Combat',
};

export function parseSetdexJs(source: string): Record<string, unknown> {
  let s = source.trim();
  s = s.replace(/^var\s+[A-Za-z0-9_]+\s*=\s*/, '');
  if (s.endsWith(';')) s = s.slice(0, -1).trim();
  return JSON.parse(s) as Record<string, unknown>;
}

function baseSpeForSpecies(name: string): number | null {
  const aliased = SPECIES_ALIASES[name] ?? name;
  const species = GEN9.species.get(toID(aliased));
  if (!species) return null;
  return species.baseStats.spe;
}

type TierRow = { baseSpe: number; names: string[] };

function buildTiers(speciesNames: string[]): { tiers: TierRow[]; unknown: string[] } {
  const unknown: string[] = [];
  const byBase = new Map<number, string[]>();

  for (const raw of speciesNames) {
    const baseSpe = baseSpeForSpecies(raw);
    if (baseSpe === null) {
      unknown.push(raw);
      continue;
    }
    let list = byBase.get(baseSpe);
    if (!list) {
      list = [];
      byBase.set(baseSpe, list);
    }
    list.push(raw);
  }

  for (const list of byBase.values()) {
    list.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  const tiers: TierRow[] = [...byBase.entries()]
    .map(([baseSpe, names]) => ({ baseSpe, names }))
    .sort((a, b) => b.baseSpe - a.baseSpe);

  return { tiers, unknown };
}

function render(): void {
  const root = document.getElementById('app');
  if (!root) throw new Error('#app missing');

  root.innerHTML = `
    <header class="page-header">
      <h1>Pokémon Champions — Speed tiers</h1>
      <p class="sub">
        Level 50 · IV 31 · Speed SP 0 (−Spe) … 32 (+Spe). Roster from bundled setdex.
      </p>
      <label class="search">
        <span class="search-label">Filter by species name</span>
        <input id="species-filter" type="search" autocomplete="off" placeholder="e.g. Dragapult" />
      </label>
    </header>
    <div id="status" class="status" role="status"></div>
    <div class="table-wrap">
      <table class="speed-table">
        <thead>
          <tr>
            <th scope="col">Base Spe</th>
            <th scope="col">Speed range</th>
            <th scope="col">Pokémon</th>
          </tr>
        </thead>
        <tbody id="tier-body"></tbody>
      </table>
    </div>
    <footer id="footer-meta" class="footer-meta"></footer>
  `;

  const statusEl = root.querySelector<HTMLElement>('#status')!;
  const tbody = root.querySelector<HTMLTableSectionElement>('#tier-body')!;
  const footer = root.querySelector<HTMLElement>('#footer-meta')!;
  const filterInput = root.querySelector<HTMLInputElement>('#species-filter')!;

  statusEl.textContent = 'Loading setdex…';

  fetch(SETDEX_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load setdex (${r.status})`);
      return r.text();
    })
    .then((text) => {
      const data = parseSetdexJs(text);
      const speciesNames = Object.keys(data);
      const { tiers, unknown } = buildTiers(speciesNames);

      statusEl.textContent = '';

      for (const tier of tiers) {
        const tr = document.createElement('tr');
        const {
          minNegativeNature,
          minNeutralNature,
          maxNeutralNature,
          maxPositiveNature,
        } = championsSpeedRange(tier.baseSpe);
        const namesCell = tier.names.join(', ');

        tr.dataset.searchBlob = tier.names.join(' ').toLowerCase();

        const tdBase = document.createElement('td');
        tdBase.textContent = String(tier.baseSpe);
        tdBase.className = 'num';

        const tdRange = document.createElement('td');
        tdRange.className = 'num range';
        tdRange.textContent =
          `${minNegativeNature} / ${minNeutralNature} / ${maxNeutralNature} / ${maxPositiveNature}`;

        const tdNames = document.createElement('td');
        tdNames.className = 'names';
        tdNames.textContent = namesCell;

        tr.append(tdBase, tdRange, tdNames);
        tbody.appendChild(tr);
      }

      const unkLine =
        unknown.length > 0
          ? `<p class="warn"><strong>${unknown.length}</strong> species not found in dex (check console).</p>`
          : '';
      footer.innerHTML = `
        <p>${tiers.length} base Speed tiers · ${speciesNames.length - unknown.length} Pokémon resolved.</p>
        ${unkLine}
      `;

      if (unknown.length > 0) {
        console.warn('[poke-speeds] Unknown dex species:', unknown);
      }

      const applyFilter = () => {
        const q = filterInput.value.trim().toLowerCase();
        for (const row of tbody.querySelectorAll<HTMLTableRowElement>('tr')) {
          if (!q) {
            row.hidden = false;
            continue;
          }
          const blob = row.dataset.searchBlob ?? '';
          row.hidden = !blob.includes(q);
        }
      };

      filterInput.addEventListener('input', applyFilter);
    })
    .catch((err: unknown) => {
      console.error(err);
      statusEl.textContent =
        err instanceof Error ? err.message : 'Failed to load or parse setdex.';
    });
}

render();
