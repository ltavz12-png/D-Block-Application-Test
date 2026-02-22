import api from './api';

export interface CommunityPost {
  id: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  body: string;
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
  company: string | null;
}

// Mock data - backend community API not yet implemented
const MOCK_POSTS: CommunityPost[] = [
  {
    id: '1',
    authorId: 'u1',
    author: { id: 'u1', firstName: 'Nino', lastName: 'Beridze', avatarUrl: null },
    body: 'Just finished setting up my new workspace at D Block Vera! The natural lighting here is amazing.',
    mediaUrl: null,
    likesCount: 12,
    commentsCount: 3,
    isLiked: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    authorId: 'u2',
    author: { id: 'u2', firstName: 'Giorgi', lastName: 'Tskhadadze', avatarUrl: null },
    body: 'Anyone interested in a JavaScript meetup this Friday? We could use the event space at D Block Vake.',
    mediaUrl: null,
    likesCount: 24,
    commentsCount: 8,
    isLiked: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    authorId: 'u3',
    author: { id: 'u3', firstName: 'Mariam', lastName: 'Kvaratskhelia', avatarUrl: null },
    body: 'Loving the new coffee blend at the D Block cafe. Perfect fuel for late-night coding sessions!',
    mediaUrl: null,
    likesCount: 18,
    commentsCount: 5,
    isLiked: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_MEMBERS: CommunityMember[] = [
  { id: 'u1', firstName: 'Nino', lastName: 'Beridze', avatarUrl: null, role: 'Designer', company: 'Studio B' },
  { id: 'u2', firstName: 'Giorgi', lastName: 'Tskhadadze', avatarUrl: null, role: 'Developer', company: 'TechHub' },
  { id: 'u3', firstName: 'Mariam', lastName: 'Kvaratskhelia', avatarUrl: null, role: 'Marketing', company: null },
  { id: 'u4', firstName: 'Davit', lastName: 'Meladze', avatarUrl: null, role: 'Founder', company: 'LaunchPad' },
  { id: 'u5', firstName: 'Ana', lastName: 'Lomidze', avatarUrl: null, role: 'Product Manager', company: 'Fintech.ge' },
  { id: 'u6', firstName: 'Luka', lastName: 'Janelidze', avatarUrl: null, role: 'Engineer', company: 'DataFlow' },
];

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  // TODO: Replace with real API call when backend implements community
  // const { data } = await api.get<CommunityPost[]>('/community/posts');
  // return data;
  return Promise.resolve(MOCK_POSTS);
}

export async function getCommunityMembers(): Promise<CommunityMember[]> {
  // TODO: Replace with real API call when backend implements community
  // const { data } = await api.get<CommunityMember[]>('/community/members');
  // return data;
  return Promise.resolve(MOCK_MEMBERS);
}

export async function likePost(postId: string): Promise<void> {
  // TODO: Replace with real API call
  // await api.post(`/community/posts/${postId}/like`);
}

export async function unlikePost(postId: string): Promise<void> {
  // TODO: Replace with real API call
  // await api.delete(`/community/posts/${postId}/like`);
}
