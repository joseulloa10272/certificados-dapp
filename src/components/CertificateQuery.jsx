import CertificateResult from './CertificateResult'

function CertificateQuery({ queryId, queryWallet, foundCertificate, isConsulting, onIdChange, onWalletChange, onSubmit, onCopy }) {
  return (
    <section className="panel form-card" aria-labelledby="consult-title">
      <p className="section-kicker">Verificación</p>
      <h2 id="consult-title">Consultar certificado</h2>
      <p className="section-description">Busca un registro por ID y, opcionalmente, valida su wallet.</p>
      <form onSubmit={onSubmit} noValidate>
        <label>
          ID del certificado <span className="required">Obligatorio</span>
          <input type="text" placeholder="CERT-2026-001" value={queryId} onChange={onIdChange} required />
        </label>
        <label>
          Wallet para verificar <span className="optional">Opcional</span>
          <input type="text" placeholder="0x…" value={queryWallet} onChange={onWalletChange} />
        </label>
        <button type="submit" disabled={isConsulting}>{isConsulting ? 'Consultando…' : 'Consultar certificado'}</button>
      </form>
      {foundCertificate && <CertificateResult certificate={foundCertificate} onCopy={onCopy} />}
    </section>
  )
}

export default CertificateQuery
