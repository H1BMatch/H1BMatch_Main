import { ObjectId } from 'mongodb';

interface Company {
    _id: ObjectId;
    name: string;
    isSponsor: boolean;  // True if the company sponsors international students
    sponsorDetails: string;  // Any additional info regarding sponsorship
}
