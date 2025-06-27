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

import { INote } from ".";
import { settings, Settings } from "../global/settings";

export enum Duration {
  Semibreve = 'sb',
  DottedMinim = 'dm',
  Minim = 'm',
  DottedCrotchet = 'dc',
  Crotchet = 'c',
  DottedQuaver = 'dq',
  Quaver = 'q',
  DottedSemiQuaver = 'dsq',
  SemiQuaver = 'sq',
  DottedDemiSemiQuaver = 'dssq',
  DemiSemiQuaver = 'ssq',
  DottedHemiDemiSemiQuaver = 'dhdsq',
  HemiDemiSemiQuaver = 'hdsq',
}

export class NoteLength {
  _duration: Duration;

  constructor(length: Duration) {
    this._duration = length;
  }

  toJSON(): Duration {
    return this._duration;
  }

  fromJSON(length: Duration) {
    return new NoteLength(length);
  }

  duration() {
    return this._duration;
  }

  sameNoteLengthName(other: Duration) {
    return this._duration === other || this.dotted()._duration === other;
  }

  dotted(): NoteLength {
    switch (this._duration) {
      case Duration.Semibreve:
        return new NoteLength(Duration.Semibreve);
      case Duration.DottedMinim:
        return new NoteLength(Duration.Minim);
      case Duration.Minim:
        return new NoteLength(Duration.DottedMinim);
      case Duration.DottedCrotchet:
        return new NoteLength(Duration.Crotchet);
      case Duration.Crotchet:
        return new NoteLength(Duration.DottedCrotchet);
      case Duration.DottedQuaver:
        return new NoteLength(Duration.Quaver);
      case Duration.Quaver:
        return new NoteLength(Duration.DottedQuaver);
      case Duration.DottedSemiQuaver:
        return new NoteLength(Duration.SemiQuaver);
      case Duration.SemiQuaver:
        return new NoteLength(Duration.DottedSemiQuaver);
      case Duration.DottedDemiSemiQuaver:
        return new NoteLength(Duration.DemiSemiQuaver);
      case Duration.DemiSemiQuaver:
        return new NoteLength(Duration.DottedDemiSemiQuaver);
      case Duration.DottedHemiDemiSemiQuaver:
        return new NoteLength(Duration.HemiDemiSemiQuaver);
      case Duration.HemiDemiSemiQuaver:
        return new NoteLength(Duration.DottedHemiDemiSemiQuaver);
    }
  }

  inBeats(noteBefore :INote|null,noteAfter :INote|null ) {
    switch (this._duration) {
      case Duration.Semibreve:
        return 4;
      case Duration.DottedMinim:
        return 3;
      case Duration.Minim:
        return 2;
      case Duration.DottedCrotchet:
        return 1.5;
      case Duration.Crotchet:
        return 1;
      case Duration.DottedQuaver:
        var dotDuration :number =0;
        if(noteAfter?.length()._duration=='sq')
          dotDuration = .25 * (settings.dotCutTimingAdjustment/100);
        if(noteBefore?.length()._duration=='sq')
          dotDuration = .25 * (settings.dotCutTimingAdjustment/100);
        return 0.75 + dotDuration;
      case Duration.Quaver:
        return 0.5;
      case Duration.DottedSemiQuaver:
        var semiDotDuration :number =0;
        if(noteAfter?.length()._duration=='ssq')
          semiDotDuration = .125 * (settings.dotCutTimingAdjustment/100);
        if(noteBefore?.length()._duration=='ssq')
          semiDotDuration = .125 * (settings.dotCutTimingAdjustment/100);
        return 0.375 + semiDotDuration;
      case Duration.SemiQuaver:
        var cutDuration :number =0;
        if(noteAfter?.length()._duration=='dq')
          cutDuration = .25 * (settings.dotCutTimingAdjustment/100);
        if(noteBefore?.length()._duration=='dq')
          cutDuration = .25 * (settings.dotCutTimingAdjustment/100);
        return 0.25 - cutDuration;
      case Duration.DottedDemiSemiQuaver:
        return 0.1875;
      case Duration.DemiSemiQuaver:
        var demiSemiCutDuration :number =0;
        if(noteAfter?.length()._duration=='dsq')
          demiSemiCutDuration = .125 * (settings.dotCutTimingAdjustment/100);
        if(noteBefore?.length()._duration=='dsq')
          demiSemiCutDuration = .125 * (settings.dotCutTimingAdjustment/100);
        return 0.125 - demiSemiCutDuration;
      case Duration.DottedHemiDemiSemiQuaver:
        return 0.9375;
      case Duration.HemiDemiSemiQuaver:
        return 0.0625;
    }
  }

  numTails() {
    switch (this._duration) {
      case Duration.Semibreve:
      case Duration.DottedMinim:
      case Duration.Minim:
      case Duration.DottedCrotchet:
      case Duration.Crotchet:
        return 0;
      case Duration.DottedQuaver:
      case Duration.Quaver:
        return 1;
      case Duration.DottedSemiQuaver:
      case Duration.SemiQuaver:
        return 2;
      case Duration.DottedDemiSemiQuaver:
      case Duration.DemiSemiQuaver:
        return 3;
      case Duration.DottedHemiDemiSemiQuaver:
      case Duration.HemiDemiSemiQuaver:
        return 4;
    }
  }

  hasBeam() {
    return this.inBeats(null,null) < 1;
  }

  isFilled() {
    return this.inBeats(null,null) < 2;
  }

  hasStem() {
    return this._duration !== Duration.Semibreve;
  }

  hasDot(): boolean {
    return [
      Duration.DottedMinim,
      Duration.DottedCrotchet,
      Duration.DottedQuaver,
      Duration.DottedSemiQuaver,
      Duration.DottedDemiSemiQuaver,
      Duration.DottedHemiDemiSemiQuaver,
    ].includes(this._duration);
  }
}
