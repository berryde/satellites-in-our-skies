import { create } from "zustand";

type Selection = {
	/** Index into the catalog of the satellite under the pointer. */
	hovered: number | null;
	/** Pointer position (CSS pixels within the globe) while hovering. */
	pointer: { x: number; y: number };
	/** Index into the catalog of the satellite whose details are open. */
	selected: number | null;
	select: (index: number | null) => void;
	/** An orbit class being pointed at in the legend: the globe dims the others. */
	focusClass: number | null;
	/** Counts requests to turn the globe towards the selected satellite. */
	focusRequests: number;
	/** Selects a satellite and turns the globe to face it, then keeps it in view. */
	selectAndFocus: (index: number) => void;
	/** True while the camera keeps the selected satellite in the middle of the view. */
	following: boolean;
	/** Stops following, as when the visitor takes hold of the globe. */
	stopFollowing: () => void;
};

/** Whether the camera has been moved from where it opened, and how to put it back. */
export const useView = create<{ moved: boolean; reset: () => void }>()(() => ({ moved: false, reset: () => {} }));

export const useSelection = create<Selection>()((set) => ({
	hovered: null,
	pointer: { x: 0, y: 0 },
	selected: null,
	// Picking a satellite on the globe opens its details where it is; only a focus follows it.
	select: (selected) => set((s) => ({ selected, following: selected !== null && selected === s.selected && s.following })),
	focusClass: null,
	focusRequests: 0,
	selectAndFocus: (selected) => set((s) => ({ selected, following: true, focusRequests: s.focusRequests + 1 })),
	following: false,
	stopFollowing: () => set({ following: false }),
}));
