function CertificateRegistration({ certificate, isRegistering, onChange, onSubmit }) {
  return (
    <section className="panel form-card" aria-labelledby="register-title">
      <p className="section-kicker">Emisión</p>
      <h2 id="register-title">Registrar certificado</h2>
      <p className="section-description">Completa los datos obligatorios y confirma la transacción.</p>
      <form onSubmit={onSubmit} noValidate>
        <label>
          ID del certificado <span className="required">Obligatorio</span>
          <input name="id" type="text" placeholder="CERT-2026-001" value={certificate.id} onChange={onChange} required />
        </label>
        <label>
          Nombre del estudiante <span className="required">Obligatorio</span>
          <input name="studentName" type="text" placeholder="Ada Lovelace" value={certificate.studentName} onChange={onChange} required />
        </label>
        <label>
          Nombre del curso <span className="required">Obligatorio</span>
          <input name="courseName" type="text" placeholder="Desarrollo Web3" value={certificate.courseName} onChange={onChange} required />
        </label>
        <label>
          Fecha de emisión <span className="required">Obligatorio</span>
          <input name="issueDate" type="date" value={certificate.issueDate} onChange={onChange} required />
        </label>
        <label>
          Wallet del estudiante <span className="required">Obligatorio</span>
          <input name="studentWallet" type="text" placeholder="0x…" value={certificate.studentWallet} onChange={onChange} required />
        </label>
        <button type="submit" disabled={isRegistering}>
          {isRegistering ? 'Registrando…' : 'Registrar certificado'}
        </button>
      </form>
    </section>
  )
}

export default CertificateRegistration
