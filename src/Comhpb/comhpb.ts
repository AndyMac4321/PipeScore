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
import { TimeSignature } from '../PipeScore/TimeSignature/impl';

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
function getPropertyList<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(item => item[key]);
}

// Example: Get list of names
class ScoresList {
  loading = true;
  scores: ScoreRef[] = [];
  selected: ScoreRef[] = [];
  timeSignatures: string[] = [];
  tuneTypes: string[] = [];
  checkedTuneTypeLabel = '';
  checkedTimeSignatureLabel = '';
  oninit() {
    userId = 'JRcCHSNJSogzDWUeKcbYuPV1Mxm2';
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
    var index = 0;
    return [
      m('p', 'Time Signatures:'),
      m('div.btn-group', [
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
      m('p', 'Tune Types:'),
      m('div.btn-group', [
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
      m('p', 'Scores:'),
      this.scores.length === 0 ? m('p', 'You have no scores.') : null,
      m('table', [
        ...this.scores.map((score) => {
          if(this.checkedTimeSignatureLabel!='' && this.checkedTimeSignatureLabel!=score.timeSignature ) return null;
          if(this.checkedTuneTypeLabel!='' && this.checkedTuneTypeLabel!=score.tuneType ) return null;
          return (m('tr', [
            m('td.td-name', m('a', { href: path(score) }, getName(score))),
            m('td.td-timesig', m('a', score.timeSignature)),
            m('td.td-tunetype', m('a', score.tuneType)),
            m('td.td-composer', m('a', score.composer)),
            m('td.td-bpm', m('a', score.bpm)),]))
        }),
      ]),
    ];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('scores');
  if (root) m.mount(root, ScoresList);
});
