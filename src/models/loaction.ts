import { ObjectId } from 'mongodb';

interface Location {
    _id: ObjectId;
    city: string;
    state: string;
    country: string;
    jobs: ObjectId[];  // Array of job IDs from the Job Collection
}
