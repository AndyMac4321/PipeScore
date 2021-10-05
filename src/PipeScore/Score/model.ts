/*
  Score format
  Copyright (C) 2021 Archie Maclean
*/
import { Stave } from '../Stave/model';
import { TextBoxModel } from '../TextBox/model';
import { DraggedSecondTiming, SecondTiming } from '../SecondTiming/model';
import { TimeSignatureModel } from '../TimeSignature/model';
import TextBox from '../TextBox/functions';
import TimeSignature from '../TimeSignature/functions';
import { lineGap, staveGap } from '../global/constants';
import { svg, V } from '../../render/h';
import { clickBackground, mouseUp } from '../Controllers/Mouse';
import { DemoNoteModel } from '../DemoNote/model';
import { NoteState } from '../Note/state';
import { Dispatch } from '../Controllers/Controller';
import { SelectionModel } from '../Selection/model';
import { GracenoteState } from '../Gracenote/state';
import { last } from '../global/utils';

import renderTextBox from '../TextBox/view';
import renderScoreSelection from '../Selection/view';
import renderDemoNote from '../DemoNote/view';
import { Triplet } from '../Note/model';
import { ID, Item } from '../global/id';
import { Bar } from '../Bar/model';

interface ScoreProps {
  selection: SelectionModel | null;
  dispatch: Dispatch;
  noteState: NoteState;
  demoNote: DemoNoteModel | null;
  gracenoteState: GracenoteState;
}
export class Score {
  private name: string;
  private landscape: boolean;
  private _staves: Stave[];
  // an array rather than a set since it makes rendering easier (with map)
  private textBoxes: TextBoxModel[];
  private secondTimings: SecondTiming[];

  private margin = 30;
  private topOffset = 200;

  public zoom: number;

  constructor(
    name = 'My Tune',
    numberOfStaves = 2,
    timeSignature: TimeSignatureModel | undefined = undefined
  ) {
    this.name = name;
    this.landscape = false;
    this._staves = [...Array(numberOfStaves).keys()].map(
      () => new Stave(timeSignature)
    );
    this.textBoxes = [TextBox.init(name, true)];
    this.secondTimings = [];
    this.zoom =
      (100 * 0.9 * (Math.max(window.innerWidth, 800) - 300)) / this.width();
  }
  private width() {
    return this.landscape ? 297 * 5 : 210 * 5;
  }
  private height() {
    return this.landscape ? 210 * 5 : 297 * 5;
  }
  public orientation() {
    return this.landscape ? 'landscape' : 'portrait';
  }
  public toggleLandscape() {
    this.landscape = !this.landscape;

    for (const text of this.textBoxes) {
      if (!text.centred) {
        text.x = (text.x / this.width()) * this.height();
        text.y = (text.y / this.height()) * this.width();
      }
    }
    this.zoom = (this.zoom * this.height()) / this.width();
  }
  public updateName() {
    this.textBoxes[0] && (this.name = this.textBoxes[0].text);
  }
  public addText(text: TextBoxModel) {
    this.textBoxes.push(text);
  }
  public addSecondTiming(secondTiming: SecondTiming) {
    if (secondTiming.isValid(this.secondTimings)) {
      this.secondTimings.push(secondTiming);
      return true;
    }
    return false;
  }
  public addStave(afterStave: Stave | null, before: boolean) {
    // Appends a stave after afterStave
    if (afterStave) {
      const adjacentBar = before ? afterStave.firstBar() : afterStave.lastBar();
      const ts = adjacentBar && adjacentBar.timeSignature();
      const ind = this._staves.indexOf(afterStave);
      const newStave = new Stave(ts || TimeSignature.init());
      if (ind !== -1) this._staves.splice(before ? ind : ind + 1, 0, newStave);
    } else {
      this._staves.push(new Stave(TimeSignature.init()));
    }
  }

  public nextNote(id: ID) {
    return Bar.nextNote(id, this.bars());
  }
  public previousNote(id: ID) {
    return Bar.previousNote(id, this.bars());
  }
  public deleteStave(stave: Stave) {
    // Deletes the stave from the score
    // Does not worry about purging notes/bars; that should be handled elsewhere

    const ind = this._staves.indexOf(stave);
    if (ind !== -1) this._staves.splice(ind, 1);
  }
  public notesAndTriplets() {
    return this.bars().flatMap((bar) => bar.notesAndTriplets());
  }
  public notes() {
    return Triplet.flatten(this.notesAndTriplets());
  }
  public bars() {
    return this._staves.flatMap((stave) => stave.allBars());
  }
  public staves() {
    return this._staves;
  }
  public lastStave() {
    return last(this._staves);
  }

  public coordinateToStaveIndex(y: number): number | null {
    // Converts the y coordinate to the index of stave that the y coordinate lies in
    // If it is below 0, it returns 0; if it doesn't lie on any stave it returns null

    const offset = y + 4 * lineGap - this.topOffset;
    if (offset > 0 && offset % staveGap <= 12 * lineGap) {
      return Math.max(Math.floor(offset / staveGap), 0);
    } else {
      return null;
    }
  }
  public deleteSecondTiming(secondTiming: SecondTiming) {
    this.secondTimings.splice(this.secondTimings.indexOf(secondTiming), 1);
  }
  public deleteTextBox(text: TextBoxModel) {
    this.textBoxes.splice(this.textBoxes.indexOf(text), 1);
  }
  public dragTextBox(text: TextBoxModel, x: number, y: number) {
    if (x < this.width() && x > 0 && y < this.height() && y > 0) {
      TextBox.setCoords(text, x, y);
    }
  }
  public dragSecondTiming(
    secondTiming: DraggedSecondTiming,
    x: number,
    y: number
  ) {
    secondTiming.secondTiming.drag(
      secondTiming.dragged,
      x,
      y,
      this.secondTimings
    );
  }

  public purgeSecondTimings(items: Item[]) {
    const secondTimingsToDelete: SecondTiming[] = [];
    for (const item of items) {
      for (const st of this.secondTimings) {
        if (st.pointsTo(item.id)) secondTimingsToDelete.push(st);
      }
    }
    secondTimingsToDelete.forEach((t) => this.deleteSecondTiming(t));
  }
  public play() {
    return this._staves.flatMap((st, i) =>
      st.play(i === 0 ? null : this._staves[i - 1])
    );
  }
  public render(props: ScoreProps): V {
    const width = this.width();
    const height = this.height();
    const staveProps = (stave: Stave, index: number) => ({
      x: this.margin,
      y: index * staveGap + this.topOffset,
      width: width - 2 * this.margin,
      previousStave: this._staves[index - 1] || null,
      previousStaveY: (index - 1) * staveGap + this.topOffset,
      dispatch: props.dispatch,
      noteState: props.noteState,
      gracenoteState: props.gracenoteState,
    });

    const demoNoteProps = props.demoNote && {
      staveY: this.topOffset + staveGap * props.demoNote.staveIndex,
    };

    const secondTimingProps = {
      staveStartX: this.margin,
      staveEndX: width - this.margin,
      selection: props.selection,
      staveGap,
      dispatch: props.dispatch,
    };
    const scoreSelectionProps = {
      staveStartX: this.margin,
      staveEndX: width - this.margin,
      staveGap,
    };

    return svg(
      'svg',
      {
        id: 'score-svg',
        width: (width * this.zoom) / 100,
        height: (height * this.zoom) / 100,
        viewBox: `0 0 ${width} ${height}`,
      },
      { mouseup: () => props.dispatch(mouseUp()) },
      [
        svg(
          'rect',
          { x: '0', y: '0', width: '100%', height: '100%', fill: 'white' },
          { mousedown: () => props.dispatch(clickBackground()) }
        ),
        ...this._staves.map((stave, idx) =>
          stave.render(staveProps(stave, idx))
        ),
        ...this.textBoxes.map((textBox) =>
          renderTextBox(textBox, {
            dispatch: props.dispatch,
            scoreWidth: width,
            selection: props.selection,
          })
        ),
        ...this.secondTimings.map((secondTiming) =>
          secondTiming.render(secondTimingProps)
        ),
        props.selection &&
          renderScoreSelection(props.selection, scoreSelectionProps),
        props.demoNote &&
          demoNoteProps &&
          renderDemoNote(props.demoNote, demoNoteProps),
      ]
    );
  }
}
