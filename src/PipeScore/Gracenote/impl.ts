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

//  There are two types of gracenote:
//  - ReactiveGracenote - e.g. doubling: a gracenote whose notes depend on
//      the notes in front of and behind it. See ./gracenotes for all
//      reactive gracenote types.
//  - CustomGracenote - just a list of pitches. This includes single gracenotes
//      (e.g. High G gracenote) and gracenotes made by dragging a note of
//      a reactive gracenote.
//  - (NoGracenote - used if the note has no gracenote)

import { IGracenote } from '.';
import { previousNote } from '../Measure';
import { INote } from '../Note';
import { playbackGracenote } from '../Playback';
import type { IPreview } from '../Preview';
import { ReactiveGracenotePreview, SingleGracenotePreview } from '../Preview/impl';
import type {
  SavedCustomGracenote,
  SavedGracenote,
  SavedReactiveGracenote,
} from '../SavedModel';
import { Pitch, PitchDirection, pitchDown, pitchIndex, pitchUp } from '../global/pitch';
import { gracenotes, noteList } from './gracenotes';

export abstract class Gracenote extends IGracenote {
  protected abstract toObject(): object;
  protected abstract type: string;

  toJSON(): SavedGracenote {
    return {
      type: this.type,
      value: this.toObject(),
    } as SavedGracenote;
  }

  static fromJSON(o: SavedGracenote): Gracenote {
    switch (o.type) {
      case 'reactive':
        return ReactiveGracenote.fromObject(o.value);
      case 'single':
        return new CustomGracenote(o.value.note);
      case 'custom':
        return CustomGracenote.fromObject(o.value);
      case 'none':
        return NoGracenote.fromObject();
      default:
        console.error('Unrecognised gracenote', o);
        throw new Error('Unrecognised Gracenote type');
    }
  }

  static fromName(name: string | null) {
    switch (name) {
      case null:
        return new CustomGracenote(Pitch.HG);
      case 'none':
        return new NoGracenote();
      default:
        return new ReactiveGracenote(name);
    }
  }

  asPreview(): IPreview | null {
    return null;
  }

  moveUp(index: number) {
    const pitch = this.notes()[index];
    if (pitch) return this.drag(pitchUp(pitch), index);
    return null;
  }

  moveDown(index: number) {
    const pitch = this.notes()[index];
    if (pitch) return this.drag(pitchDown(pitch), index);
    return null;
  }

  numberOfNotes() {
    const notes = this.notes().length;
    if (notes === 0) return 0;
    // We need extra space before the note, so add one note
    return notes + 1;
  }

  play(thisNote: Pitch, previousNote: Pitch | null) {
    const notes = this.notes(thisNote, previousNote);
    return notes.invalid ? [] : notes.map((pitch) => playbackGracenote(pitch));
  }

  // Add a single to an existing gracenote
  // Used for creating custom embellisments
  addSingle(newPitch: Pitch, note: Pitch, prev: Pitch | null): Gracenote {
    const notes = this.notes(note, prev);
    return new CustomGracenote(...notes, newPitch);
  }

  removeSingle(index: number) {
    const notes = this.notes();
    if (notes.length <= 1) {
      return new NoGracenote();
    }
    return new CustomGracenote(...notes.slice(0, index), ...notes.slice(index + 1));
  }

  reactiveName(): string | null {
    return null;
  }
  //                     HA    HG   F    E    D    C     B    A     G
  cantNotes: string[] = ['di', 'u', 'i', 'e', 'a', 'ie', 'o', 'in', 'un'];
  cantHGGracenote: string[] = ['hggnHA', 'hi', 'he', 'che', 'ha', 'ho', 'hio', 'hin', 'him'];
  cantEGracenote: string[] = ['egnHA', 'egnHG', 'egnF', 'egnE', 'ea', 'eo', 'eo', 'en', 'em'];
  cantDGracenote: string[] = ['dgnHA', 'dgnHG', 'dgnF', 'dgnE', 'dgnD', 'do', 'to', 'dan', 'dam'];
  cantGGracenote: string[] = ['', 'din', 'din', 'din', 'da', 'ro', 'ro', 'din', ''];
  cantEDoubling: string[] = ['edre', 'edre', 'edre', 'dre', 'dre', 'dre', 'dre', 'dre', 'dre', ''];
  cantFDoubling: string[] = ['vedare', 'vedare', 'hedale', 'dare', 'dare', 'dare', 'dare', 'dare', 'dare', ''];
  cantGDoubling: string[] = ['gdblHA', 'gdblHG', 'gdblF', 'chedari', 'gdblD', 'gdblC', 'gdblB', 'embari', 'endari', ''];
  cantGrip: string[] = ['gripHA', 'gripHG', 'gripF', 'gripE', 'adeda', 'dro', 'tro', 'ban', ''];
  cantEdre: string[] = ['edre', 'edre', 'edre', 'dre', 'dre', 'dre', 'dre', 'dre', 'dre', ''];


  canntaireachd(note: INote, previous: INote | null): string {
    var index: number = pitchIndex(note);
    var previousNoteIndex = pitchIndex(previous);
    let canntaireachd = '';
    var gracenote = note.gracenote() as ReactiveGracenote;
    switch (gracenote.type) {
      case 'reactive':
        switch (gracenote.reactiveName()) {
          case 'throw-d':
            canntaireachd = 'tra';
            break;
          case 'doubling':
            switch (note.pitch()) {
              case Pitch.G:
                canntaireachd = this.cantGDoubling[previousNoteIndex];  //
                break;
              case Pitch.F:
                canntaireachd = this.cantFDoubling[previousNoteIndex];  //
                break;
              case Pitch.E:
                canntaireachd = this.cantEDoubling[previousNoteIndex];  //
                break;
              case Pitch.C:
                canntaireachd = 'dro';  //
                break;
              case Pitch.A:
                canntaireachd = 'adeda';  //ademda
                break;
              default:
                canntaireachd = 'dro';  //
                break;
            }
            break;
          case 'half-doubling':
            canntaireachd = 'hdDbl';
            break;
          case 'g-strike':
            canntaireachd = 'gstrk';
            break;
          case 'grip':
            canntaireachd = this.cantGrip[index]
            break;
          case 'edre':
            canntaireachd = this.cantEdre[index]
            break;
          case 'shake':
            canntaireachd = 'shk';
            break;
          case 'c-shake':
            canntaireachd = 'cshk';
            break;
          case 'taorluath':
            canntaireachd = 'darid';
            break;
          case 'crunluath':
            canntaireachd = 'bamdre';
            break;
          case 'birl':
            canntaireachd = 'rin';
            break;
          case 'g-gracenote-birl':
            canntaireachd = 'rin';
            break;
          case 'bubbly':
            canntaireachd = 'bub';
            break;
          default:
            break;
        }
        break;
      case 'custom':
        switch (gracenote.notes()[0]) {
          case Pitch.HG:
            canntaireachd = this.cantHGGracenote[index];
            break;
          case Pitch.E:
            canntaireachd = this.cantEGracenote[index];
            break;
          case Pitch.D:
            canntaireachd = this.cantDGracenote[index];
            break;
          case Pitch.G:
            canntaireachd = this.cantGGracenote[index];
            break;
        }
        break;


      case 'none': {
        // No gracenotes
        canntaireachd = this.cantNotes[index];
        break;

      }
    }
    return canntaireachd;
  }
}
export class ReactiveGracenote extends Gracenote {
  private grace: string;

  // These are just cached so we don't have to pass them to every method
  private thisNote: Pitch = Pitch.A;
  private previousNote: Pitch | null = null;
  public type = 'reactive';

  constructor(grace: string) {
    super();
    if (gracenotes.has(grace)) {
      this.grace = grace;
    } else {
      throw new Error(`${grace} is not a valid gracenote.`);
    }
  }

  static fromObject(o: SavedReactiveGracenote) {
    // Note: fix typo in older versions of PipeScore
    if (o.grace === 'toarluath') o.grace = 'taorluath';

    return new ReactiveGracenote(o.grace);
  }

  toObject(): SavedReactiveGracenote {
    return {
      grace: this.grace,
    };
  }

  asPreview() {
    return new ReactiveGracenotePreview(this.reactiveName());
  }

  equals(other: Gracenote): boolean {
    return other instanceof ReactiveGracenote && this.grace === other.grace;
  }

  copy() {
    return new ReactiveGracenote(this.grace);
  }

  notes(thisNote?: Pitch, previousNote?: Pitch | null) {
    if (thisNote !== undefined) this.thisNote = thisNote;
    if (previousNote !== undefined) this.previousNote = previousNote;

    const notes = gracenotes.get(this.grace);
    if (notes) {
      return notes(this.thisNote, this.previousNote);
    }
    return noteList([]);
  }

  drag(pitch: Pitch, index: number) {
    const notes = this.notes(this.thisNote, this.previousNote);
    if (notes[index] !== pitch) {
      return new CustomGracenote(
        ...notes.slice(0, index),
        pitch,
        ...notes.slice(index + 1)
      );
    }
    return this;
  }

  reactiveName() {
    return this.grace;
  }
}

export class CustomGracenote extends Gracenote {
  private pitches: Pitch[] = [];

  protected type = 'custom';

  constructor(...pitches: Pitch[]) {
    super();
    this.pitches = pitches;
  }

  toObject(): SavedCustomGracenote {
    return {
      pitches: this.pitches,
    };
  }

  static fromObject(o: SavedCustomGracenote) {
    return new CustomGracenote(...o.pitches);
  }

  asPreview() {
    return new SingleGracenotePreview();
  }

  equals(other: Gracenote): boolean {
    return (
      other instanceof CustomGracenote &&
      other.pitches.every((p, i) => this.pitches[i] === p)
    );
  }

  drag(pitch: Pitch, index: number) {
    if (pitch !== this.pitches[index]) {
      this.pitches[index] = pitch;
      return new CustomGracenote(
        ...this.pitches.slice(0, index),
        pitch,
        ...this.pitches.slice(index + 1)
      );
    }
    return this;
  }

  copy() {
    return new CustomGracenote(...this.pitches);
  }

  notes() {
    return noteList(this.pitches);
  }
}

export class NoGracenote extends Gracenote {
  type = 'none';

  static fromObject() {
    return new NoGracenote();
  }

  toObject() {
    return {};
  }

  equals(other: Gracenote) {
    return other instanceof NoGracenote;
  }

  copy() {
    return new NoGracenote();
  }

  drag() {
    return this;
  }

  notes() {
    return noteList([]);
  }
}
