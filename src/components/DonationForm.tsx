import React, { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';

interface DonationFormProps {
  projectId: number;
  onDonationSuccess: (hash: string) => void;
}

const DonationForm: React.FC<DonationFormProps> = ({ projectId, onDonationSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !address) return;

    try {
      await writeContract({
        address: '0x...' as `0x${string}`, // Your contract address
        abi: [], // Your contract ABI
        functionName: 'donate',
        args: [projectId],
        value: BigInt(parseFloat(amount) * 1e18), // Convert ETH to Wei
        chain: mainnet,
        account: address,
      });
      
      onDonationSuccess('Transaction submitted');
    } catch (error) {
      console.error('Error making donation:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="amount" className="form-label">Amount (ETH)</label>
        <input
          type="number"
          className="form-control"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0.01"
          required
        />
      </div>
      <button 
        type="submit" 
        className="btn btn-primary w-100"
        disabled={isPending || !address}
      >
        {isPending ? 'Processing...' : 'Donate'}
      </button>
    </form>
  );
};

export default DonationForm; 