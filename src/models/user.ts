import { ObjectId } from 'mongodb';

interface Experience {
    title: string;
    company: ObjectId;  // Reference to Company Collection
    location: string;
    startDate: Date;
    endDate: Date;
    description: string;
}

interface Education {
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate: Date;
}

interface AppliedJob {
    job: ObjectId;  // Reference to Job Collection
    applicationDate: Date;
    status: string;  // e.g., 'Applied', 'Interviewing', 'Offered', 'Rejected'
}

interface User {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;  // Stored securely
    profile: {
        headline: string;
        summary: string;
        experience: Experience[];
        education: Education[];
        skills: string[];
    };
    connections: ObjectId[];  // Array of User IDs
    appliedJobs: AppliedJob[];
}
