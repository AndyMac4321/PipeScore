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

//  Pitch type and methods.

import { nextNote } from '../Measure';
import { INote } from '../Note';
import { settings } from './settings';

export enum Pitch {
  HA = 'HA',
  HG = 'HG',
  F = 'F',
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  G = 'G',
}
export enum PitchDirection {
  ascending,
  descending,
  same,
  backcutting,
  ascended,
  descended,
  sameAgain,
  cut,
}
export function pitchToHeight(pitch: Pitch): number {
  // Finds the height of the pitch from the top of the stave, in lines

  switch (pitch) {
    case Pitch.HA:
      return -1;
    case Pitch.HG:
      return -0.5;
    case Pitch.F:
      return 0;
    case Pitch.E:
      return 0.5;
    case Pitch.D:
      return 1;
    case Pitch.C:
      return 1.5;
    case Pitch.B:
      return 2;
    case Pitch.A:
      return 2.5;
    case Pitch.G:
      return 3;
  }
}

export function pitchCanntaireachd(note: INote, previous: INote | null): string {
  var index = pitchIndex(note);
  return note.gracenote().canntaireachd(note, previous);
}

export function pitchIndex(note: INote | null): number {
  var index = 10;
  if (note == null) return index;
  switch (note.pitch()) {
    case Pitch.HA:
      index = 0;
      break;
    case Pitch.HG:
      index = 1;
      break;
    case Pitch.F:
      index = 2;
      break;
    case Pitch.E:
      index = 3;
      break;
    case Pitch.D:
      index = 4;
      break;
    case Pitch.C:
      index = 5;
      break;
    case Pitch.B:
      index = 6;
      break;
    case Pitch.A:
      index = 7;
      break;
    case Pitch.G:
      index = 8;
      break;
  }
  return index;
}

export function pitchDirection(note: INote, previousNote: INote): PitchDirection {
  let noteIndex = pitchIndex(note);
  let previousNoteIndex = pitchIndex(previousNote)
  if (noteIndex == previousNoteIndex) {
    if (previousNote.gracenote().numberOfNotes() == 0) {
      return PitchDirection.backcutting;
    }
    return PitchDirection.same;
  }
  if (previousNoteIndex > noteIndex) {
    if (previousNote.gracenote().numberOfNotes() == 0) {
      return PitchDirection.backcutting;
    }
    return PitchDirection.descending;

  }
  else {
    return PitchDirection.ascending;
  }
};
export function pitchUp(pitch: Pitch): Pitch {
  switch (pitch) {
    case Pitch.G:
      return Pitch.A;
    case Pitch.A:
      return Pitch.B;
    case Pitch.B:
      return Pitch.C;
    case Pitch.C:
      return Pitch.D;
    case Pitch.D:
      return Pitch.E;
    case Pitch.E:
      return Pitch.F;
    case Pitch.F:
      return Pitch.HG;
    case Pitch.HG:
      return Pitch.HA;
    case Pitch.HA:
      return Pitch.HA;
  }
}

export function pitchDown(pitch: Pitch): Pitch {
  switch (pitch) {
    case Pitch.G:
      return Pitch.G;
    case Pitch.A:
      return Pitch.G;
    case Pitch.B:
      return Pitch.A;
    case Pitch.C:
      return Pitch.B;
    case Pitch.D:
      return Pitch.C;
    case Pitch.E:
      return Pitch.D;
    case Pitch.F:
      return Pitch.E;
    case Pitch.HG:
      return Pitch.F;
    case Pitch.HA:
      return Pitch.HG;
  }
}

// Good Boys Deserve Football Always
export function isPitchOnLine(pitch: Pitch) {
  return (
    pitch === Pitch.G ||
    pitch === Pitch.B ||
    pitch === Pitch.D ||
    pitch === Pitch.F ||
    pitch === Pitch.HA
  );
}

// Calculate the difference from the top of the stave
// to the note
export const pitchOffset = (note: Pitch): number =>
  settings.lineHeightOf(pitchToHeight(note));

// Calculates the y value of given note
export const pitchY = (staveY: number, note: Pitch): number =>
  staveY + pitchOffset(note);
