import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Comic, Comment, Category, WishlistTopic, VotingRound, WinnerTopic } from '../types';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ComicsContextType {
  comics: Comic[];
  categories: Category[];
  wishlistTopics: WishlistTopic[];
  winnerTopics: WinnerTopic[];
  activeRound: VotingRound | null;
  completedRounds: VotingRound[];
  recentWinner: WinnerTopic | null;
  loading: boolean;
  saving: boolean;
  connectionError: boolean;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addComic: (comic: Omit<Comic, 'id' | 'uploadDate' | 'downloads' | 'rating' | 'totalRatings' | 'comments'>, file?: File, userId?: string, winningTopicId?: string) => Promise<void>;
  updateComic: (id: string, updates: Partial<Comic>) => Promise<void>;
  deleteComic: (id: string) => Promise<void>;
  addComment: (comicId: string, comment: Omit<Comment, 'id' | 'date'>) => Promise<void>;
  deleteComment: (comicId: string, commentId: string) => Promise<void>;
  rateComic: (comicId: string, rating: number, userId: string) => Promise<void>;
  downloadComic: (id: string) => Promise<void>;
  addWishlistTopic: (topic: Omit<WishlistTopic, 'id' | 'votes' | 'voters' | 'createdDate'>) => Promise<void>;
  voteWishlistTopic: (topicId: string, userId: string) => Promise<void>;
  deleteWishlistTopic: (topicId: string) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<string>;
  getTimeRemaining: () => { days: number; hours: number; minutes: number; seconds: number } | null;
  checkAndCompleteRounds: () => Promise<void>;
}

const ComicsContext = createContext<ComicsContextType | undefined>(undefined);

export function ComicsProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [comics, setComics] = useState<Comic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlistTopics, setWishlistTopics] = useState<WishlistTopic[]>([]);
  const [winnerTopics, setWinnerTopics] = useState<WinnerTopic[]>([]);
  const [activeRound, setActiveRound] = useState<VotingRound | null>(null);
  const [completedRounds, setCompletedRounds] = useState<VotingRound[]>([]);
  const [recentWinner, setRecentWinner] = useState<WinnerTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Check if Supabase is properly configured
  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      if (!supabase.supabaseUrl || !supabase.supabaseKey) {
        console.error('Supabase URL or Key not configured');
        return false;
      }
      
      // Test connection with a simple query
      const { error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
  };
  useEffect(() => {
    initializeData();
    
    // Update timer every second
    const interval = setInterval(() => {
      // This will trigger re-renders to update the countdown timer
      setActiveRound(prev => prev ? { ...prev } : null);
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const initializeData = async () => {
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    setConnectionError(!isConnected);
    
    if (!isConnected) {
      // Set default values when no connection
      setCategories([]);
      setComics([]);
      setWishlistTopics([]);
      setWinnerTopics([]);
      setActiveRound(null);
      setCompletedRounds([]);
      setRecentWinner(null);
      setLoading(false);
      return;
    }

    try {
      // Load data sequentially to better handle errors
      await loadCategories();
      await loadComics();
      await loadWishlistTopics();
      await loadActiveRound();
      await loadWinnerTopics();
      await loadCompletedRounds();
      await loadRecentWinner();
    } catch (error) {
      console.error('Error loading initial data:', error);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  const checkAndCompleteRounds = async () => {
    // Get active rounds that have passed end date
    const { data: expiredRounds, error } = await supabase
      .from('voting_rounds')
      .select(`
        id, end_date,
        wishlist_topics!round_id(
          id, title, 
          wishlist_votes(user_id)
        )
      `)
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString());

    if (error || !expiredRounds?.length) return;

    for (const round of expiredRounds) {
      await completeRound(round);
    }

    // Reload data after completing rounds
    await Promise.all([
      loadActiveRound(),
      loadWinnerTopics(),
      loadCompletedRounds(),
      loadWishlistTopics()
    ]);
  };

  const completeRound = async (round: any) => {
    try {
      // Find winner (topic with most votes)
      const topicsWithVotes = round.wishlist_topics.map((topic: any) => ({
        ...topic,
        voteCount: topic.wishlist_votes?.length || 0
      }));

      const winner = topicsWithVotes.reduce((prev: any, current: any) => 
        current.voteCount > prev.voteCount ? current : prev
      );

      // Update round as completed with winner
      const { error: roundError } = await supabase
        .from('voting_rounds')
        .update({
          status: 'completed',
          winner_topic_id: winner.id
        })
        .eq('id', round.id);

      if (roundError) throw roundError;

      // Update winner topic status
      const { error: winnerError } = await supabase
        .from('wishlist_topics')
        .update({ status: 'winner' })
        .eq('id', winner.id);

      if (winnerError) throw winnerError;

      // Archive other topics from this round
      const otherTopicIds = round.wishlist_topics
        .filter((t: any) => t.id !== winner.id)
        .map((t: any) => t.id);

      if (otherTopicIds.length > 0) {
        const { error: archiveError } = await supabase
          .from('wishlist_topics')
          .update({ status: 'archived' })
          .in('id', otherTopicIds);

        if (archiveError) throw archiveError;
      }

      console.log(`Round ${round.id} completed. Winner: ${winner.title}`);
    } catch (error) {
      console.error('Error completing round:', error);
    }
  };

  const loadCompletedRounds = async () => {
    try {
      const { data, error } = await supabase
        .from('voting_rounds')
        .select('*')
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
        .limit(5); // Last 5 completed rounds

      if (error) {
        console.error('Error loading completed rounds:', error);
        return;
      }

      if (data) {
        const mappedRounds: VotingRound[] = data.map(round => ({
          id: round.id,
          startDate: round.start_date,
          endDate: round.end_date,
          status: round.status,
          winnerTopicId: round.winner_topic_id,
          createdAt: round.created_at
        }));
        setCompletedRounds(mappedRounds);
      }
    } catch (error) {
      console.error('Error loading completed rounds:', error);
    }
  };

  const loadRecentWinner = async () => {
    try {
      // Get the most recent completed round winner (not published yet)
      const { data: roundData, error: roundError } = await supabase
        .from('voting_rounds')
        .select('*')
        .eq('status', 'completed')
        .not('winner_topic_id', 'is', null)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roundError) {
        console.error('Error loading recent winner round:', roundError);
        return;
      }

      if (!roundData || !roundData.winner_topic_id) {
        setRecentWinner(null);
        return;
      }

      // Second, get the winner topic data
      const { data: topicData, error: topicError } = await supabase
        .from('wishlist_topics')
        .select(`
          id, title, description, created_by, status,
          wishlist_votes(user_id)
        `)
        .eq('id', roundData.winner_topic_id)
        .eq('status', 'winner')
        .maybeSingle();

      if (topicError) {
        console.error('Error loading winner topic:', topicError);
        setConnectionError(true);
        return;
      }

      if (topicData) {
        const winner: WinnerTopic = {
          id: topicData.id,
          title: topicData.title,
          description: topicData.description || '',
          votes: topicData.wishlist_votes?.length || 0,
          voters: topicData.wishlist_votes?.map((v: any) => v.user_id) || [],
          createdBy: topicData.created_by || 'unknown',
          createdByName: 'Usuario',
          createdDate: roundData.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: 'winner',
          roundId: roundData.id,
          winningDate: roundData.end_date?.split('T')[0] || new Date().toISOString().split('T')[0]
        };
        setRecentWinner(winner);
      }
    } catch (error) {
      console.error('Error in loadRecentWinner:', error);
      setRecentWinner(null);
    }
  };

  const loadWinnerTopics = async () => {
    if (connectionError) return;
    
    const { data, error } = await supabase
      .from('wishlist_topics')
      .select(`
        *,
        wishlist_votes(user_id),
        voting_rounds!round_id(end_date),
        comics!published_comic_id(id, title)
      `)
      .in('status', ['winner', 'published'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading winner topics:', error);
      setConnectionError(true);
      return;
    }

    const mappedWinners: WinnerTopic[] = data.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description || '',
      votes: topic.wishlist_votes?.length || 0,
      voters: topic.wishlist_votes?.map((v: any) => v.user_id) || [],
      createdBy: topic.created_by,
      createdByName: 'Usuario',
      createdDate: topic.created_at.split('T')[0],
      status: topic.status as 'winner' | 'published',
      roundId: topic.round_id,
      publishedComicId: topic.published_comic_id,
      winningDate: topic.voting_rounds?.[0]?.end_date?.split('T')[0] || topic.created_at.split('T')[0],
      originalVotes: topic.wishlist_votes?.length || 0
    }));

    setWinnerTopics(mappedWinners);
  };

  const loadActiveRound = async () => {
    if (connectionError) return;
    
    const { data, error } = await supabase
      .from('voting_rounds')
      .select('*')
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error loading active round:', error);
      setConnectionError(true);
      return;
    }

    if (data) {
      const round: VotingRound = {
        id: data.id,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
        winnerTopicId: data.winner_topic_id || undefined,
        createdAt: data.created_at
      };
      setActiveRound(round);
    }
  };

  const loadCategories = async () => {
    if (connectionError) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      setConnectionError(true);
      return;
    }

    const mappedCategories: Category[] = data.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      description: cat.description || undefined
    }));

    setCategories(mappedCategories);
  };

  const loadComics = async () => {
    if (connectionError) return;
    
    console.log('Loading comics...');
    try {
      const { data: comicsData, error: comicsError } = await supabase
        .from('comics')
        .select(`
          *,
          comic_categories(category_id),
          comments(*),
          user_ratings(rating)
        `)
        .order('created_at', { ascending: false });

      if (comicsError) {
        console.error('Error loading comics:', comicsError);
        setConnectionError(true);
        return;
      }

      const mappedComics: Comic[] = comicsData.map(comic => {
        const categories = comic.comic_categories?.map((cc: any) => cc.category_id) || [];
        const comments: Comment[] = comic.comments?.map((comment: any) => ({
          id: comment.id,
          userId: comment.user_id,
          userName: 'Usuario', // We'd need to join with users table for real names
          content: comment.content,
          date: comment.created_at.split('T')[0],
          type: comment.comment_type
        })) || [];

        const ratings = comic.user_ratings || [];
        const totalRatings = ratings.length;
        const rating = totalRatings > 0 
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings 
          : 0;

        console.log(`Comic "${comic.title}": ${ratings.length} ratings, average: ${rating}`);

        return {
          id: comic.id,
          title: comic.title,
          description: comic.description,
          coverImage: comic.cover_image || 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
          fileUrl: comic.file_url || '#',
          fileType: comic.file_type as 'pdf' | 'word' | 'png' | 'jpg',
          categories,
          uploadDate: comic.upload_date || comic.created_at.split('T')[0],
          downloads: comic.downloads,
          rating: Math.round(rating * 10) / 10,
          totalRatings,
          comments,
          winningTopicId: comic.winning_topic_id
        };
      });

      console.log(`Loaded ${mappedComics.length} comics successfully`);
      setComics(mappedComics);
    } catch (error) {
      console.error('Error loading comics:', error);
      setConnectionError(true);
      setComics([]);
    }
  };

  const loadWishlistTopics = async () => {
    if (connectionError) return;
    
    try {
    const { data, error } = await supabase
      .from('wishlist_topics')
      .select(`
        *,
        wishlist_votes(user_id)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading wishlist topics:', error);
      setConnectionError(true);
      return;
    }

    const mappedTopics: WishlistTopic[] = data.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description || '',
      votes: topic.wishlist_votes?.length || 0,
      voters: topic.wishlist_votes?.map((v: any) => v.user_id) || [],
      createdBy: topic.created_by,
      createdByName: 'Usuario', // We'd need to join with users table
      createdDate: topic.created_at.split('T')[0],
      status: topic.status || 'active',
      roundId: topic.round_id
    }));

    setWishlistTopics(mappedTopics);
    } catch (error) {
      console.error('Error loading wishlist topics:', error instanceof Error ? error.message : String(error));
      setConnectionError(true);
      setWishlistTopics([]);
    }
  };

  const getTimeRemaining = () => {
    if (!activeRound) return null;
    
    const now = new Date().getTime();
    const endTime = new Date(activeRound.endDate).getTime();
    const difference = endTime - now;
    
    console.log('Time remaining calculation:', {
      now: new Date(now).toISOString(),
      endTime: new Date(endTime).toISOString(),
      difference,
      hasTimeLeft: difference > 0
    });
    
    if (difference <= 0) return null;
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('comics')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('comics')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const addCategory = async (newCategory: Omit<Category, 'id'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: newCategory.name,
        color: newCategory.color,
        description: newCategory.description
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error adding category: ${error.message}`);
    }

    const category: Category = {
      id: data.id,
      name: data.name,
      color: data.color,
      description: data.description || undefined
    };

    setCategories(prev => [...prev, category]);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }

    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }

    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const addComic = async (
    newComic: Omit<Comic, 'id' | 'uploadDate' | 'downloads' | 'rating' | 'totalRatings' | 'comments'>, 
    file?: File,
    userId?: string,
    winningTopicId?: string
  ) => {
    setSaving(true);
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
    let fileUrl = null;

    // Upload file if provided
    if (file) {
      // Sanitize filename by replacing invalid characters with underscores
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9\-_.]/g, '_');
      const fileName = `${Date.now()}_${sanitizedName}`;
        try {
          fileUrl = await uploadFile(file, fileName);
        } catch (error) {
          console.error('Error uploading file:', error);
          throw new Error('Error al subir el archivo');
        }
    }

    // Insert comic
    const { data: comicData, error: comicError } = await supabase
      .from('comics')
      .insert([{
        title: newComic.title,
        description: newComic.description,
        cover_image: newComic.coverImage || 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
        file_url: fileUrl,
        file_type: newComic.fileType,
        downloads: 0,
        created_by: userId,
        winning_topic_id: winningTopicId || null
      }])
      .select()
      .single();

    if (comicError) {
        console.error('Error inserting comic:', comicError);
      throw new Error(`Error adding comic: ${comicError.message}`);
    }

    // Insert category associations
    if (newComic.categories.length > 0) {
      const categoryInserts = newComic.categories.map(categoryId => ({
        comic_id: comicData.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('comic_categories')
        .insert(categoryInserts);

      if (categoryError) {
          console.error('Error adding comic categories:', categoryError);
          throw new Error(`Error adding comic categories: ${categoryError.message}`);
      }
    }

    // If this comic is for a winning topic, mark as published
    if (winningTopicId) {
      const { error: topicError } = await supabase
        .from('wishlist_topics')
        .update({ 
          status: 'published',
          published_comic_id: comicData.id 
        })
        .eq('id', winningTopicId);

      if (topicError) {
        console.error('Error updating winner topic:', topicError);
      }

      // Reload winner topics
      await loadWinnerTopics();
    }

    // Reload comics to get the updated list
    await loadComics();
    } catch (error) {
      console.error('Error in addComic:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateComic = async (id: string, updates: Partial<Comic>) => {
    const { error } = await supabase
      .from('comics')
      .update({
        title: updates.title,
        description: updates.description,
        cover_image: updates.coverImage
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Error updating comic: ${error.message}`);
    }

    // Update categories if provided
    if (updates.categories) {
      // Delete existing categories
      await supabase
        .from('comic_categories')
        .delete()
        .eq('comic_id', id);

      // Insert new categories
      if (updates.categories.length > 0) {
        const categoryInserts = updates.categories.map(categoryId => ({
          comic_id: id,
          category_id: categoryId
        }));

        await supabase
          .from('comic_categories')
          .insert(categoryInserts);
      }
    }

    await loadComics();
  };

  const deleteComic = async (id: string) => {
    const { error } = await supabase
      .from('comics')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting comic: ${error.message}`);
    }

    setComics(prev => prev.filter(comic => comic.id !== id));
  };

  const addComment = async (comicId: string, comment: Omit<Comment, 'id' | 'date'>) => {
    const { error } = await supabase
      .from('comments')
      .insert([{
        comic_id: comicId,
        user_id: comment.userId,
        content: comment.content,
        comment_type: comment.type
      }]);

    if (error) {
      throw new Error(`Error adding comment: ${error.message}`);
    }

    await loadComics();
  };

  const deleteComment = async (comicId: string, commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }

    await loadComics();
  };

  const rateComic = async (comicId: string, rating: number, userId: string) => {
    console.log('rateComic function called with:', { comicId, rating, userId });
    try {
      const { data, error } = await supabase
      .from('user_ratings')
        .upsert({
          comic_id: comicId,
          user_id: userId,
          rating: rating
        }, {
          onConflict: 'user_id,comic_id'
        })
        .select();

      if (error) {
        console.error('Database error in rateComic:', error);
        throw error;
      }

      console.log('Rating saved successfully:', data);
      
      // Force reload comics to get updated ratings
      console.log('Reloading comics after rating...');
      await loadComics();
      console.log('Comics reloaded successfully');
      
      return true;
    } catch (error) {
      console.error('Error in rateComic:', error);
      return false;
    }
  };

  const downloadComic = async (id: string) => {
    // First get current downloads count
    const { data: comicData, error: fetchError } = await supabase
      .from('comics')
      .select('downloads')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching comic for download count:', fetchError);
      return;
    }

    // Increment the downloads count
    const { error } = await supabase
      .from('comics')
      .update({ downloads: (comicData.downloads || 0) + 1 })
      .eq('id', id);

    if (error) {
      console.error('Error updating download count:', error);
      return;
    }

    // Update local state
    setComics(prev => prev.map(comic =>
      comic.id === id 
        ? { ...comic, downloads: comic.downloads + 1 }
        : comic
    ));
  };

  const addWishlistTopic = async (topic: Omit<WishlistTopic, 'id' | 'votes' | 'voters' | 'createdDate'>) => {
    console.log('addWishlistTopic called with:', topic);
    
    try {
      const { data, error } = await supabase
        .from('wishlist_topics')
        .insert([{
          title: topic.title,
          description: topic.description,
          created_by: topic.createdBy,
          round_id: activeRound?.id || null,
          status: 'active'
        }])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Error adding wishlist topic: ${error.message}`);
      }

      console.log('Topic inserted successfully:', data);
      await loadWishlistTopics();
      console.log('Topics reloaded');
    } catch (error) {
      console.error('Error in addWishlistTopic:', error);
      throw error;
    }
  };

  const voteWishlistTopic = async (topicId: string, userId: string) => {
    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('wishlist_votes')
      .select()
      .eq('topic_id', topicId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // Remove vote
      const { error } = await supabase
        .from('wishlist_votes')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Error removing vote: ${error.message}`);
      }
    } else {
      // Add vote
      const { error } = await supabase
        .from('wishlist_votes')
        .insert([{
          topic_id: topicId,
          user_id: userId
        }]);

      if (error) {
        throw new Error(`Error adding vote: ${error.message}`);
      }
    }

    await loadWishlistTopics();
  };

  const deleteWishlistTopic = async (topicId: string) => {
    const { error } = await supabase
      .from('wishlist_topics')
      .delete()
      .eq('id', topicId);

    if (error) {
      throw new Error(`Error deleting wishlist topic: ${error.message}`);
    }

    setWishlistTopics(prev => prev.filter(topic => topic.id !== topicId));
  };

  return (
    <ComicsContext.Provider value={{
      comics,
      categories,
      wishlistTopics,
      winnerTopics,
      activeRound,
      completedRounds,
      recentWinner,
      loading,
      saving,
      connectionError,
      addCategory,
      updateCategory,
      deleteCategory,
      addComic,
      updateComic,
      deleteComic,
      addComment,
      deleteComment,
      rateComic,
      downloadComic,
      addWishlistTopic,
      voteWishlistTopic,
      deleteWishlistTopic,
      uploadFile,
      getTimeRemaining,
      checkAndCompleteRounds
    }}>
      {children}
    </ComicsContext.Provider>
  );
}

export function useComics() {
  const context = useContext(ComicsContext);
  if (context === undefined) {
    throw new Error('useComics must be used within a ComicsProvider');
  }
  return context;
}