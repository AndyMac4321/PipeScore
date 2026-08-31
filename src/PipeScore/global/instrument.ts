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

import { unreachable } from './utils';

export enum Instrument {
  GHB = 0,
  Chanter = 1,
  Chanter_old = 2,
}

export function instrumentToString(instrument: Instrument): string {
  switch (instrument) {
    case Instrument.GHB:
      return 'GHB';
    case Instrument.Chanter:
      return 'chanter';
    case Instrument.Chanter_old:
      return 'chanter-old';
    default:
      unreachable(instrument);
  }
}

export function parseInstrument(instrument: string): Instrument | null {
  switch (instrument) {
    case 'chanter':
      return Instrument.Chanter;
    case 'chanter-old':
      return Instrument.Chanter_old;
    case 'GHB':
      return Instrument.GHB;
    default:
      return null;
  }
}
