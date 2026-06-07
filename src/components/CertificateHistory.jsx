import { ETHERSCAN_BASE_URL, formatAddress } from '../utils/blockchain'

function CertificateHistory({ events, isLoading, onRefresh, onCopy }) {
  return (
    <section className="panel history-panel" aria-labelledby="history-title">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Actividad on-chain</p>
          <h2 id="history-title">Historial de certificados</h2>
          <p className="section-description">Eventos recientes emitidos por el contrato en Sepolia.</p>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Actualizando…' : 'Actualizar historial'}
        </button>
      </div>
      {!isLoading && events.length === 0 ? (
        <div className="empty-state"><span aria-hidden="true">⌁</span><p>Aún no hay eventos para mostrar o el contrato no está configurado.</p></div>
      ) : (
        <div className="history-list">
          {events.map((event) => (
            <article className="history-item" key={`${event.transactionHash}-${event.index}`}>
              <span className={`event-icon ${event.type === 'Registrado' ? 'active' : 'revoked'}`} aria-hidden="true">{event.type === 'Registrado' ? '✓' : '×'}</span>
              <div className="history-content">
                <div className="history-title-row"><strong>Certificado {event.type.toLowerCase()}</strong><span className={`state-badge ${event.type === 'Registrado' ? 'active' : 'revoked'}`}>{event.type}</span></div>
                <p>ID: <code>{event.id || 'No disponible'}</code></p>
                {event.wallet && <p>Wallet: {formatAddress(event.wallet)}</p>}
                <div className="history-actions">
                  {event.wallet && <button type="button" className="text-button" onClick={() => onCopy(event.wallet)}>Copiar wallet</button>}
                  <a href={`${ETHERSCAN_BASE_URL}/tx/${event.transactionHash}`} target="_blank" rel="noreferrer">Ver transacción ↗</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default CertificateHistory
