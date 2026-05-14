import { AlertTriangle, Check, X } from "lucide-react";
import { LogEntry } from "../../src/domain/logTypes";

export interface PreviewOperation {
  type: "delete" | "comment" | "uncomment";
  entries: LogEntry[];
}

interface PreviewModalProps {
  operation: PreviewOperation;
  preserveMarker: string;
  onCancel(): void;
  onConfirm(includePreserved: boolean): void;
}

export function PreviewModal(props: PreviewModalProps) {
  const preserved = props.operation.entries.filter((entry) => entry.isPreserved);
  const regular = props.operation.entries.length - preserved.length;
  const label = props.operation.type === "delete" ? "Delete" : props.operation.type === "comment" ? "Comment" : "Uncomment";

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="preview-modal" role="dialog" aria-modal="true" aria-label={`${label} console statements`}>
        <div className="modal-heading">
          <AlertTriangle size={18} aria-hidden="true" />
          <h2>{label} {props.operation.entries.length} console statements?</h2>
        </div>
        <p>
          {regular} standard logs will be affected. {preserved.length} logs contain `{props.preserveMarker}` and stay protected unless included.
        </p>
        <div className="preview-list">
          {props.operation.entries.slice(0, 8).map((entry) => (
            <code key={entry.id}>{entry.filePath}:{entry.range.start.line} {entry.preview || entry.text}</code>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={props.onCancel}>
            <X size={16} aria-hidden="true" />
            <span>Cancel</span>
          </button>
          <button type="button" onClick={() => props.onConfirm(false)}>
            <Check size={16} aria-hidden="true" />
            <span>{label} unpreserved</span>
          </button>
          {preserved.length > 0 ? (
            <button type="button" className="danger-button" onClick={() => props.onConfirm(true)}>
              <Check size={16} aria-hidden="true" />
              <span>{label} all</span>
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
