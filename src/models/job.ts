
export interface IJob {
    id: string;
    title: string;
    company: string;
    company_url?: string;
    job_url?: string;
    city?: string;
    state?: string;
    description?: string;
    job_type: string;
    salary_interval?: string;
    min_amount?: number;
    max_amount?: number;
    currency?: string;
    salary_source?: string;
    date_posted: Date;
    emails?: string;
    is_remote?: boolean;
    job_level?: string;
    company_industry?: string;
    company_country?: string;
    company_addresses?: string;
    company_employees_label?: string;
    company_revenue_label?: string;
    company_description?: string;
    ceo_name?: string;
    ceo_photo_url?: string;
    logo_photo_url?: string;
    banner_photo_url?: string;
    scraped_at?: Date;
    country?: string;
    job_vector?: number[]; // Array of numbers for the vector
    created_at?: Date;
    updated_at?: Date;
  }
  