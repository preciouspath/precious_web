import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';


export const ACCESS_SECRET = Buffer.from(process.env.JWT_ACCESS_SECRET_BASE64!, 'base64');
export const REFRESH_SECRET = Buffer.from(process.env.JWT_REFRESH_SECRET_BASE64!, 'base64');

const ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL || 900);
const REFRESH_TTL = Number(process.env.REFRESH_TOKEN_TTL || 1209600);

export function createAccessToken(user: { id: string, role: string, tokenVersion: number }) {
  return jwt.sign(
    { sub: user.id, role: user.role, tv: user.tokenVersion },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export async function createRefreshSession(userId: string, deviceInfo: string) {
  const sessionId = uuidv4();
  const payload = { sid: sessionId, uid: userId };
  const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
  return { token, sessionId };
}

