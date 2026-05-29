"use client";

import { useCallback, useRef, useState } from "react";
import type { KeyboardEvent, RefCallback } from "react";

type GridColumns = number | "auto";

interface UseRovingFocusOptions {
  itemCount: number;
  selectedIndex?: number;
  columns?: GridColumns;
  loop?: boolean;
}

interface RovingFocusItemProps<T extends HTMLElement> {
  ref: RefCallback<T>;
  tabIndex: number;
  onFocus: () => void;
}

const MOVEMENT_KEYS = [
  "ArrowRight",
  "ArrowDown",
  "ArrowLeft",
  "ArrowUp",
  "Home",
  "End",
];

export function useRovingFocus<T extends HTMLElement>({
  itemCount,
  selectedIndex,
  columns = 1,
  loop = true,
}: UseRovingFocusOptions) {
  const itemRefs = useRef<Array<T | null>>([]);
  const [rawActiveIndex, setActiveIndex] = useState(() =>
    selectedIndex !== undefined && selectedIndex >= 0
      ? selectedIndex
      : itemCount > 0
        ? 0
        : -1,
  );

  // Sync to a controlled selectedIndex by adjusting state during render
  // (React's sanctioned "store previous prop in state" pattern) rather than
  // in an effect, which avoids cascading renders.
  const [prevSelected, setPrevSelected] = useState(selectedIndex);
  if (
    selectedIndex !== undefined &&
    selectedIndex >= 0 &&
    selectedIndex !== prevSelected
  ) {
    setPrevSelected(selectedIndex);
    setActiveIndex(Math.min(selectedIndex, Math.max(itemCount - 1, 0)));
  }

  // Clamp the stored index to the current item range at read time so a
  // shrinking list never points past the end.
  const activeIndex =
    itemCount === 0
      ? -1
      : Math.min(Math.max(rawActiveIndex, 0), itemCount - 1);

  const register = useCallback(
    (index: number): RefCallback<T> =>
      (node) => {
        itemRefs.current[index] = node;
      },
    [],
  );

  const focusIndex = useCallback(
    (index: number) => {
      if (itemCount === 0) return;
      const next = normalizeIndex(index, itemCount, loop);
      if (next < 0) return;
      setActiveIndex(next);
      window.requestAnimationFrame(() => itemRefs.current[next]?.focus());
    },
    [itemCount, loop],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!MOVEMENT_KEYS.includes(event.key) || itemCount === 0) return;

      const currentByDom = itemRefs.current.findIndex(
        (node) => node === document.activeElement,
      );
      const current =
        currentByDom >= 0
          ? currentByDom
          : activeIndex >= 0
            ? activeIndex
            : 0;
      const columnCount =
        columns === "auto" ? inferColumnCount(itemRefs.current) : columns;
      const next = getNextIndex({
        key: event.key,
        current,
        itemCount,
        columns: Math.max(1, columnCount),
        loop,
      });

      if (next === current || next < 0) return;
      event.preventDefault();
      focusIndex(next);
    },
    [activeIndex, columns, focusIndex, itemCount, loop],
  );

  const getItemProps = useCallback(
    (index: number): RovingFocusItemProps<T> => ({
      ref: register(index),
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
    }),
    [activeIndex, register],
  );

  return { activeIndex, focusIndex, getItemProps, handleKeyDown };
}

function getNextIndex({
  key,
  current,
  itemCount,
  columns,
  loop,
}: {
  key: string;
  current: number;
  itemCount: number;
  columns: number;
  loop: boolean;
}) {
  if (key === "Home") return 0;
  if (key === "End") return itemCount - 1;

  if (columns <= 1) {
    if (key === "ArrowRight" || key === "ArrowDown") {
      return normalizeIndex(current + 1, itemCount, loop);
    }
    if (key === "ArrowLeft" || key === "ArrowUp") {
      return normalizeIndex(current - 1, itemCount, loop);
    }
  }

  if (key === "ArrowRight") return normalizeIndex(current + 1, itemCount, loop);
  if (key === "ArrowLeft") return normalizeIndex(current - 1, itemCount, loop);
  if (key === "ArrowDown") return getVerticalIndex(current, columns, itemCount, 1, loop);
  if (key === "ArrowUp") return getVerticalIndex(current, columns, itemCount, -1, loop);
  return current;
}

function getVerticalIndex(
  current: number,
  columns: number,
  itemCount: number,
  direction: 1 | -1,
  loop: boolean,
) {
  const next = current + columns * direction;
  if (next >= 0 && next < itemCount) return next;
  if (!loop) return current;

  const column = current % columns;
  if (direction === 1) {
    return column < itemCount ? column : itemCount - 1;
  }

  let target = column;
  while (target + columns < itemCount) {
    target += columns;
  }
  return target;
}

function normalizeIndex(index: number, itemCount: number, loop: boolean) {
  if (itemCount === 0) return -1;
  if (index >= 0 && index < itemCount) return index;
  if (!loop) return Math.min(Math.max(index, 0), itemCount - 1);
  return (index + itemCount) % itemCount;
}

function inferColumnCount<T extends HTMLElement>(items: Array<T | null>) {
  const visible = items.filter((item): item is T => item !== null);
  if (visible.length <= 1) return 1;

  const firstTop = visible[0].offsetTop;
  const sameRow = visible.filter((item) => Math.abs(item.offsetTop - firstTop) < 2);
  return Math.max(1, sameRow.length);
}
