/*
  Handles input and events for PipeScore
  Copyright (C) 2021 macarc
*/

import m from 'mithril';
import { ScoreEvent, Update } from './Events/common';
import { mouseUp, mouseDrag } from './Events/Mouse';
import { State } from './State';
import { Score } from './Score';
import {
  GracenoteSelection,
  ScoreSelection,
  TripletLineSelection,
} from './Selection';
import { emptyGracenoteState } from './Gracenote/state';
import renderUI from './UI/view';
import Documentation from './Documentation';
import { svgCoords } from './global/utils';
import { loadSamples } from './Playback';

const initialState: State = {
  canEdit: true,
  isLoggedIn: false,
  justClickedNote: false,
  justAddedNote: false,
  demo: null,
  playback: { bpm: 80 },
  ui: { menu: 'note' },
  doc: { show: true, current: null },
  clipboard: null,
  selection: null,
  score: new Score(),
  history: { past: [], future: [] },
  view: { score: null, ui: null },
};
const state: State = { ...initialState };

let save: (score: Score) => void = () => null;

export async function dispatch(event: ScoreEvent): Promise<void> {
  if (!state.canEdit) return;

  const res = await event(state);
  if (res === Update.ViewChanged || res === Update.ShouldSave) {
    if (res === Update.ShouldSave) {
      state.score.updateName();
      const asJSON = JSON.stringify(state.score.toJSON());
      if (state.history.past[state.history.past.length - 1] !== asJSON) {
        state.history.past.push(asJSON);
        save(state.score);
      }
    }
    updateView();
  }
}
let needsRedrawn = false;

const updateView = () => {
  if (!needsRedrawn) {
    needsRedrawn = true;
    requestAnimationFrame(redraw);
  }
};

function redraw() {
  // Redraws the view
  needsRedrawn = false;

  const scoreRoot = document.getElementById('score');
  const uiRoot = document.getElementById('ui');
  if (!scoreRoot || !uiRoot) return;

  const scoreProps = {
    justAddedNote: state.justAddedNote,
    noteState: {
      dragged:
        (state.selection instanceof ScoreSelection &&
          state.selection.dragging &&
          state.selection.note(state.score)) ||
        null,
      selectedTripletLine:
        (state.selection instanceof TripletLineSelection &&
          state.selection.selected) ||
        null,
      inputtingNotes: state.demo !== null,
    },
    gracenoteState:
      state.selection instanceof GracenoteSelection
        ? state.selection.state()
        : emptyGracenoteState,
    selection: state.selection,
    dispatch,
    demoNote: state.demo,
  };
  const uiProps = {
    loggedIn: state.isLoggedIn,
    zoomLevel: state.score.zoom,
    demo: state.demo,
    showingPageNumbers: state.score.showNumberOfPages,
    selectedNotes:
      state.selection instanceof ScoreSelection
        ? state.selection.notes(state.score)
        : [],
    selectedGracenote:
      // TODO should this do something for GracenoteSelection too
      (state.selection instanceof ScoreSelection &&
        state.selection.gracenote(state.score)) ||
      null,
    isLandscape: state.score.landscape,
    selectedBar:
      (state.selection instanceof ScoreSelection &&
        state.selection.bar(state.score)) ||
      null,
    docs: state.doc.show
      ? Documentation.get(state.doc.current || '') ||
        'Hover over different icons to view Help here.'
      : null,
    currentMenu: state.ui.menu,
    playbackBpm: state.playback.bpm,
  };
  if (state.view.score)
    m.render(state.view.score, state.score.render(scoreProps));
  if (state.view.ui && state.canEdit)
    m.render(state.view.ui, renderUI(uiProps));
}

function mouseMove(event: MouseEvent) {
  // The callback that occurs on mouse move
  // - registers a mouse dragged event if the mouse button is held down
  // - moves demo note (if necessary)
  const mouseButtonIsDown = event.buttons === 1;
  if (mouseButtonIsDown) {
    const pt = svgCoords(event);
    // If the left mouse button is held down
    if (pt && event.buttons === 1) dispatch(mouseDrag(pt.x, pt.y, pt.page));
  }
}

export default function startController(
  score: Score,
  saveFn: (score: Score) => void,
  isLoggedIn: boolean,
  canEdit = true
): void {
  // Initial render, hooks event listeners

  save = saveFn;
  state.isLoggedIn = isLoggedIn;
  state.canEdit = canEdit;
  state.score = score;
  loadSamples();
  state.history.past = [JSON.stringify(score.toJSON())];
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('mouseup', () => dispatch(mouseUp()));
  // initially set the notes to be the right groupings
  state.view.score = document.getElementById('score');
  state.view.ui = document.getElementById('ui');
  save(state.score);
  updateView();
}
