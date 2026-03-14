import { GraphCanvas } from './components/Canvas/GraphCanvas.tsx';
import { MainToolbar } from './components/Toolbar/MainToolbar.tsx';
import { QuickInput } from './components/Toolbar/QuickInput.tsx';
import { DetailPanel } from './components/DetailPanel/DetailPanel.tsx';
import { useGraphData } from './hooks/useGraphData.ts';
import { useAutoSave } from './hooks/useAutoSave.ts';

function App() {
  const { isLoading, error } = useGraphData();
  useAutoSave();

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MainToolbar />
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', zIndex: 10,
              background: 'rgba(255,255,255,0.9)', padding: '16px 24px',
              borderRadius: 8, fontSize: 14, color: '#6B7280',
            }}
          >
            読み込み中...
          </div>
        )}
        {error && (
          <div
            role="alert"
            style={{
              position: 'absolute', top: 8, left: '50%',
              transform: 'translateX(-50%)', zIndex: 10,
              background: '#FEF2F2', border: '1px solid #FECACA',
              padding: '8px 16px', borderRadius: 8, fontSize: 13, color: '#DC2626',
            }}
          >
            {error} (オフラインモードで動作中)
          </div>
        )}
        <GraphCanvas />
        <DetailPanel />
      </div>
      <QuickInput />
    </div>
  );
}

export default App;
