import { ExternalLink, FileText } from "lucide-react";
import type { ReactNode } from "react";
import { LogEntry } from "../../src/domain/logTypes";

interface DetailPaneProps {
  entry?: LogEntry;
  emptyIcon: ReactNode;
  onNavigate(entry: LogEntry): void;
}

export function DetailPane(props: DetailPaneProps) {
  if (!props.entry) {
    return (
      <aside className="detail-pane empty-detail">
        {props.emptyIcon}
        <p>Select a console statement to inspect its source.</p>
      </aside>
    );
  }

  return (
    <aside className="detail-pane" aria-label="Selected log detail">
      <div className="detail-title">
        <FileText size={16} aria-hidden="true" />
        <h2>{props.entry.method}</h2>
      </div>
      <dl className="detail-list">
        <dt>File</dt>
        <dd>{props.entry.filePath}</dd>
        <dt>Line</dt>
        <dd>{props.entry.range.start.line}</dd>
        <dt>Preview</dt>
        <dd>{props.entry.preview || "No arguments"}</dd>
        <dt>Classification</dt>
        <dd>{props.entry.isGenerated ? "Generated" : "Manual"}{props.entry.isPreserved ? " / Preserved" : ""}</dd>
      </dl>
      <pre>{props.entry.text}</pre>
      <button type="button" onClick={() => props.onNavigate(props.entry!)} title="Open log in editor">
        <ExternalLink size={16} aria-hidden="true" />
        <span>Open in editor</span>
      </button>
    </aside>
  );
}
