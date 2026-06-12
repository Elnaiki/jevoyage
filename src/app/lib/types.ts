export interface Agency {
  id: string;
  name: string;
  location: string;
  city: string;
  logo_url: string;
  phone: string;
  description: string;
}

export interface Trip {
  id: string;
  agency_id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  bus_type: string;
  driver_name: string;
  driver_phone: string;
  available_seats: number;
  total_seats: number;
  status: string;
  agency?: Agency;
  like_count?: number;
  comment_count?: number;
  avg_rating?: number;
  user_liked?: boolean;
}

export interface TripLike {
  id: string;
  user_id: string;
  trip_id: string;
}

export interface TripComment {
  id: string;
  user_id: string;
  trip_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface TripRating {
  id: string;
  user_id: string;
  trip_id: string;
  rating_overall: number;
  rating_agency: number;
  rating_agent: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}
