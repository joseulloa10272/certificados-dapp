import { formatAddress } from '../utils/blockchain'

function WalletConnection({ account, chainId, isConnecting, onConnect, onSwitchNetwork }) {
  const isSepolia = chainId === 11155111

  return (
    <section className="panel wallet-panel" aria-labelledby="wallet-title">
      <div className="wallet-identity">
        <span className={`network-dot ${isSepolia ? 'connected' : ''}`} aria-hidden="true" />
        <div>
          <p className="section-kicker">Conexión</p>
          <h2 id="wallet-title">MetaMask</h2>
          <p className="muted">
            {account ? `Wallet ${formatAddress(account)}` : 'Esperando conexión de wallet'}
            {' · '}
            <strong className={isSepolia ? 'network-ok' : 'network-error'}>
              {isSepolia ? 'Sepolia' : 'Red incorrecta'}
            </strong>
          </p>
        </div>
      </div>
      <div className="button-row">
        {!isSepolia && account && (
          <button type="button" className="secondary-button" onClick={onSwitchNetwork}>
            Cambiar a Sepolia
          </button>
        )}
        <button type="button" onClick={onConnect} disabled={isConnecting}>
          {isConnecting ? 'Conectando…' : account ? 'Reconectar' : 'Conectar MetaMask'}
        </button>
      </div>
    </section>
  )
}

export default WalletConnection
