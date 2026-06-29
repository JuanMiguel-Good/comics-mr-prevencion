export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
}

export interface Comic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  fileUrl: string;
  fileType: 'pdf' | 'word' | 'png' | 'jpg';
  categories: string[];
  uploadDate: string;
  downloads: number;
  rating: number;
  totalRatings: number;
  comments: Comment[];
  winningTopicId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  date: string;
  type: 'opinion' | 'suggestion';
}

export interface UserRating {
  userId: string;
  comicId: string;
  rating: number;
}

export interface WishlistTopic {
  id: string;
  title: string;
  description: string;
  votes: number;
  voters: string[];
  createdBy: string;
  createdByName: string;
  createdDate: string;
  status: 'active' | 'winner' | 'archived' | 'published';
  roundId?: string;
  publishedComicId?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface VotingRound {
  id: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  winnerTopicId?: string;
  createdAt: string;
}

export interface WinnerTopic extends WishlistTopic {
  status: 'winner' | 'published';
  winningDate: string;
  originalVotes: number;
}