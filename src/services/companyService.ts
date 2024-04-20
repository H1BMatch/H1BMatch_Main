// import pool from '../utils/RDSConnection';
import pool from '../utils/localDBConnection';
export async function getCompanyData(companyName: string) {
    const searchPattern = `%${companyName}%`;
      // const result = await db.query('SELECT employer_legal_business_name, COUNT(*) FROM jobs WHERE employer_legal_business_name LIKE $1 GROUP BY employer_legal_business_name', [searchPattern]);
    // res.json(result.rows);
    const result = await pool.query('SELECT SUM(1) FROM jobs WHERE employer_legal_business_name LIKE $1', [searchPattern]);
    console.log("number of jobs for" , companyName, " : ", result.rows[0].sum);
    return result.rows[0].sum;
}
