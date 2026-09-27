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
  // Photos 0–2 start on screen; the dots mark the newest one.
  return { slots: [0, 1, 2], nextSlot: 0, nextPhoto: SLOT_COUNT % photoCount, current: SLOT_COUNT - 1 };
}

export function advanceSlideshow(state: SlideshowState, photoCount: number): SlideshowState {
  if (photoCount <= SLOT_COUNT) {
    // Every photo is already on screen, so move them between slots instead. Shifting left
    // puts the next photo in order into the last slot, so the dots count up 1, 2, 3.
    const slots = [state.slots[1], state.slots[2], state.slots[0]];
    return { ...state, slots, current: slots[SLOT_COUNT - 1] };
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
