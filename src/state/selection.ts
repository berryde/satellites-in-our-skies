import { create } from "zustand";

type Selection = {
	/** Index into the catalog of the satellite under the pointer. */
	hovered: number | null;
	/** Pointer position (CSS pixels within the globe) while hovering. */
	pointer: { x: number; y: number };
	/** Index into the catalog of the satellite whose details are open. */
	selected: number | null;
	select: (index: number | null) => void;
};

export const useSelection = create<Selection>()((set) => ({
	hovered: null,
	pointer: { x: 0, y: 0 },
	selected: null,
	select: (selected) => set({ selected }),
}));
