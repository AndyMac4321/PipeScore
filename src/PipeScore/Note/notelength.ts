// todo - dottedHemiDemiSemiQuaver should probably be removed since if it is used it is impossible for
// it to be finished unless used with another dottedHemiDemiSemiQuaver which is pretty unlikely
export const enum NoteLength {
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

export function dotted(note: NoteLength): boolean {
  return [
    NoteLength.DottedMinim,
    NoteLength.DottedCrotchet,
    NoteLength.DottedQuaver,
    NoteLength.DottedSemiQuaver,
    NoteLength.DottedDemiSemiQuaver,
    NoteLength.DottedHemiDemiSemiQuaver,
  ].includes(note);
}

export const sameNoteLengthName = (a: NoteLength, b: NoteLength) =>
  a === b || a === dot(b);

export function lengthInBeats(length: NoteLength): number {
  switch (length) {
    case NoteLength.Semibreve:
      return 4;
    case NoteLength.DottedMinim:
      return 3;
    case NoteLength.Minim:
      return 2;
    case NoteLength.DottedCrotchet:
      return 1.5;
    case NoteLength.Crotchet:
      return 1;
    case NoteLength.DottedQuaver:
      return 0.75;
    case NoteLength.Quaver:
      return 0.5;
    case NoteLength.DottedSemiQuaver:
      return 0.375;
    case NoteLength.SemiQuaver:
      return 0.25;
    case NoteLength.DottedDemiSemiQuaver:
      return 0.1875;
    case NoteLength.DemiSemiQuaver:
      return 0.125;
    case NoteLength.DottedHemiDemiSemiQuaver:
      return 0.9375;
    case NoteLength.HemiDemiSemiQuaver:
      return 0.0625;
  }
}

export function dot(length: NoteLength): NoteLength {
  switch (length) {
    case NoteLength.Semibreve:
      return NoteLength.Semibreve;
    case NoteLength.DottedMinim:
      return NoteLength.Minim;
    case NoteLength.Minim:
      return NoteLength.DottedMinim;
    case NoteLength.DottedCrotchet:
      return NoteLength.Crotchet;
    case NoteLength.Crotchet:
      return NoteLength.DottedCrotchet;
    case NoteLength.DottedQuaver:
      return NoteLength.Quaver;
    case NoteLength.Quaver:
      return NoteLength.DottedQuaver;
    case NoteLength.DottedSemiQuaver:
      return NoteLength.SemiQuaver;
    case NoteLength.SemiQuaver:
      return NoteLength.DottedSemiQuaver;
    case NoteLength.DottedDemiSemiQuaver:
      return NoteLength.DemiSemiQuaver;
    case NoteLength.DemiSemiQuaver:
      return NoteLength.DottedDemiSemiQuaver;
    case NoteLength.DottedHemiDemiSemiQuaver:
      return NoteLength.HemiDemiSemiQuaver;
    case NoteLength.HemiDemiSemiQuaver:
      return NoteLength.DottedHemiDemiSemiQuaver;
  }
}
