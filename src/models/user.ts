
export interface IUser {
  user_id?: string;
  email: string;
  password_hash: string;
  name?: string;
  resume_text?: string;
  resume_vector?: string; // Changed to string
  created_at?: Date;
  updated_at?: Date;
}
