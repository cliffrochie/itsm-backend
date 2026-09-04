import buffer from "node:buffer";

// Node 26+ dropped buffer.SlowBuffer. Polyfill for compatibility with jsonwebtoken/jwa
if (!(buffer as Record<string, unknown>).SlowBuffer) {
  (buffer as Record<string, unknown>).SlowBuffer = { prototype: {} };
}
