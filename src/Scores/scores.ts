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
  type JustCreatedScore,
  type SavedData,
  type SavedScorev4,
  SavedStaticTextBox,
  isJustCreatedScore,
  isLatestScoreVersion,
  updateScoreVersion,
} from '../PipeScore/SavedModel';
import { onUserChange } from '../auth-helper';
import { readFile } from '../common/file';
import { Modal, Toast } from 'bootstrap';

let userId = '';

// This can be safely public
const apiToken = 'AIzaSyBa_TicvHYIJFphscfeBDGADo1Kwkq702w';

const auth = new Auth({ apiKey: apiToken });

const db = new Database({ projectId: 'pipe-score-andy', auth });

type ScoreQueryResult = {
  __meta__: { path: string };
  scoreName: string | undefined;
  version: string | undefined;
  scoreComposer: string | undefined;
  scoreTuneType: string | SavedStaticTextBox | undefined;
  scoreBpm: string | undefined;
  scoreTimeSignature: string | undefined;
};

const DEFAULT_SCORE_NAME = 'Empty Score';
const DEFAULT_BPM = '80 BPM';
const DEFAULT_TUNE_TYPE = 'Unknown';
const DEFAULT_TIME_SIGNATURE = 'Unknown';
const DEFAULT_COMPOSER = 'Unknown';

/**
 * Get the Firestore path to the user's scores.
 * @param userId User ID.
 * @returns the path to a collection in Firestore containing the user's scores.
 */
function scoresDbPath(userId: string): string {
  return `scores/${userId}/scores`;
}

/**
 * Get the list of user's scores.
 * @param userId User ID.
 * @returns the list of ScoreDocs corresponding to the user's scores.
 */
async function getScoreDocuments(
  userId: string,
  scoresList: ScoresList
): Promise<ScoreDoc[]> {
  // Use query() rather than list() to avoid limits.
  // Only select the name to avoid loading the entire score.
  const documents: ScoreQueryResult[] = await db
    .ref(scoresDbPath(userId))
    .query({ select: ['scoreName', 'version', 'scoreTimeSignature', 'scoreTuneType', 'scoreComposer', 'scoreBpm'] })
    .run();
  return Promise.all(documents.map((doc) => ScoreDoc.init(doc, scoresList)));
}

/**
 *
 * @param meta the Firestore document containing the user's score.
 * @returns
 */
async function getScoreContents(meta: ScoreQueryResult): Promise<SavedData> {
  const contents = await db.ref(meta.__meta__.path).get();
  return contents as unknown as SavedData;
}

class ScoreDoc {
  _meta: ScoreQueryResult;

  static async init(
    meta: ScoreQueryResult,
    scoresList: ScoresList
  ): Promise<ScoreDoc> {
    // Legacy workaround: if any document does not have a name field, set it from the first tune in the list
    if (
      meta.scoreName === undefined ||
      meta.scoreName === null ||
      meta.scoreName === ''
    ) {
      const scoreContents = await getScoreContents(meta);

      try {
        // Note that this should never be a JustCreatedScore since that should have `scoreName` set.
        if (!isJustCreatedScore(scoreContents)) {
          const updatedScore = updateScoreVersion(scoreContents);
          scoresList.showUpdatingScoresMessage();
          await db.ref(meta.__meta__.path).set(updatedScore);
          meta.scoreName = updatedScore.scoreName;
        } else {
          console.error('Failed to get name for JustCreatedScore', scoreContents);

          // The old JustCreatedScores used 'name' instead of scoreName. This is
          // very unlikely to ever need to be run.
          const maybeName = (scoreContents as unknown as { name: string }).name;
          if (maybeName !== undefined) {
            scoreContents.scoreName = maybeName;
            await db.ref(meta.__meta__.path).set(scoreContents);
            meta.scoreName = maybeName;
          }
        }
      } catch (e) {
        // This could occur if the score gets corrupted in some way.
        // (in practice, this happened when someone tried to create a score
        // using an LLM)
        console.error('Failed to get name for score');
        console.log(meta);
        const path = meta.__meta__.path.split('/');
        meta.scoreName = `Invalid score (${path[path.length - 1]})`;
      }
    }
    if (meta.version !== undefined && meta.version != 'v4') {
      const scoreContents = await getScoreContents(meta);
      if (!isJustCreatedScore(scoreContents)) {
        const updatedScore = updateScoreVersion(scoreContents);
        scoresList.showUpdatingScoresMessage();
        await db.ref(meta.__meta__.path).set(updatedScore);
        meta.scoreName = updatedScore.scoreName;
      }
    }
    return new ScoreDoc(meta);
  }

  constructor(meta: ScoreQueryResult) {
    console.assert(typeof meta.scoreName === 'string' && meta.scoreName.length > 0);
    this._meta = meta;
  }

  name(): string {
    return this._meta.scoreName || DEFAULT_SCORE_NAME;
  }
  bpm(): string {
    return this._meta.scoreBpm || DEFAULT_BPM;
  }
  timeSignature(): string {
    return this._meta.scoreTimeSignature || DEFAULT_TIME_SIGNATURE;
  }
  tuneType(): string {
    if (typeof this._meta.scoreTuneType == 'string') {
      return this._meta.scoreTuneType
    }
    if (typeof (this._meta.scoreTuneType as SavedStaticTextBox)?.text == 'string') {
      return (this._meta.scoreTuneType as SavedStaticTextBox).text
    }
    return DEFAULT_TUNE_TYPE;
  }
  composer(): string {
    return this._meta.scoreComposer || DEFAULT_COMPOSER;
  }

  async setName(name: string) {
    const scoreContents = await this.contents();
    scoreContents.scoreName = name;
    await db.ref(this._meta.__meta__.path).set(scoreContents);

    // Set the name temporarily. The list will be refreshed, but this can take
    // a second or two for large numbers of scores, so setting the name updates
    // the interface immediately.
    this._meta.scoreName = name;
  }

  scoreURL() {
    return `/pipescre${this._meta.__meta__.path.replaceAll('/scores/', '/')}`;
  }

  async duplicate() {
    const name = `${this._meta.scoreName} (copy)`;
    const scoreContents = await this.contents();
    scoreContents.scoreName = name;
    await db.ref(this._meta.__meta__.path).parentCollection.add(scoreContents);
  }

  async delete() {
    await db.ref(this._meta.__meta__.path).delete();
  }

  async contents(): Promise<SavedScorev4 | JustCreatedScore> {
    return (await getScoreContents(this._meta)) as SavedScorev4 | JustCreatedScore;
  }
}

type FileInput = HTMLInputElement & { files: FileList };

class ScoresList {
  loading = true;
  scores: ScoreDoc[] = [];
  updatingScoresMessage = false;
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

  async duplicate(score: ScoreDoc) {
    await score.duplicate();
    this.refreshScores();
  }

  async delete(score: ScoreDoc) {
    const sure = confirm(`Are you sure you want to delete ${score.name()}?`);
    if (sure) {
      await score.delete();
      this.refreshScores();
    }
  }

  async rename(score: ScoreDoc) {
    const newName = prompt('Rename:', score.name());
    if (newName) {
      await score.setName(newName);
      this.refreshScores();
    }
  }
  getPropertyList<T, K extends keyof T>(items: T[], key: K): T[K][] {
    return items.map(item => item[key]);
  }

  async refreshScores() {
    this.scores = await getScoreDocuments(userId, this);
    this.scores.sort((score1, score2) =>
      score1.name() === score2.name()
        ? 0
        : score1.name().toLowerCase() < score2.name().toLowerCase()
          ? -1
          : 1
    );


    // get unique list of Time signatures and Tune types
    const timeSignatureList: string[] = this.scores.map(a => a.timeSignature());
    this.timeSignatures = Array.from(new Set(timeSignatureList))
      .sort((one: String, two: String) => (one < two ? -1 : 1));
    const tuneTypesList: string[] = this.scores.map(a => a.tuneType());
    this.tuneTypes = Array.from(new Set(tuneTypesList))
      .sort((one: String, two: String) => (one < two ? -1 : 1));

    this.loading = false;
    m.redraw();
  }

  showUpdatingScoresMessage() {
    this.updatingScoresMessage = true;
    m.redraw();
  }

  view() {
    if (this.loading) {
      if (this.updatingScoresMessage) {
        return [
          m(
            'p',
            'Updating PipeScore scores - this will only happen once. This may take a little while, please wait!'
          ),
          m('div.loading', m('div.spinner')),
        ];
      }
      return [m('div.loading', m('div.spinner'))];
    }

    var filterdScores: ScoreDoc[] = [];

    for (var i = 0; i < this.scores.length; i++) {
      if (this.checkedTimeSignatureLabel != '' && this.checkedTimeSignatureLabel != this.scores[i].timeSignature()) continue;
      if (this.checkedTuneTypeLabel != '' && this.checkedTuneTypeLabel != this.scores[i].tuneType()) continue;
      if (this.filterByName != '' && !this.scores[i].name().toLowerCase().includes(this.filterByName.toLowerCase())) continue;
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
        //<button type="button" class= "btn btn-primary" > Primary </button>
        m('button.btn btn-primary', {
          onclick: () => {
            this.filterByName = '';
            this.checkedTimeSignatureLabel = '';
            this.checkedTuneTypeLabel = '';
          },
        }, 'Reset'),
      ]),
      m('p', 'Scores:'),
      filterdScores.length === 0 ? m('p', 'You have no scores.') : null,
      m('table', [
        ...filterdScores.map((score) =>
          m('tr', [
            m('td.td-name', m('a', { href: score.scoreURL() }, score.name())),
            m('td.td-timesig', m('a', score.timeSignature())),
            m('td.td-tunetype', m('a', score.tuneType())),
            m('td.td-composer', m('a', score.composer())),
            m('td.td-bpm', m('a', score.bpm())),
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
              m(
                'button.button.btn btn-primary',
                { onclick: () => window.location.assign(score.scoreURL()), type: 'button' },
                'Edit'
              )
            ),
          ])
        ),
      ]),
    ];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('scores');
  if (root) m.mount(root, ScoresList);
  document
    .getElementById('sign-out')
    ?.addEventListener('click', () => auth.signOut());
  document
    .getElementById('import-bww')
    ?.addEventListener('click', () => window.location.replace('/impbww'));
  document.getElementById('shared')?.addEventListener('click', () => {
    window.location.assign(`${window.location.href.replace('scores', 'shared')}/${userId}`);
  });
  document.getElementById('new-score')?.addEventListener('click', async () => {
    if (userId) {
      const collection = db.ref(`scores/${userId}/scores`);
      const justCreatedScore: JustCreatedScore = {
        scoreName: DEFAULT_SCORE_NAME,
        justCreated: true,
      };
      const newScore = await collection.add(justCreatedScore);
      if (newScore) {
        window.location.assign(`/pipescre/${userId}/${newScore.id}`);
      }
    }
  });
});