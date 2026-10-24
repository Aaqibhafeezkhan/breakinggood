import assert from "node:assert/strict";
import test from "node:test";
import { parseFileBlocks } from "./files.js";

test("parses multiple file blocks", () => {
  const files = parseFileBlocks(`=== FILE: package.json ===
{"name":"x"}
=== END FILE ===
=== FILE: src/App.jsx ===
export default () => null
=== END FILE ===`);

  assert.deepEqual([...files], [
    ["package.json", '{"name":"x"}\n'],
    ["src/App.jsx", "export default () => null\n"],
  ]);
});

test("parses blocks with CRLF line endings", () => {
  const files = parseFileBlocks("=== FILE: src/App.js ===\r\nexport default 1;\r\n=== END FILE ===");

  assert.equal(files.get("src/App.js"), "export default 1;\r\n");
});

test("strips a code fence inside a file block", () => {
  const files = parseFileBlocks("=== FILE: src/App.jsx ===\n```jsx\nexport default () => null\n```\n=== END FILE ===");

  assert.equal(files.get("src/App.jsx"), "export default () => null\n");
});

test("refuses parent-directory path segments", () => {
  assert.throws(() => parseFileBlocks(`=== FILE: ../etc/passwd ===
x
=== END FILE ===`));
  assert.throws(() => parseFileBlocks(`=== FILE: src/../secret.js ===
x
=== END FILE ===`));
});

test("allows harmless double dots in a filename", () => {
  const files = parseFileBlocks(`=== FILE: foo..bar.js ===
x
=== END FILE ===`);

  assert.equal(files.get("foo..bar.js"), "x\n");
});

test("refuses absolute Windows paths", () => {
  assert.throws(() => parseFileBlocks(`=== FILE: C:\\Users\\x\\evil.js ===
x
=== END FILE ===`));
  assert.throws(() => parseFileBlocks(`=== FILE: C:/x ===
x
=== END FILE ===`));
});