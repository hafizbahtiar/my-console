"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Pin, Star, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/lib/language-context";
import { toast } from "sonner";
import { getCSRFHeadersAlt } from "@/lib/csrf-utils";

export interface CustomerNote {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  customerId: string | any;
  userId: string | any;
  noteType: string;
  title?: string;
  content: string;
  isImportant: boolean;
  isPinned: boolean;
  tags: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: string;
  createdBy?: string | any;
  updatedBy?: string | any;
}

interface CustomerNotesProps {
  customerId: string;
}

export function CustomerNotes({ customerId }: CustomerNotesProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CustomerNote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    noteType: 'general',
    title: '',
    content: '',
    isImportant: false,
    isPinned: false,
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadNotes();
  }, [customerId]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/customers/${customerId}/notes`);
      if (!response.ok) {
        throw new Error('Failed to load notes');
      }
      const data = await response.json();
      setNotes(data.data || []);
    } catch (error: any) {
      console.error('Failed to load notes:', error);
      setError(error.message || 'Failed to load notes');
      toast.error(error.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      const headers = await getCSRFHeadersAlt();
      const response = await fetch(`/api/customers/${customerId}/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create note');
      }

      toast.success('Note created successfully');
      setCreateDialogOpen(false);
      resetForm();
      await loadNotes();
    } catch (error: any) {
      console.error('Failed to create note:', error);
      toast.error(error.message || 'Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note: CustomerNote) => {
    setSelectedNote(note);
    setFormData({
      noteType: note.noteType,
      title: note.title || '',
      content: note.content,
      isImportant: note.isImportant,
      isPinned: note.isPinned,
      tags: note.tags || [],
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedNote) return;

    try {
      setIsSubmitting(true);
      const headers = await getCSRFHeadersAlt();
      const response = await fetch(`/api/customers/${customerId}/notes/${selectedNote.$id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update note');
      }

      toast.success('Note updated successfully');
      setEditDialogOpen(false);
      setSelectedNote(null);
      resetForm();
      await loadNotes();
    } catch (error: any) {
      console.error('Failed to update note:', error);
      toast.error(error.message || 'Failed to update note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const headers = await getCSRFHeadersAlt();
      const response = await fetch(`/api/customers/${customerId}/notes/${noteId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }

      toast.success('Note deleted successfully');
      await loadNotes();
    } catch (error: any) {
      console.error('Failed to delete note:', error);
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const resetForm = () => {
    setFormData({
      noteType: 'general',
      title: '',
      content: '',
      isImportant: false,
      isPinned: false,
      tags: [],
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle suppressHydrationWarning>Customer Notes</CardTitle>
            <CardDescription suppressHydrationWarning>
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Note</DialogTitle>
                <DialogDescription>Add a new note for this customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Note Type</Label>
                  <Select value={formData.noteType} onValueChange={(value) => setFormData({ ...formData, noteType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title (Optional)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Note title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Note content"
                    rows={6}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="important"
                      checked={formData.isImportant}
                      onCheckedChange={(checked) => setFormData({ ...formData, isImportant: checked as boolean })}
                    />
                    <Label htmlFor="important" className="cursor-pointer">Important</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pinned"
                      checked={formData.isPinned}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked as boolean })}
                    />
                    <Label htmlFor="pinned" className="cursor-pointer">Pin</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting || !formData.content.trim()}>
                  Create Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {sortedNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet. Create your first note to get started.
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {sortedNotes.map((note) => (
                <Card key={note.$id} className={note.isPinned ? 'border-primary' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {note.isPinned && <Pin className="h-4 w-4 text-primary" />}
                          {note.isImportant && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          {note.title && <CardTitle className="text-base">{note.title}</CardTitle>}
                          <Badge variant="outline">{note.noteType}</Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {format(new Date(note.$createdAt), 'PPp')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(note)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(note.$id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {note.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update note details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select value={formData.noteType} onValueChange={(value) => setFormData({ ...formData, noteType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title (Optional)</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Note content"
                rows={6}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-important"
                  checked={formData.isImportant}
                  onCheckedChange={(checked) => setFormData({ ...formData, isImportant: checked as boolean })}
                />
                <Label htmlFor="edit-important" className="cursor-pointer">Important</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-pinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked as boolean })}
                />
                <Label htmlFor="edit-pinned" className="cursor-pointer">Pin</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag"
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedNote(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || !formData.content.trim()}>
              Update Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

