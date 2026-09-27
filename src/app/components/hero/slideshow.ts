export const SLOT_COUNT = 3;

export interface SlideshowState {
  /** Photo index shown in each polaroid slot. */
  slots: number[];
  /** Slot that receives the next photo. */
  nextSlot: number;
  /** Photo index that will be shown next. */
  nextPhoto: number;
  /** Photo index most recently brought on screen; drives the dots. */
  current: number;
}

export function initialSlideshow(photoCount: number): SlideshowState {
  return { slots: [0, 1, 2], nextSlot: 0, nextPhoto: SLOT_COUNT % photoCount, current: 0 };
}

export function advanceSlideshow(state: SlideshowState, photoCount: number): SlideshowState {
  if (photoCount <= SLOT_COUNT) {
    // Every photo is already on screen, so move them between slots instead.
    const slots = [state.slots[2], state.slots[0], state.slots[1]];
    return { ...state, slots, current: slots[0] };
  }

  const slots = [...state.slots];
  slots[state.nextSlot] = state.nextPhoto;

  return {
    slots,
    nextSlot: (state.nextSlot + 1) % SLOT_COUNT,
    nextPhoto: (state.nextPhoto + 1) % photoCount,
    current: state.nextPhoto,
  };
}
