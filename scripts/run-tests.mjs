import { createJiti } from 'jiti';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Polyfill minimal localStorage in Node environment if missing
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  const mockStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index) => Array.from(store.keys())[index] || null,
  };
  globalThis.localStorage = mockStorage;
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = { localStorage: mockStorage };
  } else {
    globalThis.window.localStorage = mockStorage;
  }
}

const jiti = createJiti(process.cwd() + '/index.js');

const testDir = join(process.cwd(), 'tests', 'unit');
const testFiles = readdirSync(testDir).filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.js'));

console.log(`Running ${testFiles.length} test file(s)...`);

for (const file of testFiles) {
  const fullPath = join(testDir, file);
  console.log(`\n--- Loading test suite: ${file} ---`);
  jiti(fullPath);
}
