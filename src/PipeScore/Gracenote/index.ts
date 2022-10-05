/*
  Define gracenote format
  Copyright (C) 2021 macarc
 */
import m from 'mithril';
import { clickGracenote } from '../Controllers/Gracenote';
import { settings } from '../global/settings';
import { noteY, Pitch, pitchUp, pitchDown } from '../global/pitch';
import { nlast, Obj } from '../global/utils';
import { noteList, gracenotes } from './gracenotes';
import { GracenoteState } from './state';
import { dispatch } from '../Controller';

export interface GracenoteProps {
  thisNote: Pitch;
  previousNote: Pitch | null;
  y: number;
  x: number;
  preview: boolean;
  state: GracenoteState;
}

export type Gracenote =
  | SingleGracenote
  | ReactiveGracenote
  | CustomGracenote
  | NoGracenote;

export default {
  toJSON: function (g: Gracenote): Obj {
    let type = 'single';
    if (this instanceof SingleGracenote) {
      type = 'single';
    } else if (this instanceof ReactiveGracenote) {
      type = 'reactive';
    } else if (this instanceof CustomGracenote) {
      type = 'custom';
    } else if (this instanceof NoGracenote) {
      type = 'none';
    } else {
      throw new Error('Unrecognised Gracenote type');
    }
    return {
      type,
      value: this.toObject(),
    };
  },
  fromJSON: function (o: Obj): Gracenote {
    switch (o.type) {
      case 'single':
        return SingleGracenote.fromObject(o.value);
      case 'reactive':
        return ReactiveGracenote.fromObject(o.value);
      case 'custom':
        return CustomGracenote.fromObject(o.value);
      case 'none':
        return NoGracenote.fromObject();
      default:
        throw new Error(`Unrecognised Gracenote type ${o.type}`);
    }
  },
  fromName: function (name: string | null) {
    if (name === null) {
      return new SingleGracenote(Pitch.HG);
    } else if (name === 'none') {
      return new NoGracenote();
    } else {
      return new ReactiveGracenote(name);
    }
  },
  equal(a: Gracenote, b: Gracenote) {
    return a.equals(b);
  },
  copy: function (g: Gracenote): Gracenote {
    return g.copy();
  },
  drag: function (g: Gracenote, pitch: Pitch, note: number): Gracenote {
    return g.drag(pitch, note);
  },
  numberOfNotes(g: Gracenote, thisNote: Pitch, previous: Pitch) {
    const notes = g.notes(thisNote, previous).length;
    if (notes === 0) return 0;
    // We need extra space before the note, so add one note
    return notes + 1;
  },
  name: function (g: Gracenote) {
    return g.name();
  },
  addSingle: function (
    g: Gracenote,
    newPitch: Pitch,
    note: Pitch,
    prev: Pitch | null
  ): Gracenote {
    // Add a single to an existing gracenote
    // Used for creating custom embellisments

    const notes = g.notes(note, prev);
    if (notes.length > 0) return new CustomGracenote(...notes, newPitch);
    else return new SingleGracenote(newPitch);
  },
  removeSingle: function (g: Gracenote, index: number) {
    const notes = g.notes();
    if (notes.length <= 1) {
      return new NoGracenote();
    } else {
      return new CustomGracenote(
        ...notes.slice(0, index),
        ...notes.slice(index + 1)
      );
    }
  },

  play: function (g: Gracenote, thisNote: Pitch, previousNote: Pitch | null) {
    const notes = g.notes(thisNote, previousNote);
    return notes.invalid
      ? []
      : notes.map((pitch) => ({ pitch, tied: false, duration: 0 }));
  },
  width: function (g: Gracenote, thisNote: Pitch, previousNote: Pitch | null) {
    const notes = g.notes(thisNote, previousNote);
    const length = notes.length;
    return gracenoteHeadGap * length + gapAfterGracenote;
  },
  render,
};

const tailXOffset = 2.6;
// actually this is half of the head width
const gracenoteHeadRadius = 3;
const gracenoteHeadHeight = 2;
const gracenoteHeadWidth = 2 * gracenoteHeadRadius;
const gracenoteHeadGap = 1.5 * gracenoteHeadWidth;
const gapAfterGracenote = 6;

// Offsets from the centre of the gracenote head to the point where the stem touches it
const stemXOf = (x: number) => x + 3;
const colourOf = (selected: boolean) => (selected ? 'orange' : 'black');

function head(
  gracenote: Gracenote,
  x: number,
  y: number,
  note: Pitch,
  beamY: number,
  isValid: boolean,
  isSelected: boolean,
  dragging: boolean,
  index: number
): m.Children {
  // Draws head and stem

  const stemY = y - 1;
  const ledgerLeft = 5;
  const ledgerRight = 5.1;
  const rotateText = 'rotate(-30 ' + x + ' ' + y + ')';
  const boxWidth = 3 * gracenoteHeadRadius;
  const boxHeight = 8;
  const colour = colourOf(isSelected);

  return m('g[class=gracenote-head]', [
    note === Pitch.HA
      ? m('line', {
          x1: x - ledgerLeft,
          x2: x + ledgerRight,
          y1: y,
          y2: y,
          stroke: colour,
        })
      : null,
    m('ellipse', {
      cx: x,
      cy: y,
      rx: gracenoteHeadRadius,
      ry: gracenoteHeadHeight,
      transform: rotateText,
      fill: isValid ? colour : 'red',
      'pointer-events': 'none',
    }),

    m('rect', {
      x: x - boxWidth / 2,
      y: y - boxHeight / 2,
      width: boxWidth,
      height: boxHeight,
      'pointer-events': dragging ? 'none' : 'default',
      style: `cursor: ${isSelected ? 'normal' : 'pointer'}`,
      opacity: 0,
      onmousedown: () => dispatch(clickGracenote(gracenote, index)),
    }),
    m('line', {
      x1: x + tailXOffset,
      x2: x + tailXOffset,
      y1: stemY,
      y2: beamY,
      stroke: colour,
    }),
  ]);
}
function renderSingle(
  gracenote: Gracenote,
  note: Pitch,
  props: GracenoteProps
) {
  const y = noteY(props.y, note);
  const wholeSelected =
    props.state.selected?.gracenote === gracenote &&
    props.state.selected?.note === 'all';
  const selected =
    props.state.selected?.gracenote === gracenote &&
    (props.state.selected?.note === 0 || wholeSelected);

  const colour = colourOf(wholeSelected || props.preview);
  const height = settings.lineHeightOf(3);

  return m('g[class=gracenote]', [
    head(
      gracenote,
      props.x,
      y,
      note,
      y - height,
      true,
      props.preview || selected,
      props.state.dragged !== null,
      0
    ),

    ...[0, 1, 2].map((n) =>
      m('line', {
        x1: stemXOf(props.x),
        x2: stemXOf(props.x) + 5,
        y1: y - height + 3 * n,
        y2: y - height + 4 + 3 * n,
        stroke: colour,
      })
    ),
  ]);
}

function render(g: Gracenote, props: GracenoteProps): m.Children {
  const wholeSelected =
    props.state.selected?.gracenote === g &&
    props.state.selected?.note === 'all';
  const pitches = g.notes(props.thisNote, props.previousNote);
  // If each note is an object, then we can use .indexOf and other related functions
  const uniqueNotes = pitches.map((note) => ({ note }));

  const xOf = (noteObj: { note: Pitch }) =>
    props.x +
    gapAfterGracenote / 2 +
    uniqueNotes.indexOf(noteObj) * gracenoteHeadGap;
  const y = (note: Pitch) => noteY(props.y, note);

  if (uniqueNotes.length === 0) {
    return m('g');
  } else if (uniqueNotes.length === 1) {
    return renderSingle(g, uniqueNotes[0].note, props);
  } else {
    const colour = colourOf(wholeSelected || props.preview);
    const beamY = props.y - settings.lineHeightOf(3.5);
    const tailStart = xOf(uniqueNotes[0]) + tailXOffset - 0.5;
    const tailEnd = xOf(nlast(uniqueNotes)) + tailXOffset + 0.5;
    const clickBoxMargin = 3;
    return m('g[class=reactive-gracenote]', [
      ...[0, 2, 4].map((i) =>
        m('line', {
          x1: tailStart,
          x2: tailEnd,
          y1: beamY + i,
          y2: beamY + i,
          stroke: colour,
        })
      ),
      m('rect', {
        x: tailStart,
        y: beamY - clickBoxMargin,
        width: tailEnd - tailStart,
        height: 4 + 2 * clickBoxMargin,
        opacity: 0,
        style: 'cursor: pointer;',
        onmousedown: () => dispatch(clickGracenote(g, 'all')),
      }),
      ...uniqueNotes.map((noteObj, i) =>
        head(
          g,
          xOf(noteObj),
          y(noteObj.note),
          noteObj.note,
          beamY,
          !pitches.invalid,
          props.preview ||
            (props.state.selected?.gracenote === g &&
              (i === props.state.selected?.note || wholeSelected)),
          props.state.dragged !== null,
          i
        )
      ),
    ]);
  }
}

export class ReactiveGracenote {
  private grace: string;

  // These are just cached so we don't have to pass them to every method
  private thisNote: Pitch = Pitch.A;
  private previousNote: Pitch | null = null;

  constructor(grace: string) {
    if (gracenotes.has(grace)) {
      this.grace = grace;
    } else {
      throw new Error(`${grace} is not a valid gracenote.`);
    }
  }
  public equals(other: Gracenote): boolean {
    return other instanceof ReactiveGracenote && this.grace === other.grace;
  }
  public copy() {
    return new ReactiveGracenote(this.grace);
  }
  public static fromObject(o: Obj) {
    return new ReactiveGracenote(o.grace);
  }
  public toObject() {
    return {
      grace: this.grace,
    };
  }
  public notes(thisNote?: Pitch, previousNote?: Pitch | null) {
    if (thisNote !== undefined) this.thisNote = thisNote;
    if (previousNote !== undefined) this.previousNote = previousNote;

    const notes = gracenotes.get(this.grace);
    if (notes) {
      return notes(this.thisNote, this.previousNote);
    } else {
      return noteList([]);
    }
  }
  public drag(pitch: Pitch, index: number) {
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
  public name() {
    return this.grace;
  }
  public render(props: GracenoteProps) {
    this.thisNote = props.thisNote;
    this.previousNote = props.previousNote;
    return render(this, props);
  }
}

export class SingleGracenote {
  private note: Pitch;

  constructor(note: Pitch) {
    this.note = note;
  }
  public name() {
    return 'single';
  }
  public equals(other: Gracenote): boolean {
    // Just check that it is also a single
    // 'Feels right' :)
    return other instanceof SingleGracenote;
  }
  public copy() {
    return new SingleGracenote(this.note);
  }
  public static fromObject(o: Obj) {
    return new SingleGracenote(o.note);
  }
  public toObject() {
    return {
      note: this.note,
    };
  }
  public moveUp() {
    this.note = pitchUp(this.note);
  }
  public moveDown() {
    this.note = pitchDown(this.note);
  }
  public drag(pitch: Pitch) {
    if (this.note != pitch) {
      return new SingleGracenote(pitch);
    }
    return this;
  }
  public toGracenote() {
    return this.note;
  }
  public notes() {
    return noteList([this.note]);
  }
}

export class CustomGracenote {
  private pitches: Pitch[] = [];

  constructor(...pitches: Pitch[]) {
    this.pitches = pitches;
  }

  public name() {
    return '';
  }

  public equals(other: Gracenote): boolean {
    return (
      other instanceof CustomGracenote &&
      other.pitches.reduce(
        (acc, p, i) => acc && this.pitches[i] === p,
        true as boolean
      )
    );
  }
  public drag(pitch: Pitch, index: number) {
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
  public copy() {
    return new CustomGracenote(...this.pitches);
  }
  public static fromObject(o: Obj) {
    return new CustomGracenote(...o.pitches);
  }
  public toObject() {
    return {
      pitches: this.pitches,
    };
  }
  public notes() {
    return noteList(this.pitches);
  }
  public addNotes(...notes: Pitch[]) {
    this.pitches = this.pitches.concat(notes);
    return this;
  }
  public addNote(note: Pitch) {
    this.pitches.push(note);
    return this;
  }
}

export class NoGracenote {
  public copy() {
    return new NoGracenote();
  }
  public drag() {
    return this;
  }
  public equals(other: Gracenote) {
    return other instanceof NoGracenote;
  }
  public static fromObject() {
    return new NoGracenote();
  }
  public toObject() {
    return {};
  }
  public notes() {
    return noteList([]);
  }
  public name() {
    return 'none';
  }
}
