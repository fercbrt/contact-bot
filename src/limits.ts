const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

const IP_LIMITS = { hour: 2, day: 3, week: 4, month: 5 };
const GLOBAL_DAILY_LIMIT = 20;

export interface IpCounts {
	hour: number;
	day: number;
	week: number;
	month: number;
}

export type Decision = 'allow' | 'rate_limited' | 'block';

export function decide(counts: IpCounts, globalToday: number): Decision {
	if (counts.month >= IP_LIMITS.month) return 'block';
	if (counts.hour >= IP_LIMITS.hour || counts.day >= IP_LIMITS.day || counts.week >= IP_LIMITS.week) return 'rate_limited';
	if (globalToday >= GLOBAL_DAILY_LIMIT) return 'rate_limited';
	return 'allow';
}

export async function countIpSubmissions(db: D1Database, ipHash: string, now: number): Promise<IpCounts> {
	const row = await db
		.prepare(
			`SELECT
                                COUNT(*) FILTER (WHERE created_at > ?2) AS hour,
                                COUNT(*) FILTER (WHERE created_at > ?3) AS day,
                                COUNT(*) FILTER (WHERE created_at > ?4) AS week,
                                COUNT(*) AS month
                        FROM submissions
                        WHERE ip_hash = ?1 AND created_at > ?5`,
		)
		.bind(ipHash, now - HOUR, now - DAY, now - WEEK, now - MONTH)
		.first<IpCounts>();
	if (row === null) {
		throw new Error('Count query returned no row');
	}
	return row;
}
