import { Trash2, BookOpen, Brain, Edit, Coffee, GraduationCap, FileText, ClipboardCheck, Award } from 'lucide-react';

interface Session {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  day: number;
  type: 'reading' | 'revision' | 'practice' | 'break' | 'lecture' | 'assignment' | 'test' | 'exam';
  color: string;
  deadline?: string;
}

interface SessionCardProps {
  session: Session;
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
  isDragging: boolean;
}

export default function SessionCard({ session, onEdit, onDelete, onDragStart, isDragging }: SessionCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${session.subject}"?`)) {
      onDelete(session.id);
    }
  };

  // Get icon for session type (12px size)
  const getTypeIcon = () => {
    const iconProps = { className: "h-3 w-3 text-white/80", strokeWidth: 2.5 };
    switch (session.type) {
      case 'reading': return <BookOpen {...iconProps} />;
      case 'revision': return <Brain {...iconProps} />;
      case 'practice': return <Edit {...iconProps} />;
      case 'break': return <Coffee {...iconProps} />;
      case 'lecture': return <GraduationCap {...iconProps} />;
      case 'assignment': return <FileText {...iconProps} />;
      case 'test': return <ClipboardCheck {...iconProps} />;
      case 'exam': return <Award {...iconProps} />;
      default: return null;
    }
  };

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onClick={() => onEdit(session)}
      className={`
        h-full rounded-lg shadow-md p-2.5
        border-l-4 hover:shadow-lg transition-all
        flex flex-col relative
        group
        cursor-pointer
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      style={{ 
        backgroundColor: session.color,
        borderLeftColor: session.color,
        filter: 'brightness(0.95)'
      }}
    >
      {/* Delete button - top right corner */}
      <button
        onClick={handleDelete}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 rounded p-1 z-10"
      >
        <Trash2 className="h-3 w-3 text-white" />
      </button>

      {/* Line 1: Session title with icon (13-14px, bold) */}
      <div className="flex items-start gap-1.5 mb-1">
        {getTypeIcon()}
        <h4 className="text-white text-[13px] leading-tight line-clamp-2 break-words flex-1" style={{ fontWeight: 600 }}>
          {session.subject}
        </h4>
      </div>
      
      {/* Line 2: Time range (11-12px, lighter) */}
      <div className="text-[11px] text-white/75 leading-tight">
        {session.startTime} – {session.endTime}
      </div>
    </div>
  );
}
