/*
   DemoNote/view.ts - a note that previews note placement (i.e. shows what pitch the mouse is hovering over currently)
   Copyright (C) 2020 Archie Maclean
 */
import { svg, V } from '../render/h';
import { Pitch, noteY } from '../global/pitch';
import { DemoNoteModel } from './model';

export interface DemoNoteProps {
  staveY: number
}

export default function render(demoNote: DemoNoteModel, props: DemoNoteProps): V {
  if (demoNote.pitch) {
    const y = noteY(props.staveY, demoNote.pitch);
    const ledgerWidth = demoNote.type === 'note' ? 10 : 7;
    const rx = demoNote.type === 'note' ? 5 : 4.5;
    const ry = demoNote.type === 'note' ? 4 : 3.5;

    return svg('g', { class: 'demo-note' }, [
      svg('ellipse', { cx: demoNote.x, cy: y, rx, ry, fill: 'orange', 'pointer-events': 'none', opacity: 0.85 }),
      demoNote.pitch === Pitch.HA ? svg('line', { x1: demoNote.x - ledgerWidth, x2: demoNote.x + ledgerWidth, y1: y, y2: y, stroke: 'orange', 'pointer-events': 'none', opacity: 0.6 }) : svg('g')
    ]);
  } else {
    return svg('g');
  }
}
