// A Durable Object KV value is limited to 128 KiB. Keep each UTF-8 block at 64 KiB.
const BLOCK_SIZE = 64 * 1024;
const key = index => `room-block-${index}`;
const encode = room => {
  const { order, ...state } = room;
  // The immutable deck goes first, so normal transitions change only the tail.
  return new TextEncoder().encode(JSON.stringify({ order, state }));
};
const equal = (left, right) => left?.length === right?.length && left.every((byte, i) => byte === right[i]);

export async function readRoom(storage) {
  const index = await storage.get('room');
  if (!index) return null;
  if (index.format !== 2) return index; // Existing rooms retain their original snapshot.
  if (!Number.isInteger(index.blocks) || index.blocks < 1 || index.blocks > 256) throw Error('Invalid room index');
  const keys = Array.from({ length: index.blocks }, (_, i) => key(i));
  const blocks = await storage.get(keys), decoder = new TextDecoder('utf-8', { fatal: true });
  let serialized = '';
  for (let i=0;i<keys.length;i++) {
    const bytes = blocks.get(keys[i]);
    if (!(bytes instanceof Uint8Array)) throw Error('Missing room block');
    serialized += decoder.decode(bytes, { stream: i < keys.length-1 });
  }
  const { order, state } = JSON.parse(serialized);
  return { ...state, order };
}

export async function writeRoom(storage, next, previous, alarm) {
  const bytes = encode(next), before = previous ? encode(previous) : null;
  const count = Math.ceil(bytes.length / BLOCK_SIZE);
  if (count > 256) throw Error('Room snapshot is too large');
  await storage.transaction(async () => {
    const oldIndex = await storage.get('room');
    for (let i=0;i<count;i++) {
      const block = bytes.slice(i*BLOCK_SIZE, (i+1)*BLOCK_SIZE);
      const oldBlock = before?.subarray(i*BLOCK_SIZE, (i+1)*BLOCK_SIZE);
      if (oldIndex?.format !== 2 || !equal(block, oldBlock)) await storage.put(key(i), block);
    }
    if (oldIndex?.format === 2 && oldIndex.blocks > count) {
      await storage.delete(Array.from({ length: oldIndex.blocks-count }, (_, i) => key(count+i)));
    }
    await storage.put('room', { format: 2, blocks: count });
    if (alarm !== undefined) await storage.setAlarm(alarm);
  });
}
