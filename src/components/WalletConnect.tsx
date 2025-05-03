import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, error } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    try {
      console.log('Attempting to connect...');
      await connect({ connector: injected() });
      console.log('Connection successful');
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  if (error) {
    console.error('Connection error:', error);
  }

  return (
    <div className="text-center">
      {isConnected ? (
        <div>
          <button 
            className="btn btn-danger"
            onClick={() => disconnect()}
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button 
          className="btn btn-primary"
          onClick={handleConnect}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect; 