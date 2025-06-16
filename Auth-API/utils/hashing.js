import { createHmac } from "crypto";
import { compare, hash } from "bcryptjs";
export const dohash = async (value, saltvalue) =>{
    const result = await hash(value, saltvalue);
    return result;
}

export const doHashValidation = (value, hashedValue) =>{
    const result = compare(value,hashedValue)
    return result;
}

export const hmacProcess =(value,key) =>{
    const result = createHmac('sha256',key).update(value).digest('hex');
    return result;
}