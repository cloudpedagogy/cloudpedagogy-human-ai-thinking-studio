import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Wizard } from './pages/Wizard';
import { PatternRegistry } from './pages/PatternRegistry';
import { PatternWorkspace } from './pages/PatternWorkspace';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';
import { corePack } from './data/corePack';

function App() {
  const patterns = useStore(state => state.patterns);
  const importPack = useStore(state => state.importPack);

  useEffect(() => {
    // Auto-merge new core pack patterns that aren't in LocalStorage yet
    const existingIds = new Set(patterns.map(p => p.id));
    const missingPatterns = corePack.patterns.filter(p => !existingIds.has(p.id));
    if (missingPatterns.length > 0) {
      importPack({ ...corePack, patterns: missingPatterns }, 'keep');
    }
  }, [patterns, importPack]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Wizard />} />
          <Route path="registry" element={<PatternRegistry />} />
          <Route path="workspace/:sessionId" element={<PatternWorkspace />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
