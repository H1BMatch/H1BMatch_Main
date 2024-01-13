import { ObjectId } from 'mongodb';

export interface Job {
    id: ObjectId;
    title: string;
    company: string;
    link?: string;
    description?: string;
    location?: string;
    isSponsor?: boolean;  // True if the company sponsors international students
    dateCollected?: Date;
    source?: string;  // e.g., 'Indeed'
    url?: string;  // URL to the job posting
    georssPoint?: string;
}
