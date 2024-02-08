import type { NextApiRequest, NextApiResponse } from 'next';
type Data = {
    name: string;
};
export default function handler(req: NextApiRequest, res: NextApiResponse<Data>): void;
export {};
