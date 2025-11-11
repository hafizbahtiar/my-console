"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Phone, Mail, Calendar, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/lib/language-context";
import { toast } from "sonner";
import { getCSRFHeadersAlt } from "@/lib/csrf-utils";

export interface CustomerInteraction {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  customerId: string | any;
  userId: string | any;
  interactionType: string;
  subject?: string;
  description?: string;
  contactMethod?: string;
  direction: string;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: string;
  createdBy?: string | any;
}

interface CustomerInteractionsProps {
  customerId: string;
}

export function CustomerInteractions({ customerId }: CustomerInteractionsProps) {
  const { t } = useTranslation();
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    interactionType: 'call',
    subject: '',
    description: '',
    contactMethod: 'phone',
    direction: 'outbound',
    duration: '',
    outcome: '',
    nextAction: '',
    nextActionDate: '',
  });

  useEffect(() => {
    loadInteractions();
  }, [customerId]);

  const loadInteractions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/customers/${customerId}/interactions`);
      if (!response.ok) {
        throw new Error('Failed to load interactions');
      }
      const data = await response.json();
      setInteractions(data.data || []);
    } catch (error: any) {
      console.error('Failed to load interactions:', error);
      setError(error.message || 'Failed to load interactions');
      toast.error(error.message || 'Failed to load interactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      const headers = await getCSRFHeadersAlt();
      const payload = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
      };
      const response = await fetch(`/api/customers/${customerId}/interactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create interaction');
      }

      toast.success('Interaction created successfully');
      setCreateDialogOpen(false);
      resetForm();
      await loadInteractions();
    } catch (error: any) {
      console.error('Failed to create interaction:', error);
      toast.error(error.message || 'Failed to create interaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      interactionType: 'call',
      subject: '',
      description: '',
      contactMethod: 'phone',
      direction: 'outbound',
      duration: '',
      outcome: '',
      nextAction: '',
      nextActionDate: '',
    });
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const sortedInteractions = [...interactions].sort((a, b) => 
    new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
  );

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
            <CardTitle suppressHydrationWarning>Customer Interactions</CardTitle>
            <CardDescription suppressHydrationWarning>
              {interactions.length} {interactions.length === 1 ? 'interaction' : 'interactions'}
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Interaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Interaction</DialogTitle>
                <DialogDescription>Log a new customer interaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Interaction Type *</Label>
                  <Select value={formData.interactionType} onValueChange={(value) => setFormData({ ...formData, interactionType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Interaction subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Interaction details"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Method</Label>
                    <Select value={formData.contactMethod} onValueChange={(value) => setFormData({ ...formData, contactMethod: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="video_call">Video Call</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Direction *</Label>
                    <Select value={formData.direction} onValueChange={(value) => setFormData({ ...formData, direction: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Inbound</SelectItem>
                        <SelectItem value="outbound">Outbound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="Duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select value={formData.outcome} onValueChange={(value) => setFormData({ ...formData, outcome: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="successful">Successful</SelectItem>
                        <SelectItem value="no_answer">No Answer</SelectItem>
                        <SelectItem value="voicemail">Voicemail</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Next Action</Label>
                  <Input
                    value={formData.nextAction}
                    onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                    placeholder="Next action required"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Action Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.nextActionDate}
                    onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting || !formData.interactionType}>
                  Create Interaction
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
        {sortedInteractions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No interactions yet. Log your first interaction to get started.
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {sortedInteractions.map((interaction) => (
                <Card key={interaction.$id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getInteractionIcon(interaction.interactionType)}
                          {interaction.subject && <CardTitle className="text-base">{interaction.subject}</CardTitle>}
                          <Badge variant="outline">{interaction.interactionType}</Badge>
                          {interaction.direction === 'inbound' ? (
                            <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {format(new Date(interaction.$createdAt), 'PPp')}
                          {interaction.duration && ` • ${interaction.duration} min`}
                          {interaction.contactMethod && ` • ${interaction.contactMethod}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {interaction.description && (
                      <p className="text-sm whitespace-pre-wrap mb-3">{interaction.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {interaction.outcome && (
                        <Badge variant="secondary">Outcome: {interaction.outcome}</Badge>
                      )}
                      {interaction.nextAction && (
                        <Badge variant="outline">Next: {interaction.nextAction}</Badge>
                      )}
                      {interaction.nextActionDate && (
                        <Badge variant="outline">
                          Due: {format(new Date(interaction.nextActionDate), 'PPp')}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

