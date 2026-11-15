/**
 * Pure RIFF WAVE PCM Encoder (UNIX Pipeline Helper).
 *
 * Encodes Web Audio API AudioBuffer instances into standard 16-bit PCM Stereo WAV byte arrays.
 * Pure mechanism layer — zero DOM, reactive store, or Svelte dependencies.
 */

export function audioBufferToWavBytes(buffer: AudioBuffer): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate || 44100;
  const length = buffer.length;
  const blockAlign = 2 * 2; // 16-bit stereo
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF Chunk Descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt subchunk (16-bit Stereo PCM)
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM = 1
  view.setUint16(22, 2, true); // stereo
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  // data subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  const left = buffer.getChannelData(0);
  const right = numChannels > 1 ? buffer.getChannelData(1) : left;

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sl = Math.max(-1, Math.min(1, left[i] ?? 0));
    const sr = Math.max(-1, Math.min(1, right[i] ?? 0));
    view.setInt16(offset, sl < 0 ? sl * 0x8000 : sl * 0x7fff, true);
    view.setInt16(offset + 2, sr < 0 ? sr * 0x8000 : sr * 0x7fff, true);
    offset += 4;
  }

  return new Uint8Array(arrayBuffer);
}

