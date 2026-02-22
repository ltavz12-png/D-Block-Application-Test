import api from './api';

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  date: string;
  startTime: string;
  endTime: string;
  locationId: string;
  locationName: string;
  address: string;
  price: number;
  currency: string;
  isFree: boolean;
  capacity: number;
  attendeesCount: number;
  hostName: string;
  hostAvatarUrl: string | null;
  category: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface EventTicket {
  id: string;
  eventId: string;
  event?: Event;
  userId: string;
  quantity: number;
  totalPaid: number;
  currency: string;
  status: 'confirmed' | 'cancelled' | 'used';
  qrCode: string;
  createdAt: string;
}

export interface PurchaseTicketPayload {
  eventId: string;
  quantity: number;
}

// Mock data - backend events API not yet implemented
const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Startup Pitch Night',
    description: 'Join us for an exciting evening where early-stage startups pitch their ideas to a panel of investors and mentors. Network with fellow entrepreneurs and get inspired by innovative ideas from the Georgian startup ecosystem.',
    imageUrl: null,
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '18:00',
    endTime: '21:00',
    locationId: 'loc1',
    locationName: 'D Block Vera',
    address: '12 Barnovi St, Tbilisi',
    price: 15,
    currency: 'GEL',
    isFree: false,
    capacity: 80,
    attendeesCount: 52,
    hostName: 'D Block Events',
    hostAvatarUrl: null,
    category: 'Networking',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e2',
    title: 'JavaScript Meetup',
    description: 'Monthly JavaScript meetup featuring talks on React, Node.js, and the latest in the JS ecosystem. Bring your laptop for live coding sessions and lightning talks.',
    imageUrl: null,
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '19:00',
    endTime: '21:30',
    locationId: 'loc2',
    locationName: 'D Block Vake',
    address: '24 Chavchavadze Ave, Tbilisi',
    price: 0,
    currency: 'GEL',
    isFree: true,
    capacity: 50,
    attendeesCount: 31,
    hostName: 'Tbilisi JS Community',
    hostAvatarUrl: null,
    category: 'Tech',
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e3',
    title: 'Design Workshop: Figma Masterclass',
    description: 'A hands-on workshop covering advanced Figma techniques including auto-layout, components, and design systems. Perfect for intermediate designers looking to level up.',
    imageUrl: null,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '10:00',
    endTime: '16:00',
    locationId: 'loc1',
    locationName: 'D Block Vera',
    address: '12 Barnovi St, Tbilisi',
    price: 45,
    currency: 'GEL',
    isFree: false,
    capacity: 25,
    attendeesCount: 18,
    hostName: 'Design Academy',
    hostAvatarUrl: null,
    category: 'Workshop',
    isFeatured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e4',
    title: 'Freelancer Networking Brunch',
    description: 'Connect with fellow freelancers over brunch. Share experiences, find collaborators, and build your professional network in a casual setting.',
    imageUrl: null,
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '11:00',
    endTime: '14:00',
    locationId: 'loc3',
    locationName: 'D Block Saburtalo',
    address: '8 Pekini Ave, Tbilisi',
    price: 20,
    currency: 'GEL',
    isFree: false,
    capacity: 40,
    attendeesCount: 12,
    hostName: 'D Block Community',
    hostAvatarUrl: null,
    category: 'Networking',
    isFeatured: false,
    createdAt: new Date().toISOString(),
  },
];

export async function getEvents(): Promise<Event[]> {
  // TODO: Replace with real API call when backend implements events
  // const { data } = await api.get<Event[]>('/events');
  // return data;
  return Promise.resolve(MOCK_EVENTS);
}

export async function getEventById(id: string): Promise<Event> {
  // TODO: Replace with real API call
  // const { data } = await api.get<Event>(`/events/${id}`);
  // return data;
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error('Event not found');
  return Promise.resolve(event);
}

export async function getMyTickets(): Promise<EventTicket[]> {
  // TODO: Replace with real API call
  // const { data } = await api.get<EventTicket[]>('/events/tickets/my');
  // return data;
  return Promise.resolve([]);
}

export async function purchaseTicket(payload: PurchaseTicketPayload): Promise<EventTicket> {
  // TODO: Replace with real API call
  // const { data } = await api.post<EventTicket>('/events/tickets', payload);
  // return data;
  const event = MOCK_EVENTS.find((e) => e.id === payload.eventId);
  return Promise.resolve({
    id: `t-${Date.now()}`,
    eventId: payload.eventId,
    event,
    userId: 'current-user',
    quantity: payload.quantity,
    totalPaid: (event?.price ?? 0) * payload.quantity,
    currency: event?.currency ?? 'GEL',
    status: 'confirmed',
    qrCode: `DBLOCK-${payload.eventId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
}
