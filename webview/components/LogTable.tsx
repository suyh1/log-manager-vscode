import { ExternalLink } from "lucide-react";
import { LogEntry } from "../../src/domain/logTypes";

interface LogTableProps {
  entries: LogEntry[];
  activeId?: string;
  selectedIds: Set<string>;
  onActivate(entry: LogEntry): void;
  onNavigate(entry: LogEntry): void;
  onToggleSelected(entry: LogEntry): void;
  onToggleAll(): void;
}

export function LogTable(props: LogTableProps) {
  const allSelected = props.entries.length > 0 && props.entries.every((entry) => props.selectedIds.has(entry.id));

  return (
    <section className="log-table-panel" aria-label="Console statements">
      <div className="table-header">
        <label className="check-cell">
          <input type="checkbox" checked={allSelected} onChange={props.onToggleAll} />
          <span className="sr-only">Select all visible logs</span>
        </label>
        <span>Method</span>
        <span>Location</span>
        <span>Preview</span>
        <span>Flags</span>
        <span>Open</span>
      </div>

      <div className="table-body">
        {props.entries.length === 0 ? (
          <div className="empty-state">No console statements match the current filters.</div>
        ) : (
          props.entries.map((entry) => (
            <button
              type="button"
              key={entry.id}
              className={entry.id === props.activeId ? "table-row active" : "table-row"}
              onClick={() => props.onActivate(entry)}
            >
              <span className="check-cell" onClick={(event) => event.stopPropagation()}>
                <input type="checkbox" checked={props.selectedIds.has(entry.id)} onChange={() => props.onToggleSelected(entry)} />
              </span>
              <span className={`method-badge method-${entry.method}`}>{entry.method}</span>
              <span className="location">
                <strong>{getBaseName(entry.filePath)}</strong>
                <small>{entry.range.start.line}:{entry.range.start.column}</small>
              </span>
              <span className="preview-text">{entry.preview || entry.text}</span>
              <span className="flag-stack">
                {entry.isGenerated ? <em>generated</em> : <em>manual</em>}
                {entry.isPreserved ? <em>preserved</em> : null}
              </span>
              <span
                className="icon-button"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onNavigate(entry);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    props.onNavigate(entry);
                  }
                }}
                title="Open in editor"
              >
                <ExternalLink size={15} aria-hidden="true" />
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function getBaseName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}
