import crytpo from "crypto"

export function generateShortCode(size = 4){
    const buffer = crytpo.randomBytes(size)

    const base64 = buffer.toString('base64')

    const urlSafeBase64 = base64
            .replace(/\+/g, '-') 
            .replace(/\//g, '_')
            .replace(/=/g, '');

            return urlSafeBase64;
}