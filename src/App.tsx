import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Wizard } from './pages/Wizard';
import { PatternRegistry } from './pages/PatternRegistry';
import { PatternWorkspace } from './pages/PatternWorkspace';
import { Settings } from './pages/Settings';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
