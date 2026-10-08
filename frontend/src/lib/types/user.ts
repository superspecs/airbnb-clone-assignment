export interface DemoUser {
  id: number;
  name: string;
  avatar_url: string | null;
  is_host: boolean;
  is_superhost: boolean;
  joined_at: string;
}
