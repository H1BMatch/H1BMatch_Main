import pool from '../utils/RDSConnection';
export async function getCompanyData(companyName: string) {
    const searchPattern = `%${companyName}%`;
    const result = await pool.query('SELECT SUM(1) FROM jobs WHERE employer_legal_business_name LIKE $1', [searchPattern]);
    console.log("number of jobs for" , companyName, " : ", result.rows[0].sum);
    return result.rows[0].sum;
}
