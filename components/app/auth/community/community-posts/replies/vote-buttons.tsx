"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface VoteButtonsProps {
  postId?: string;
  replyId?: string;
  upvotes: number;
  downvotes: number;
}

export function VoteButtons({ postId, replyId, upvotes: initialUpvotes, downvotes: initialDownvotes }: VoteButtonsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
  }, [initialUpvotes, initialDownvotes]);

  useEffect(() => {
    // Load user's vote
    if (user) {
      loadUserVote();
    }
  }, [user, postId, replyId]);

  const loadUserVote = async () => {
    try {
      // This would require a GET endpoint to check user's vote
      // For now, we'll handle it on the client side after voting
    } catch (error) {
      // Silently fail
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error(t('community_posts_page.votes.login_required'));
      return;
    }

    if (isVoting) return;

    try {
      setIsVoting(true);

      const response = await fetch('/api/community/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          replyId,
          voteType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }

      const data = await response.json();

      // Update vote counts based on response
      if (data.data?.removed) {
        // Vote was removed
        if (userVote === 'upvote') {
          setUpvotes(prev => Math.max(0, prev - 1));
        } else if (userVote === 'downvote') {
          setDownvotes(prev => Math.max(0, prev - 1));
        }
        setUserVote(null);
      } else if (data.data?.updated) {
        // Vote type was changed
        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
          setDownvotes(prev => Math.max(0, prev - 1));
        } else {
          setDownvotes(prev => prev + 1);
          setUpvotes(prev => Math.max(0, prev - 1));
        }
        setUserVote(voteType);
      } else {
        // New vote was created
        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }
        setUserVote(voteType);
      }
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(error.message || t('community_posts_page.votes.failed'));
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userVote === 'upvote' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('upvote')}
        disabled={isVoting || !user}
        className="h-8"
      >
        <ThumbsUp className="h-4 w-4 mr-1" />
        {upvotes}
      </Button>
      <Button
        variant={userVote === 'downvote' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('downvote')}
        disabled={isVoting || !user}
        className="h-8"
      >
        <ThumbsDown className="h-4 w-4 mr-1" />
        {downvotes}
      </Button>
    </div>
  );
}

