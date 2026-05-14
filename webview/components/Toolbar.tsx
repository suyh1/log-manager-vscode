import { Ban, EyeOff, MessageSquareOff, RefreshCw, Search, Trash2 } from "lucide-react";

interface ToolbarProps {
  query: string;
  selectedCount: number;
  visibleCount: number;
  onQueryChange(query: string): void;
  onRefresh(): void;
  onDelete(): void;
  onComment(): void;
  onUncomment(): void;
}

export function Toolbar(props: ToolbarProps) {
  const actionLabel = props.selectedCount > 0 ? `${props.selectedCount} selected` : `${props.visibleCount} visible`;

  return (
    <section className="toolbar" aria-label="Log management toolbar">
      <label className="search-box">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search logs</span>
        <input
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder="Search method, file, label, or source"
        />
      </label>

      <div className="toolbar-actions">
        <span className="scope-count">{actionLabel}</span>
        <button type="button" onClick={props.onRefresh} title="Scan workspace">
          <RefreshCw size={16} aria-hidden="true" />
          <span>Scan</span>
        </button>
        <button type="button" onClick={props.onComment} title="Comment logs">
          <EyeOff size={16} aria-hidden="true" />
          <span>Comment</span>
        </button>
        <button type="button" onClick={props.onUncomment} title="Uncomment logs">
          <Ban size={16} aria-hidden="true" />
          <span>Uncomment</span>
        </button>
        <button type="button" className="danger-button" onClick={props.onDelete} title="Delete logs">
          <Trash2 size={16} aria-hidden="true" />
          <span>Delete</span>
        </button>
      </div>
    </section>
  );
}
