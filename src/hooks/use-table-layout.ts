"use client";

import { useEffect, type RefObject } from "react";

/** Measure actual columns so custom cells, column visibility and resizing stay aligned. */
export function useTableLayout(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = root.current;
    const table = container?.querySelector("table");
    if (!container || !table) return;
    let frame = 0;
    const measure = () => {
      const heads = Array.from(table.tHead?.rows[0]?.cells ?? []);
      const actions = new Set<number>();
      const pinned: number[] = [];
      heads.forEach((head, index) => {
        const label = head.textContent?.trim() ?? "";
        if (/^(actions?|options?|manage)$/i.test(label)) actions.add(index);
        else if (
          !head.hidden &&
          head.getClientRects().length > 0 &&
          label &&
          !head.querySelector('[role="checkbox"],input[type="checkbox"]') &&
          pinned.length < 2
        )
          pinned.push(index);
        else if (
          !label &&
          !head.querySelector('[role="checkbox"],input[type="checkbox"]') &&
          table.tBodies[0]?.rows[0]?.cells[index]?.querySelector(
            'button[aria-haspopup], [data-size^="icon"]',
          )
        )
          actions.add(index);
      });
      const offsets = pinned.map((_, i) =>
        pinned
          .slice(0, i)
          .reduce((sum, index) => sum + heads[index].getBoundingClientRect().width, 0),
      );
      Array.from(table.rows).forEach((row) => {
        let index = 0;
        Array.from(row.cells).forEach((cell) => {
          const pin = pinned.indexOf(index);
          if (pin >= 0 && cell.colSpan === 1 && !cell.hidden) {
            cell.dataset.pinnedColumn = String(pin);
            cell.style.setProperty("--pinned-start", `${offsets[pin]}px`);
          } else {
            delete cell.dataset.pinnedColumn;
            cell.style.removeProperty("--pinned-start");
          }
          if (actions.has(index) && cell.tagName === "TD" && cell.colSpan === 1)
            cell.dataset.rowActions = "true";
          else delete cell.dataset.rowActions;
          index += cell.colSpan;
        });
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(container);
    Array.from(table.tHead?.rows[0]?.cells ?? []).forEach((cell) => resize.observe(cell));
    const changes = new MutationObserver(schedule);
    changes.observe(table, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "colspan"],
    });
    measure();
    return () => {
      resize.disconnect();
      changes.disconnect();
      cancelAnimationFrame(frame);
    };
  });
}
