'use client';

import { Panel, Group, Separator } from 'react-resizable-panels';
import { ReactNode } from 'react';

const LEFT_PANEL_ID = 'left';
const RIGHT_PANEL_ID = 'right';

interface SplitPaneLayoutProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
  defaultPosition: number;
  onPositionChange: (position: number) => void;
}

export function SplitPaneLayout({
  leftPane,
  rightPane,
  defaultPosition,
  onPositionChange,
}: SplitPaneLayoutProps) {
  return (
    <Group
      orientation="horizontal"
      defaultLayout={{ [LEFT_PANEL_ID]: defaultPosition, [RIGHT_PANEL_ID]: 100 - defaultPosition }}
      onLayoutChanged={(layout) => {
        const leftSize = layout[LEFT_PANEL_ID];
        if (leftSize !== undefined) {
          onPositionChange(Math.round(leftSize));
        }
      }}
    >
      <Panel id={LEFT_PANEL_ID} minSize={20} maxSize={80}>
        <div className="h-full overflow-hidden">{leftPane}</div>
      </Panel>
      <Separator className="w-2 bg-stone-200 transition-colors hover:bg-stone-300 active:bg-stone-400" />
      <Panel id={RIGHT_PANEL_ID} minSize={20} maxSize={80}>
        <div className="h-full overflow-hidden">{rightPane}</div>
      </Panel>
    </Group>
  );
}
