import React from 'react';

interface TransactionDetailsProps {
  transactionHash: string;
  ipfsLink: string;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transactionHash, ipfsLink }) => {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Transaction Details</h5>
        
        {transactionHash && (
          <div className="mb-3">
            <h6>Transaction Hash:</h6>
            <a 
              href={`https://etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-break"
            >
              {transactionHash}
            </a>
          </div>
        )}

        {ipfsLink && (
          <div>
            <h6>IPFS Link:</h6>
            <a 
              href={ipfsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-break"
            >
              {ipfsLink}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetails; 