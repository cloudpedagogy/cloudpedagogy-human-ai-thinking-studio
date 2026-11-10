import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 5179;
const DIST_DIR = path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// 1. Static file server for dist
function startServer() {
  const server = http.createServer((req, res) => {
    console.log(`[HTTP ${req.method}] ${req.url}`);
    let reqPath = req.url.split('?')[0].split('#')[0];
    if (reqPath === '/' || !reqPath) reqPath = '/index.html';

    let filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error(`[HTTP Error] reading ${filePath}:`, err);
        res.writeHead(500);
        res.end('Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[E2E] Static server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

// 2. CDP Helper
class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  waitOpen() {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      console.error('[CDP Eval Exception]', res.exceptionDetails.text, res.exceptionDetails.exception?.description);
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function runTests() {
  const server = await startServer();
  const userDataDir = `/tmp/e2e-chrome-${Date.now()}`;

  console.log('[E2E] Launching Chrome Headless...');
  let browserWsUrl = null;

  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*',
      '--no-sandbox',
      '--disable-gpu',
      `--user-data-dir=${userDataDir}`,
      `http://127.0.0.1:${PORT}/`,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  chrome.stderr.on('data', (d) => {
    const msg = d.toString();
    const match = msg.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:9222\/[^\s]+)/);
    if (match) {
      browserWsUrl = match[1];
    }
  });

  let cdp;
  const results = [];

  const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    const mark = passed ? '✔ PASS' : '✖ FAIL';
    console.log(`[E2E] ${mark}: ${name} ${detail ? `(${detail})` : ''}`);
  };

  try {
    // Wait for Chrome CDP port to open and find page target
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const listRes = await fetch('http://127.0.0.1:9222/json/list');
        const list = await listRes.json();
        const pageTab = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (pageTab) {
          wsUrl = pageTab.webSocketDebuggerUrl;
          console.log('[E2E] Found target page tab:', wsUrl);
          break;
        }
      } catch {}
    }

    if (!wsUrl) {
      throw new Error('Failed to connect to Chrome CDP endpoint at http://127.0.0.1:9222');
    }

    cdp = new CDPClient(wsUrl);
    await cdp.waitOpen();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    cdp.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded') {
        console.log(`[Browser Console]`, msg.params?.message?.text);
      }
      if (msg.id && cdp.callbacks.has(msg.id)) {
        const { resolve, reject } = cdp.callbacks.get(msg.id);
        cdp.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    const navigateAndWait = async (url) => {
      const navRes = await cdp.send('Page.navigate', { url });
      console.log(`[CDP Navigate] ${url}:`, navRes);
      // Wait for complete
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const ready = await cdp.eval('document.readyState');
        if (ready === 'complete') break;
      }
      await new Promise((r) => setTimeout(r, 800));
    };

    const navigateHash = async (hash) => {
      await cdp.eval(`window.location.hash = '${hash}';`);
      await new Promise((r) => setTimeout(r, 800));
    };

    // TEST 1: App launch & Title
    await navigateAndWait(`http://127.0.0.1:${PORT}/`);
    const title = await cdp.eval('document.title');
    const htmlSnippet = await cdp.eval('document.body.innerHTML');
    console.log('[DEBUG] document.title is:', title);
    console.log('[DEBUG] html preview:', htmlSnippet?.substring(0, 200));
    record('Application launches with correct title', title === 'CloudPedagogy Human–AI Thinking Studio', title);

    // TEST 2: Core Patterns & Categories
    await navigateHash('#/registry');
    const patternCount = await cdp.eval(
      'document.querySelectorAll(".grid > div.border, .grid > div.bg-white").length'
    );
    record('Pattern Registry renders patterns', patternCount >= 32, `Found ${patternCount} patterns`);

    // TEST 3: Category filter dropdown
    const categoriesCount = await cdp.eval(
      'document.querySelectorAll("#category-filter-select option").length'
    );
    record('Category filter displays 9 categories + All', categoriesCount === 10, `Found ${categoriesCount} options`);

    // TEST 4: Category Filtering via selection
    await cdp.eval(`
      const sel = document.getElementById('category-filter-select');
      sel.value = 'Decision Making';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    `);
    await new Promise((r) => setTimeout(r, 500));
    const decisionCount = await cdp.eval(
      'document.querySelectorAll(".grid > div.border, .grid > div.bg-white").length'
    );
    record('Category filtering narrows to 3 Decision Making patterns', decisionCount === 3, `Found ${decisionCount}`);

    // TEST 5: Reload with URL-based category param
    await navigateAndWait(`http://127.0.0.1:${PORT}/#/registry?category=Risk+Thinking`);
    const riskCount = await cdp.eval(
      'document.querySelectorAll(".grid > div.border, .grid > div.bg-white").length'
    );
    record('URL-based category filter persists after reload', riskCount === 3, `Found ${riskCount}`);

    // TEST 6: Search Filter
    await navigateHash('#/registry');
    await cdp.eval(`
      const search = document.getElementById('pattern-search-input');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(search, 'Trade-off');
      search.dispatchEvent(new Event('input', { bubbles: true }));
      search.dispatchEvent(new Event('change', { bubbles: true }));
    `);
    await new Promise((r) => setTimeout(r, 600));
    const searchMatch = await cdp.eval(
      'document.querySelectorAll(".grid > div.border, .grid > div.bg-white").length'
    );
    record('Search input dynamically filters pattern library', searchMatch === 1, `Found ${searchMatch}`);

    // TEST 7: Thinking Wizard
    await navigateHash('#/');
    // Click Goal
    await cdp.eval(`
      const goalBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Make a decision'));
      goalBtn && goalBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 400));
    // Click Situation
    await cdp.eval(`
      const sitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Strategic'));
      sitBtn && sitBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 400));
    // Click Help
    await cdp.eval(`
      const helpBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Compare options'));
      helpBtn && helpBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    const bestMatchText = await cdp.eval(`
      document.querySelector('.border-2.border-primary-400, .border-primary-600')?.textContent || ''
    `);
    record('Thinking Wizard provides Best Match recommendation', bestMatchText.includes('Trade-off Analysis'), 'Trade-off Analysis');

    // TEST 8: Launch reasoning session from recommendation
    await cdp.eval(`
      const useBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Use Pattern'));
      useBtn && useBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 1000));
    const currentUrl = await cdp.eval('window.location.hash');
    record('Wizard navigates directly to new Reasoning Workspace', currentUrl.includes('/workspace/'), currentUrl);

    // TEST 9: Enter and save reasoning responses
    await cdp.eval(`
      const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;

      const prob = document.getElementById('workspace-problem-input');
      if (prob) {
        textareaSetter.call(prob, 'Real Browser Test Problem');
        prob.dispatchEvent(new Event('input', { bubbles: true }));
        prob.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const q0 = document.getElementById('thinking-q-0');
      if (q0) {
        textareaSetter.call(q0, 'Real Browser Response Content');
        q0.dispatchEvent(new Event('input', { bubbles: true }));
        q0.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await new Promise((r) => setTimeout(r, 1200));

    // TEST 10: LocalStorage persistence & snapshot presence
    const storageRaw = await cdp.eval(`
      window.localStorage.getItem('cloudpedagogy-thinking-studio-storage')
    `);
    const parsed = storageRaw ? JSON.parse(storageRaw) : null;
    const sessionInStorage = parsed?.state?.sessions?.[0];
    record(
      'Session responses persist in browser LocalStorage',
      sessionInStorage?.responses?.q_0 === 'Real Browser Response Content' &&
      sessionInStorage?.decision_context?.problem === 'Real Browser Test Problem',
      'Verified responses in LocalStorage'
    );
    record(
      'Pattern snapshot automatically attached to session',
      sessionInStorage?.pattern_snapshot?.name === 'Trade-off Analysis',
      sessionInStorage?.pattern_snapshot?.name
    );

    // TEST 11: Page reload preserves active session and responses
    await cdp.send('Page.reload');
    await new Promise((r) => setTimeout(r, 1200));
    const reloadedProb = await cdp.eval(`document.getElementById('workspace-problem-input')?.value`);
    const reloadedQ0 = await cdp.eval(`document.getElementById('thinking-q-0')?.value`);
    record(
      'Reloading browser restores session context and questions',
      reloadedProb === 'Real Browser Test Problem' && reloadedQ0 === 'Real Browser Response Content',
      `Restored problem: "${reloadedProb}"`
    );

    // TEST 12: Settings and Backup
    await navigateHash('#/settings');
    const settingsHeading = await cdp.eval('document.querySelector(".max-w-4xl h1, main h1")?.textContent');
    record('Settings page renders correctly', settingsHeading?.includes('Settings'), settingsHeading);

  } catch (err) {
    console.error('[E2E] Unexpected error during test run:', err);
    record('E2E execution', false, err.message);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    server.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }

  const allPassed = results.every((r) => r.passed);
  console.log(`\n========================================`);
  console.log(`E2E BROWSER REGRESSION SUMMARY:`);
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`========================================\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('[E2E] Fatal error:', err);
  process.exit(1);
});
