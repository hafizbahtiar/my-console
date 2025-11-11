"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeHTML } from "@/components/ui/safe-html";
import { MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { tablesDB, DATABASE_ID, COMMUNITY_REPLIES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { ReplyForm } from "./reply-form";
import { VoteButtons } from "./vote-buttons";

export interface CommunityReply {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  author: string;
  authorId: string;
  authorEmail?: string;
  postId: string;
  parentId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  isSpam: boolean;
  upvotes: number;
  downvotes: number;
  depth: number;
  isSolution: boolean;
}

interface RepliesListProps {
  postId: string;
  isLocked?: boolean;
}

export function RepliesList({ postId, isLocked = false }: RepliesListProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReplies();
  }, [postId]);

  const loadReplies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/community/posts/${postId}/replies`);
      
      if (!response.ok) {
        throw new Error('Failed to load replies');
      }

      const data = await response.json();
      setReplies(data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load replies:', err);
      setError(err.message || 'Failed to load replies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyCreated = () => {
    setReplyingTo(null);
    loadReplies();
  };

  const toggleReply = (replyId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });
  };

  // Build reply tree
  const buildReplyTree = (replies: CommunityReply[]): CommunityReply[] => {
    const replyMap = new Map<string, CommunityReply & { children: CommunityReply[] }>();
    const rootReplies: (CommunityReply & { children: CommunityReply[] })[] = [];

    // First pass: create map with children arrays
    replies.forEach(reply => {
      replyMap.set(reply.$id, { ...reply, children: [] });
    });

    // Second pass: build tree
    replies.forEach(reply => {
      const replyWithChildren = replyMap.get(reply.$id)!;
      if (reply.parentId) {
        const parent = replyMap.get(reply.parentId);
        if (parent) {
          parent.children.push(replyWithChildren);
        } else {
          // Parent not found, treat as root
          rootReplies.push(replyWithChildren);
        }
      } else {
        rootReplies.push(replyWithChildren);
      }
    });

    return rootReplies;
  };

  const renderReply = (reply: CommunityReply & { children?: CommunityReply[] }, depth: number = 0) => {
    const isExpanded = expandedReplies.has(reply.$id);
    const hasChildren = reply.children && reply.children.length > 0;
    const canReply = !isLocked && depth < 3 && user;

    return (
      <div key={reply.$id} className={depth > 0 ? "ml-6 mt-4 border-l-2 pl-4" : ""}>
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{reply.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.$createdAt).toLocaleDateString()}
                  </span>
                  {reply.isSolution && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      {t('community_posts_page.replies.solution')}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert mb-3">
                  <SafeHTML html={reply.content} />
                </div>
                <div className="flex items-center gap-4">
                  <VoteButtons
                    replyId={reply.$id}
                    upvotes={reply.upvotes}
                    downvotes={reply.downvotes}
                  />
                  {canReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === reply.$id ? null : reply.$id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {t('community_posts_page.replies.reply')}
                    </Button>
                  )}
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReply(reply.$id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          {t('community_posts_page.replies.hide_replies', { count: reply.children!.length })}
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4 mr-1" />
                          {t('community_posts_page.replies.show_replies', { count: reply.children!.length })}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Reply form */}
            {replyingTo === reply.$id && (
              <div className="mt-4 pt-4 border-t">
                <ReplyForm
                  postId={postId}
                  parentId={reply.$id}
                  onSuccess={handleReplyCreated}
                  onCancel={() => setReplyingTo(null)}
                />
              </div>
            )}

            {/* Nested replies */}
            {hasChildren && isExpanded && (
              <div className="mt-4">
                {reply.children!.map(child => renderReply(child, depth + 1))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const replyTree = buildReplyTree(replies);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('community_posts_page.replies.title', { count: replies.length })}
        </h3>
        {!isLocked && user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReplyingTo(replyingTo === 'root' ? null : 'root')}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {t('community_posts_page.replies.add_reply')}
          </Button>
        )}
      </div>

      {/* Root reply form */}
      {replyingTo === 'root' && (
        <ReplyForm
          postId={postId}
          onSuccess={handleReplyCreated}
          onCancel={() => setReplyingTo(null)}
        />
      )}

      {/* Replies list */}
      {replyTree.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground" suppressHydrationWarning>
              {t('community_posts_page.replies.no_replies')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {replyTree.map(reply => renderReply(reply))}
        </div>
      )}
    </div>
  );
}

