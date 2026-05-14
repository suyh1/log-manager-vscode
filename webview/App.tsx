import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquareText } from "lucide-react";
import { LOG_METHODS, LogEntry, LogMethod, ScanResult } from "../src/domain/logTypes";
import type { ExtensionMessage, WebviewMessage } from "../src/webview/protocol";
import { filterLogs, getUniqueFiles, summarizeLogs } from "./dashboardFilters";
import { DetailPane } from "./components/DetailPane";
import { FilterRail } from "./components/FilterRail";
import { LogTable } from "./components/LogTable";
import { PreviewModal, PreviewOperation } from "./components/PreviewModal";
import { Toolbar } from "./components/Toolbar";
import { getVsCodeApi } from "./vscodeApi";

const vscode = getVsCodeApi();

const emptyResult: ScanResult = {
  entries: [],
  diagnostics: [],
  scannedFiles: 0
};

export function App() {
  const [result, setResult] = useState<ScanResult>(emptyResult);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [methods, setMethods] = useState<LogMethod[]>([...LOG_METHODS]);
  const [filePath, setFilePath] = useState<string | undefined>();
  const [includePreserved, setIncludePreserved] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [previewOperation, setPreviewOperation] = useState<PreviewOperation | undefined>();

  useEffect(() => {
    const listener = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "scanStarted":
          setLoading(true);
          setError(undefined);
          setNotice(undefined);
          break;
        case "scanCompleted":
          setResult(message.result);
          setSelectedIds(new Set());
          setActiveId(message.result.entries[0]?.id);
          setLoading(false);
          break;
        case "operationCompleted":
          setResult(message.result);
          setSelectedIds(new Set());
          setPreviewOperation(undefined);
          setNotice(message.message);
          setLoading(false);
          break;
        case "error":
          setError(message.message);
          setLoading(false);
          break;
      }
    };

    window.addEventListener("message", listener);
    post({ type: "ready" });

    return () => window.removeEventListener("message", listener);
  }, []);

  const filters = useMemo(
    () => ({
      query,
      methods,
      filePath,
      includePreserved
    }),
    [query, methods, filePath, includePreserved]
  );

  const visibleEntries = useMemo(() => filterLogs(result.entries, filters), [result.entries, filters]);
  const selectedEntries = useMemo(
    () => visibleEntries.filter((entry) => selectedIds.has(entry.id)),
    [selectedIds, visibleEntries]
  );
  const activeEntry = useMemo(
    () => visibleEntries.find((entry) => entry.id === activeId) ?? visibleEntries[0],
    [activeId, visibleEntries]
  );
  const summary = useMemo(() => summarizeLogs(result.entries), [result.entries]);
  const files = useMemo(() => getUniqueFiles(result.entries), [result.entries]);

  function post(message: WebviewMessage) {
    vscode.postMessage(message);
  }

  function toggleMethod(method: LogMethod) {
    setMethods((current) => (current.includes(method) ? current.filter((item) => item !== method) : [...current, method]));
  }

  function toggleSelected(entry: LogEntry) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(entry.id)) {
        next.delete(entry.id);
      } else {
        next.add(entry.id);
      }

      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      if (visibleEntries.length > 0 && visibleEntries.every((entry) => current.has(entry.id))) {
        return new Set();
      }

      return new Set(visibleEntries.map((entry) => entry.id));
    });
  }

  function openPreview(operation: PreviewOperation["type"]) {
    const entries = selectedEntries.length > 0 ? selectedEntries : visibleEntries;
    setPreviewOperation({ type: operation, entries });
  }

  function confirmPreview(includeMarked: boolean) {
    if (!previewOperation) {
      return;
    }

    const logIds = previewOperation.entries.map((entry) => entry.id);
    const type = previewOperation.type;

    if (type === "delete") {
      post({ type: "deleteLogs", logIds, includePreserved: includeMarked });
    } else if (type === "comment") {
      post({ type: "commentLogs", logIds, includePreserved: includeMarked });
    } else {
      post({ type: "uncommentLogs", logIds, includePreserved: includeMarked });
    }
  }

  return (
    <main className="dashboard-shell">
      <section className="topline">
        <div>
          <p className="eyebrow">Workspace console control</p>
          <h1>Log Manager</h1>
        </div>
        <div className="status-strip" aria-live="polite">
          {loading ? <span className="pulse">Scanning</span> : <span>Idle</span>}
          <span>{result.scannedFiles} files</span>
          <span>{visibleEntries.length} visible</span>
        </div>
      </section>

      <Toolbar
        query={query}
        onQueryChange={setQuery}
        selectedCount={selectedEntries.length}
        visibleCount={visibleEntries.length}
        onRefresh={() => post({ type: "scanWorkspace" })}
        onDelete={() => openPreview("delete")}
        onComment={() => openPreview("comment")}
        onUncomment={() => openPreview("uncomment")}
      />

      {error ? (
        <div className="banner banner-danger">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      {notice ? (
        <div className="banner banner-ok">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}

      <section className="workspace-grid">
        <FilterRail
          summary={summary}
          files={files}
          activeMethods={methods}
          activeFile={filePath}
          includePreserved={includePreserved}
          diagnostics={result.diagnostics}
          onToggleMethod={toggleMethod}
          onFileChange={setFilePath}
          onIncludePreservedChange={setIncludePreserved}
        />

        <LogTable
          entries={visibleEntries}
          activeId={activeEntry?.id}
          selectedIds={selectedIds}
          onActivate={(entry) => setActiveId(entry.id)}
          onNavigate={(entry) => post({ type: "navigateToLog", logId: entry.id })}
          onToggleSelected={toggleSelected}
          onToggleAll={toggleAllVisible}
        />

        <DetailPane
          entry={activeEntry}
          onNavigate={(entry) => post({ type: "navigateToLog", logId: entry.id })}
          emptyIcon={<MessageSquareText size={40} aria-hidden="true" />}
        />
      </section>

      {previewOperation ? (
        <PreviewModal
          operation={previewOperation}
          preserveMarker="log-manager:keep"
          onCancel={() => setPreviewOperation(undefined)}
          onConfirm={confirmPreview}
        />
      ) : null}
    </main>
  );
}
