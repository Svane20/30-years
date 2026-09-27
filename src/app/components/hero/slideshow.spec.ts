import { advanceSlideshow, initialSlideshow, SlideshowState, SLOT_COUNT } from './slideshow';

function run(photoCount: number, steps: number): SlideshowState[] {
  const states = [initialSlideshow(photoCount)];
  for (let i = 0; i < steps; i++) {
    states.push(advanceSlideshow(states[states.length - 1], photoCount));
  }
  return states;
}

describe('slideshow', () => {
  it('starts with the first three photos in the three slots', () => {
    expect(initialSlideshow(5)).toEqual({ slots: [0, 1, 2], nextSlot: 0, nextPhoto: 3, current: 0 });
  });

  it('puts the next photo into the next slot in turn', () => {
    const [, first, second, third, fourth] = run(5, 4);
    expect(first.slots).toEqual([3, 1, 2]);
    expect(second.slots).toEqual([3, 4, 2]);
    expect(third.slots).toEqual([3, 4, 0]);
    expect(fourth.slots).toEqual([1, 4, 0]);
    expect(fourth.current).toBe(1);
  });

  it('never shows the same photo in two slots at once', () => {
    for (let photoCount = 3; photoCount <= 10; photoCount++) {
      for (const state of run(photoCount, 50)) {
        expect(new Set(state.slots).size).toBe(SLOT_COUNT);
      }
    }
  });

  it('brings every photo on screen within one full cycle', () => {
    const photoCount = 7;
    const seen = new Set(run(photoCount, photoCount).flatMap(s => s.slots));
    expect(seen.size).toBe(photoCount);
  });

  it('rotates the photos between slots when there are exactly three', () => {
    const [start, next] = run(3, 1);
    expect(next.slots).not.toEqual(start.slots);
    expect([...next.slots].sort()).toEqual([0, 1, 2]);
    expect(next.current).toBe(next.slots[0]);
  });
});
