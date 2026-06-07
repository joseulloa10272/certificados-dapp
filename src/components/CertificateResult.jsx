import { ETHERSCAN_BASE_URL, formatAddress } from '../utils/blockchain'

function CertificateResult({ certificate, onCopy }) {
  return (
    <article className={`certificate-result ${certificate.valid ? 'active' : 'revoked'}`}>
      <div className="result-heading">
        <div>
          <p className="section-kicker">Resultado verificado</p>
          <h3>{certificate.courseName}</h3>
        </div>
        <span className={`state-badge ${certificate.valid ? 'active' : 'revoked'}`}>
          <span aria-hidden="true">{certificate.valid ? '✓' : '×'}</span>
          {certificate.valid ? 'Activo' : 'Revocado'}
        </span>
      </div>
      <dl>
        <div><dt>ID</dt><dd>{certificate.id}</dd></div>
        <div><dt>Estudiante</dt><dd>{certificate.studentName}</dd></div>
        <div><dt>Fecha</dt><dd>{certificate.issueDate}</dd></div>
        <div><dt>Wallet</dt><dd>{formatAddress(certificate.studentWallet)}</dd></div>
        {certificate.verified !== null && (
          <div><dt>Coincidencia</dt><dd>{certificate.verified ? 'La wallet coincide' : 'La wallet no coincide'}</dd></div>
        )}
      </dl>
      <div className="result-actions">
        <button type="button" className="text-button" onClick={() => onCopy(certificate.studentWallet)}>Copiar wallet</button>
        <a href={`${ETHERSCAN_BASE_URL}/address/${certificate.studentWallet}`} target="_blank" rel="noreferrer">Ver en Etherscan ↗</a>
      </div>
    </article>
  )
}

export default CertificateResult
