//  PipeScore - online bagpipe notation
//  Copyright (C) macarc
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

//  The page that allows the user to view, open and delete all their scores.

import Auth from 'firebase-auth-lite';
import { Database, type Document } from 'firebase-firestore-lite';
import m from 'mithril';
import {
  type DeprecatedSavedScore,
  type SavedScore,
  scoreHasStavesNotTunes,
} from '../PipeScore/SavedModel';
import { onUserChange } from '../auth-helper';
import { readFile } from '../common/file';

let userId = '';

// This can be safely public
const apiToken = 'AIzaSyBa_TicvHYIJFphscfeBDGADo1Kwkq702w';

const auth = new Auth({ apiKey: apiToken });

const db = new Database({ projectId: 'pipe-score-andy', auth });

type ScoreRef = { name: string; path: string; timeSignature: string; composer: string; tuneType: string, bpm: string };

type FileInput = HTMLInputElement & { files: FileList };

function getName(
  score: Document | ScoreRef | SavedScore | DeprecatedSavedScore
) {
  const defaultName = 'Empty Score';
  if ((score as DeprecatedSavedScore).name) {
    return (score as DeprecatedSavedScore).name || defaultName;
  }

  const sscore = score as SavedScore;
  const name = sscore.tunes?.[0]?.name;

  if (typeof name === 'string') {
    return name || defaultName;
  }

  return name.text || defaultName;
}
function getComposer(
  score: Document | ScoreRef | SavedScore | DeprecatedSavedScore
) {
  const defaultName = 'No Composer';
  if ((score as DeprecatedSavedScore).name) {
    return defaultName;
  }

  const sscore = score as SavedScore;
  const composer = sscore.tunes?.[0]?.composer;

  if (typeof composer === 'string') {
    return composer || defaultName;
  }

  return composer.text || defaultName;
}
function getBPM(
  score: Document | ScoreRef | SavedScore | DeprecatedSavedScore
) {
  const defaultName = '? BPM';
  if ((score as DeprecatedSavedScore).name) {
    return defaultName;
  }

  const sscore = score as SavedScore;
  const bpm = sscore.settings.bpm;

  if (typeof bpm !== 'number') {
    return defaultName;
  }

  return `${bpm} BPM`;
}

function getTuneType(
  score: Document | ScoreRef | SavedScore | DeprecatedSavedScore
) {
  const defaultName = 'No Tune Type';
  if ((score as DeprecatedSavedScore).name) {
    return defaultName;
  }

  const sscore = score as SavedScore;
  const tuneType = sscore.tunes?.[0]?.tuneType;

  if (typeof tuneType === 'string') {
    return tuneType || defaultName;
  }
  if (tuneType.text != tuneType.text.trim()) console.log(sscore.tunes?.[0]?.name);
  return tuneType.text.trim() || defaultName;
}

function getTimeSignature(
  score: Document | ScoreRef | SavedScore | DeprecatedSavedScore
) {
  const sscore = score as SavedScore;
  const ts1 = sscore.tunes?.[0]?.staves[0].bars[0].timeSignature.ts[0];
  const ts2 = sscore.tunes?.[0]?.staves[0].bars[0].timeSignature.ts[1];
  if (typeof ts1 === 'string') {
    if (ts1 == 'c' || ts1 == 'C') return 'Com';
    if (ts1 == 'c_' || ts1 == 'C_') return 'Cut';
  }
  if (typeof ts1 === 'number') {
    return `${ts1}/${ts2}`;
  }
  return 'Not Set'
}

function setName(
  score: Document | ScoreRef | SavedScore | DeprecatedSavedScore,
  name: string
) {
  const s = score as SavedScore | DeprecatedSavedScore;
  if (scoreHasStavesNotTunes(s)) {
    s.name = name;
  } else if (s.tunes[0]) {
    s.tunes[0].name = name;
  }
}
function getPropertyList<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(item => item[key]);
}

class ScoresList {
  loading = true;
  scores: ScoreRef[] = [];
  selected: ScoreRef[] = [];
  timeSignatures: string[] = [];
  tuneTypes: string[] = [];
  checkedTuneTypeLabel = '';
  checkedTimeSignatureLabel = '';
  filterByName = '';

  oninit() {
    onUserChange(auth, (user) => {
      if (user) {
        userId = user.localId;
        this.refreshScores();
      } else {
        window.location.assign('/login');
      }
    });

    // Need to do this here so we have access to refreshScores()
    document.getElementById('upload')?.addEventListener('click', () => {
      // Create a temporary file input element, and use that to
      // prompt the user to select a file
      const f = document.createElement('input') as FileInput;

      f.setAttribute('type', 'file');
      f.setAttribute('multiple', 'multiple');
      f.setAttribute('accept', '.pipescore,.json,text/json');

      f.addEventListener('change', async () => {
        // For each file selected, read it and add it to the scores collection
        const collection = db.ref(`scores/${userId}/scores`);
        for (let i = 0; i < f.files.length; i++) {
          const file = f.files.item(i);
          if (file) {
            const contents = await readFile(file);
            const json = JSON.parse(contents);
            const score = await collection.add(json);

            // If only one file was selected, open it up in PipeScore
            if (score && f.files.length === 1) {
              window.location.assign(`/pipescre/${userId}/${score.id}`);
            }
          }
        }
        this.refreshScores();
      });

      // Trigger the file dialogue
      f.click();
    });
  }

  async duplicate(score: ScoreRef) {
    try {
      const scoreContents = (await db
        .ref(`scores${score.path}`)
        .get()) as unknown as SavedScore;

      const newTitle = `${getName(scoreContents)} (copy)`;
      setName(scoreContents, newTitle);

      await db.ref(`scores/${userId}/scores`).add(scoreContents);

      this.refreshScores();
    } catch (e) {
      console.log(e);
      alert(`Error duplicating score: ${(e as Error).name}`);
    }
  }

  async delete(score: ScoreRef) {
    const sure = confirm(`Are you sure you want to delete ${getName(score)}?`);
    if (sure) {
      await db.ref(`scores${score.path}`).delete();
      this.refreshScores();
    }
  }

  async rename(scoreRef: ScoreRef) {
    const score = await db.ref(`scores${scoreRef.path}`).get();
    const newName = prompt('Rename:', getName(score));
    if (newName) {
      setName(score, newName);
      await db.ref(`scores${scoreRef.path}`).set(score);
      this.refreshScores();
    }
  }
  async updateSelection(scoreRef: ScoreRef, checked: boolean) {
    if (checked) {
      this.selected.push(scoreRef);
    } else {
      let index = this.selected.indexOf(scoreRef);
      if (index > -1) {
        this.selected.splice(index, 1);
      }
    }
    m.redraw();
  }
  async combineScores() {
    this.loading = true;
    try {
      const scores: SavedScore[] = [];
      for (const score of this.selected) {
        scores.push(
          (await db.ref(`scores${score.path}`).get()) as unknown as SavedScore
        );
      }
      setName(scores[0], `(Combined)${getName(scores[0])}`);
      for (let i = 1; i < scores.length; i++) {
        setName(scores[0], `${getName(scores[0])} - ${getName(scores[i])}`);
        scores[0].tunes.push(scores[i].tunes[0]);
        for (const secondTiming of scores[i].secondTimings) {
          scores[0].secondTimings.push(secondTiming);
        }
      }
      await db.ref(`scores/${userId}/scores`).add(scores[0]);
    } catch (e) {
      console.log(e);
      alert(`Error combining scores: ${(e as Error).name}`);
    }
    this.refreshScores();
  }
  async refreshScores() {
    console.log("refreshScores");
    // Use query() rather than list() to avoid limits
    const collection: Document[] = await db
      .ref(`scores/${userId}/scores`)
      .query()
      .run();
    this.scores = collection
      .map((doc) => ({
        name: getName(doc),
        path: doc.__meta__.path.replace('/scores', ''),
        timeSignature: getTimeSignature(doc),
        composer: getComposer(doc),
        tuneType: getTuneType(doc),
        bpm: getBPM(doc)
      }))
      .sort(({ name: name1 }, { name: name2 }) =>
        name1 === name2 ? 0 : name1.toLowerCase() < name2.toLowerCase() ? -1 : 1
      );
    // get unique list of Time signatures and Tune types
    const timeSignatureList: string[] = getPropertyList(this.scores, "timeSignature") as string[];
    this.timeSignatures = Array.from(new Set(timeSignatureList))
      .sort((one: String, two: String) => (one < two ? -1 : 1));
    const tuneTypesList: string[] = getPropertyList(this.scores, "tuneType") as string[];
    this.tuneTypes = Array.from(new Set(tuneTypesList))
      .sort((one: String, two: String) => (one < two ? -1 : 1));

    this.loading = false;
    m.redraw();
  }

  view() {
    if (this.loading) return [m('div.loading', m('div.spinner'))];

    const path = (score: ScoreRef) =>
      `/pipescre${score.path.replace('/scores/', '/')}`;
    var filterdScores: ScoreRef[] = [];
    for (var i = 0; i < this.scores.length; i++) {
      if (this.checkedTimeSignatureLabel != '' && this.checkedTimeSignatureLabel != this.scores[i].timeSignature) continue;
      if (this.checkedTuneTypeLabel != '' && this.checkedTuneTypeLabel != this.scores[i].tuneType) continue;
      if (this.filterByName != '' && !this.scores[i].name.toLowerCase().includes(this.filterByName.toLowerCase())) continue;
      filterdScores.push(this.scores[i]);
    };
    var index = 0;
    return [
      m('div.btn-group mb-3', [
        m('span.input-group-text', 'Time Signature'),
        ...this.timeSignatures.map((timeSignature) => {
          const checked = this.checkedTimeSignatureLabel === timeSignature;

          return [
            m('input.btn-check', {
              autocomplete: "off",
              type: "checkbox",
              id: `checkBtn${index}`,
              checked,
              onchange: () => this.checkedTimeSignatureLabel = checked ? '' : timeSignature,
            }),
            m('label.btn btn-outline-primary', { for: `checkBtn${index++}` }, timeSignature)
          ]
        })
      ]),
      m('div.btn-group mb-3', [
        m('span.input-group-text', 'Tune Type'),
        ...this.tuneTypes.map((tuneType) => {
          const checked = this.checkedTuneTypeLabel === tuneType;
          return [
            m('input.btn-check', {
              autocomplete: "off",
              type: "checkbox",
              id: `checkBtn${index}`,
              checked,
              onchange: () => this.checkedTuneTypeLabel = checked ? '' : tuneType,
            }),
            m('label.btn btn-outline-primary', { for: `checkBtn${index++}` }, tuneType),
          ]
        })
      ]),
      m('div.input-group mb-3', [
        m('span.input-group-text', 'Filter by name'),
        m('input.form-control', {
          placeholder: "Enter name of tune",
          value: this.filterByName,
          oninput: (e: any) => {
            const newValue = e.target.value.trim();
            this.filterByName = newValue;
          },
        }),
        //<button type="button" class="btn btn-primary">Primary</button>
        m('button.btn btn-primary', {
          onclick: () => {
            this.filterByName = '';
            this.checkedTimeSignatureLabel = '';
            this.checkedTuneTypeLabel = '';
          },
        }, 'Reset'),
      ]),
      m('p', 'Selected Scores:'),
      m('table', [
        ...this.selected.map((score) =>
          m('tr', [
            m('td.td-name', m('a', { href: path(score) }, getName(score))),
          ])
        ),
        m('tr', [
          m(
            'td',
            m(
              'button.btn btn-primary',
              {
                onclick: () => this.combineScores(),
                disabled: this.selected.length < 2,
              },
              'Combine Scores'
            )
          ),
        ]),
      ]),
      m('p', 'Scores:'),
      filterdScores.length === 0 ? m('p', 'You have no scores.') : null,
      m('table', [
        ...filterdScores.map((score) => {
          return m('tr', [
            m('td.td-name', m('a', { href: path(score) }, getName(score))),
            m('td.td-timesig', m('a', score.timeSignature)),
            m('td.td-tunetype', m('a', score.tuneType)),
            m('td.td-composer', m('a', score.composer)),
            m('td.td-bpm', m('a', score.bpm)),
            m(
              'td',
              m(
                'button.btn btn-primary',
                { onclick: () => this.rename(score), type: 'button' },
                'Rename'
              )
            ),
            m(
              'td',
              m(
                'button.btn btn-primary',
                { onclick: () => this.duplicate(score), type: 'button' },
                'Duplicate'
              )
            ),
            m(
              'td',
              m(
                'button.button.btn btn-primary',
                { onclick: () => this.delete(score), type: 'button' },
                'Delete'
              )
            ),
            m(
              'td',
              m('input', {
                type: 'checkbox',
                checked: this.selected.indexOf(score) != -1,
                onchange: (e: InputEvent) =>
                  this.updateSelection(
                    score,
                    Boolean((e.target as HTMLInputElement).checked)
                  ),
              })
            ),
          ])
        })
      ]),
    ];
  }
}
// async refreshScores() {
//   // Use query() rather than list() to avoid limits
//   const collection: Document[] = await db
//     .ref(`scores/${userId}/scores`)
//     .query()
//     .run();
//   this.scores = collection
//     .map((doc) => ({
//       name: getName(doc),
//       path: doc.__meta__.path.replace('/scores', ''),
//     }))
//     .sort(({ name: name1 }, { name: name2 }) =>
//       name1 === name2 ? 0 : name1.toLowerCase() < name2.toLowerCase() ? -1 : 1
//     );
//   this.loading = false;
//   m.redraw();
// }

// view() {
//   if (this.loading) return [m('div.loading', m('div.spinner'))];

//   const path = (score: ScoreRef) =>
//     `/pipescre${score.path.replace('/scores/', '/')}`;

//   return [
//     m('p', 'Selected Scores:'),
//     m('table', [
//       ...this.selected.map((score) =>
//         m('tr', [
//           m('td.td-name', m('a', { href: path(score) }, getName(score))),
//         ])
//       ),
//       m('tr', [
//         m(
//           'td',
//           m(
//             'button.combine',
//             {
//               onclick: () => this.combineScores(),
//               disabled: this.selected.length < 2,
//             },
//             'Combine Scores'
//           )
//         ),
//       ]),
//     ]),
//     m('p', 'Scores:'),
//     this.scores.length === 0 ? m('p', 'You have no scores.') : null,
//     m('table', [
//       ...this.scores.map((score) =>
//         m('tr', [
//           m('td.td-name', m('a', { href: path(score) }, getName(score))),
//           m(
//             'td',
//             m(
//               'button.edit',
//               { onclick: () => window.location.assign(path(score)) },
//               'Edit'
//             )
//           ),
//           m(
//             'td',
//             m(
//               'button.rename',
//               { onclick: () => this.rename(score) },
//               'Rename'
//             )
//           ),
//           m(
//             'td',
//             m(
//               'button.duplicate',
//               { onclick: () => this.duplicate(score) },
//               'Duplicate'
//             )
//           ),
//           m(
//             'td',
//             m(
//               'button.delete',
//               { onclick: () => this.delete(score) },
//               'Delete'
//             )
//           ),
//           m(
//             'td',
//             m('input', {
//               type: 'checkbox',
//               checked: this.selected.indexOf(score) != -1,
//               onchange: (e: InputEvent) =>
//                 this.updateSelection(
//                   score,
//                   Boolean((e.target as HTMLInputElement).checked)
//                 ),
//             })
//           ),
//         ])
//       ),
//     ]),
//   ];
// }
// }

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('scores');
  if (root) m.mount(root, ScoresList);
  document
    .getElementById('sign-out')
    ?.addEventListener('click', () => auth.signOut());
  document
    .getElementById('import-bww')
    ?.addEventListener('click', () => window.location.replace('/impbww'));
  document.getElementById('new-score')?.addEventListener('click', async () => {
    if (userId) {
      const collection = db.ref(`scores/${userId}/scores`);
      const newScore = await collection.add({
        name: 'Empty Score',
        justCreated: true,
      });
      if (newScore) {
        window.location.assign(`/pipescre/${userId}/${newScore.id}`);
      }
    }
  });
});
