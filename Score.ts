/*
  Score.ts - Score implementation for PipeScore
  Copyright (C) 2020 Archie Maclean
*/
import { svg } from 'uhtml';
<<<<<<< HEAD
import { Svg, flatten } from './all';
import { GroupNoteModel } from './Note';
=======
import { Svg, flatten, SvgRef } from './all';
import { GroupNoteModel } from './GroupNote';
>>>>>>> 630626b (Continue refactor)
import { BarModel } from './Bar';
import Stave, { StaveModel } from './Stave';
import TextBox, { TextBoxModel } from './TextBox';
import SecondTiming, { SecondTimingModel } from './SecondTiming';
import { dispatch } from './Controller';

/* MODEL */
export interface ScoreModel {
  staves: StaveModel[],
  // an array rather than a set since it makes rendering easier (with map)
  textBoxes: TextBoxModel[],
  secondTimings: SecondTimingModel[]
}
<<<<<<< HEAD
export const scoreWidth = 210 * 5;
export const scoreHeight = 297 * 5;
=======
const init: () => ScoreModel = () => {
  const firstStave = Stave.init();
  const secondStave = Stave.init();
  return ({
    staves: [firstStave,secondStave],
    textBoxes: [TextBox.init()],
    secondTimings: []
  })
};

/* CONSTANTS */
const width = 210 * 5;
const height = 297 * 5;

/* FUNCTIONS */


// todo these are probably not needed any more
const groupNotes = (score: ScoreModel): GroupNoteModel[] => flatten(score.staves.map(stave => Stave.groupNotes(stave)));
const bars = (score: ScoreModel): BarModel[] => flatten(score.staves.map(stave => Stave.bars(stave)));
const staves = (score: ScoreModel): StaveModel[] => score.staves;
>>>>>>> 630626b (Continue refactor)


export function addStaveToScore(score: ScoreModel, afterStave: StaveModel) {
  const ind = score.staves.indexOf(afterStave);
  if (ind !== -1)
    score.staves.splice(ind + 1, 0, Stave.init());
}

export function deleteStaveFromScore(score: ScoreModel, stave: StaveModel) {
  const ind = score.staves.indexOf(stave);
  if (ind !== -1)
    score.staves.splice(ind, 1);
}


/* PRERENDER */
interface ScoreProps {
  svgRef: any,
  zoomLevel: number
}
<<<<<<< HEAD

function render(score: ScoreModel, props: ScoreProps): Svg {
=======
function prerender(score: ScoreModel, props: ScoreProps): DisplayScore {
>>>>>>> 630626b (Continue refactor)
  const margin = 30;
  const staveGap = 100;
  const topOffset = 150;
  
  const staveProps = (stave: StaveModel, index: number) => ({
    x: margin,
    y: index * staveGap + topOffset,
    width: scoreWidth - 2 * margin,
    // || null so it is not 'undefined' but 'null'
    previousStave: score.staves[index - 1] || null,
  });

  const textBoxProps = (textBox: TextBoxModel, index: number) => ({
    id: index
  });

  return svg`<svg ref=${props.svgRef} width=${scoreWidth * props.zoomLevel / 100} height=${scoreHeight * props.zoomLevel / 100} viewBox=${`0 0 ${scoreWidth} ${scoreHeight}`} onmouseup=${() => dispatch({ name: 'mouse up' })}>
    <rect x="0" y="0" width="100%" onmousedown=${() => dispatch({ name: 'background clicked' })} height="100%" fill="white" />

    ${score.staves.map((stave,idx) => svg.for(stave)`
      ${Stave.render(stave, staveProps(stave,idx))}
    `)}

    ${score.textBoxes.map((textBox, idx) => svg.for(textBox)`${TextBox.render(textBox, textBoxProps(textBox, idx))}`)}


    ${score.secondTimings.map((secondTiming) => svg.for(secondTiming)`${SecondTiming.render(secondTiming)}`)}
  </svg>`;
};


<<<<<<< HEAD
const init: () => ScoreModel = () => {
  return ({
  staves: [Stave.init(),Stave.init()],
  textBoxes: [TextBox.init()],
  secondTimings: []
})
=======
/* RENDER */
export interface DisplayScore {
  staves: DisplayStave[],
  textBoxes: DisplayTextBox[],
  secondTimings: DisplaySecondTiming[],
  outerWidth: number,
  outerHeight: number,
  svgRef: SvgRef
}

function render(display: DisplayScore): Svg {
  return svg`<svg ref=${display.svgRef} width=${display.outerWidth} height=${display.outerHeight} viewBox=${`0 0 ${width} ${height}`} onmouseup=${() => dispatch({ name: 'mouse up' })}>
    <rect x="0" y="0" width="100%" onmousedown=${() => dispatch({ name: 'background clicked' })} height="100%" fill="white" />

    ${display.staves.map((stave) => svg.for(stave)`
      ${Stave.render(stave)}
    `)}
    ${display.textBoxes.map((textBox) => svg.for(textBox)`${TextBox.render(textBox)}`)}

    ${display.secondTimings.map((secondTiming) => svg.for(secondTiming)`${SecondTiming.render(secondTiming)}`)}
  </svg>`;
>>>>>>> 630626b (Continue refactor)
};

/* EXPORT */
export default {
  render,
  init,
  groupNotes,
  bars,
  staves
}
