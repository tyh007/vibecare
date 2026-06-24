import { useState, useEffect } from "react";
import { X, Save, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  date: string;
  category: string;
  notes?: string;
  color?: string;
}

interface NotesEditorSidebarProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventId: string, notes: string) => void;
  onUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onDelete: (eventId: string) => void;
}

export const NotesEditorSidebar = ({
  event,
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
}: NotesEditorSidebarProps) => {
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedStart, setEditedStart] = useState("");
  const [editedEnd, setEditedEnd] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  useEffect(() => {
    if (event) {
      setNotes(event.notes || "");
      setEditedTitle(event.title);
      setEditedStart(event.start);
      setEditedEnd(event.end);
      setIsEditing(false);
    }
  }, [event]);
  
  const handleSave = () => {
    if (event) {
      onSave(event.id, notes);
      if (isEditing) {
        onUpdate(event.id, {
          title: editedTitle,
          start: editedStart,
          end: editedEnd,
        });
      }
      setIsEditing(false);
      onClose();
    }
  };
  
  const handleDelete = () => {
    if (event) {
      onDelete(event.id);
      setShowDeleteDialog(false);
      onClose();
    }
  };
  
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border shadow-xl z-50 animate-slide-in-right overflow-y-auto">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-semibold"
                  placeholder="Event title"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    value={editedStart}
                    onChange={(e) => setEditedStart(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={editedEnd}
                    onChange={(e) => setEditedEnd(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.start} - {event.end}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              title={isEditing ? "Cancel edit" : "Edit event"}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notes editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Notes for this event
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes, reminders, or reflections about this event..."
            className="min-h-[300px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Notes are private and help you track your progress and feelings about each activity.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Save Changes' : 'Save Notes'}
          </Button>
          <Button 
            variant="destructive" 
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete event"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Tips */}
        <Card className="p-4 bg-muted/50">
          <h4 className="font-medium text-sm mb-2">💡 Note-taking tips:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Record how you felt during the event</li>
            <li>• Note what went well or what was challenging</li>
            <li>• Track patterns in your mood and productivity</li>
            <li>• Set reminders for follow-up actions</li>
          </ul>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
