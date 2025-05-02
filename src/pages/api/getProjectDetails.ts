import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { contractABI } from '../../contracts/contractConfig';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// Helper function to convert BigInt to string
const serializeBigInt = (data: any): any => {
  if (typeof data === 'bigint') {
    return data.toString();
  }
  if (Array.isArray(data)) {
    return data.map(serializeBigInt);
  }
  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return data;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId, contractAddress } = req.body;

  if (projectId === undefined || !contractAddress) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('Fetching project details:', { projectId, contractAddress });
    
    const data = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: contractABI,
      functionName: 'getProjectDetails',
      args: [BigInt(projectId)],
    });

    console.log('Raw project data:', data);
    
    // Serialize BigInt values before sending response
    const serializedData = serializeBigInt(data);
    console.log('Serialized project data:', serializedData);

    return res.status(200).json({ data: serializedData });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch project details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 