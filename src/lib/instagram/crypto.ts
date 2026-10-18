import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
	timingSafeEqual
} from 'node:crypto';

const key = (secret: string) => createHash('sha256').update(secret).digest();

/** Chiffre en AES-256-GCM ; format `iv.tag.données` en base64. `secret` doit être long et aléatoire. */
export function encrypt(plain: string, secret: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
	const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.');
}

/** Déchiffre un texte produit par {@link encrypt} ; lève si le secret ou le contenu est invalide. */
export function decrypt(payload: string, secret: string): string {
	const [iv, tag, data] = payload.split('.').map((part) => Buffer.from(part, 'base64'));
	// Longueur du tag imposée : sans elle, Node accepte un tag tronqué (4 octets), donc falsifiable.
	const decipher = createDecipheriv('aes-256-gcm', key(secret), iv, { authTagLength: 16 });
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** Hash SHA-256 en hexadécimal. */
export function sha256Hex(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

/** Jeton aléatoire de 256 bits, URL-safe. */
export function generateToken(): string {
	return randomBytes(32).toString('base64url');
}

/** Compare deux hashes hexadécimaux en temps constant. */
export function safeEqualHex(a: string, b: string): boolean {
	const left = Buffer.from(a, 'hex');
	const right = Buffer.from(b, 'hex');
	return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}
