import { addStave, deleteStave } from '../../Events/Stave';
import { Update } from '../../Events/types';
import { ScoreSelection } from '../../Selection/score';
import { Relative } from '../../global/relativeLocation';
import { emptyState } from './common';

describe('addStave', () => {
  it('adds a stave before at the start if nothing is selected', async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    expect(state.score.staves()).toHaveLength(4);
    expect(await addStave(Relative.before)(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(5);
    expect(state.score.staves()[1]).toBe(stave0);
    expect(state.score.staves()[2]).toBe(stave1);
    expect(state.score.staves()[3]).toBe(stave2);
    expect(state.score.staves()[4]).toBe(stave3);
  });
  it('adds a stave after at the end if nothing is selected', async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    expect(state.score.staves()).toHaveLength(4);
    expect(await addStave(Relative.after)(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(5);
    expect(state.score.staves()[0]).toBe(stave0);
    expect(state.score.staves()[1]).toBe(stave1);
    expect(state.score.staves()[2]).toBe(stave2);
    expect(state.score.staves()[3]).toBe(stave3);
  });
  it('can add a stave before, in the middle', async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    const selectionStart = stave2.measures()[1].id;
    const selectionEnd = stave2.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(4);
    expect(await addStave(Relative.before)(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(5);
    expect(state.score.staves()[0]).toBe(stave0);
    expect(state.score.staves()[1]).toBe(stave1);
    expect(state.score.staves()[3]).toBe(stave2);
    expect(state.score.staves()[4]).toBe(stave3);
  });
  it('can add a stave after, in the middle', async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    const selectionStart = stave2.measures()[1].id;
    const selectionEnd = stave2.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(4);
    expect(await addStave(Relative.after)(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(5);
    expect(state.score.staves()[0]).toBe(stave0);
    expect(state.score.staves()[1]).toBe(stave1);
    expect(state.score.staves()[2]).toBe(stave2);
    expect(state.score.staves()[4]).toBe(stave3);
  });
  it('can add a stave before at the start', async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    const selectionStart = stave0.measures()[1].id;
    const selectionEnd = stave0.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(4);
    expect(await addStave(Relative.before)(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(5);
    expect(state.score.staves()[1]).toBe(stave0);
    expect(state.score.staves()[2]).toBe(stave1);
    expect(state.score.staves()[3]).toBe(stave2);
    expect(state.score.staves()[4]).toBe(stave3);
  });
  it('can add a stave after at the end', async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    const selectionStart = stave3.measures()[1].id;
    const selectionEnd = stave3.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(4);
    expect(await addStave(Relative.after)(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(5);
    expect(state.score.staves()[0]).toBe(stave0);
    expect(state.score.staves()[1]).toBe(stave1);
    expect(state.score.staves()[2]).toBe(stave2);
    expect(state.score.staves()[3]).toBe(stave3);
  });
});

describe('deleteStave', () => {
  it("doesn't delete anything if nothing is selected", async () => {
    const state = emptyState();
    expect(state.score.staves()).toHaveLength(4);
    expect(await deleteStave()(state)).toBe(Update.NoChange);
    expect(state.score.staves()).toHaveLength(4);
  });
  it("deletes the first stave if it's selected", async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    const selectionStart = stave0.measures()[1].id;
    const selectionEnd = stave0.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(4);
    expect(await deleteStave()(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(3);
    expect(state.score.staves()[0]).toBe(stave1);
    expect(state.score.staves()[1]).toBe(stave2);
    expect(state.score.staves()[2]).toBe(stave3);
  });
  it("deletes the last stave if it's selected", async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    const selectionStart = stave3.measures()[1].id;
    const selectionEnd = stave3.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(4);
    expect(await deleteStave()(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(3);
    expect(state.score.staves()[0]).toBe(stave0);
    expect(state.score.staves()[1]).toBe(stave1);
    expect(state.score.staves()[2]).toBe(stave2);
  });
  it("deletes a stave in the middle if it's selected", async () => {
    const state = emptyState();
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave2 = state.score.staves()[2];
    const stave3 = state.score.staves()[3];
    const selectionStart = stave2.measures()[1].id;
    const selectionEnd = stave2.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(4);
    expect(await deleteStave()(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(3);
    expect(state.score.staves()[0]).toBe(stave0);
    expect(state.score.staves()[1]).toBe(stave1);
    expect(state.score.staves()[2]).toBe(stave3);
  });
  it('deletes multiple selected staves', async () => {
    const state = emptyState();
    state.score.tunes()[0].addStave(null, Relative.after);
    const stave0 = state.score.staves()[0];
    const stave1 = state.score.staves()[1];
    const stave3 = state.score.staves()[3];
    const stave4 = state.score.staves()[4];
    const selectionStart = stave1.measures()[1].id;
    const selectionEnd = stave3.measures()[2].id;
    state.selection = new ScoreSelection(selectionStart, selectionEnd, false);
    expect(state.score.staves()).toHaveLength(5);
    expect(await deleteStave()(state)).toBe(Update.ShouldSave);
    expect(state.score.staves()).toHaveLength(2);
    expect(state.score.staves()[0]).toBe(stave0);
    expect(state.score.staves()[1]).toBe(stave4);
  });
});
