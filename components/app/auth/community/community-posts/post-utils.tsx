import { CommunityPost } from "@/app/auth/community/community-posts/types";

export function getTopicName(post: CommunityPost, topics: any[]): string {
  if (post.communityTopics) {
    if (typeof post.communityTopics === 'object' && post.communityTopics.name) {
      return post.communityTopics.name;
    } else if (typeof post.communityTopics === 'string') {
      const topic = topics.find(t => t.$id === post.communityTopics);
      return topic?.name || post.communityTopics;
    }
  }
  return "__UNCATEGORIZED__";
}

