import { useMemo, useState } from 'react'
import { ethers } from 'ethers'
import certificadosAbi from './abi/CertificadosAcademiaEnLinea.json'
import './App.css'

const CONTRACT_ADDRESS = 'PEGAR_DIRECCION_DEL_CONTRATO'

const initialCertificate = {
  id: '',
  studentName: '',
  courseName: '',
  issueDate: '',
  studentWallet: '',
}

function App() {
  const [account, setAccount] = useState('')
  const [certificate, setCertificate] = useState(initialCertificate)
  const [queryId, setQueryId] = useState('')
  const [queryWallet, setQueryWallet] = useState('')
  const [foundCertificate, setFoundCertificate] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isConsulting, setIsConsulting] = useState(false)

  const formattedAccount = useMemo(() => {
    if (!account) return 'No conectada'
    return `${account.slice(0, 6)}...${account.slice(-4)}`
  }, [account])

  const walletButtonText = useMemo(() => {
    if (isConnecting) return 'Conectando...'
    return account ? 'Reconectar wallet' : 'Conectar MetaMask'
  }, [account, isConnecting])

  const ensureMetaMask = () => {
    if (!window.ethereum) {
      setMessage({
        type: 'error',
        text: 'MetaMask no está instalado. Instálalo para usar esta DApp.',
      })
      return false
    }

    return true
  }

  const getContract = async (needsSigner = false) => {
    if (!ensureMetaMask()) return null

    if (CONTRACT_ADDRESS === 'PEGAR_DIRECCION_DEL_CONTRATO') {
      setMessage({
        type: 'error',
        text: 'Reemplaza CONTRACT_ADDRESS con la dirección del contrato desplegado.',
      })
      return null
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const runner = needsSigner ? await provider.getSigner() : provider
    return new ethers.Contract(CONTRACT_ADDRESS, certificadosAbi, runner)
  }

  const connectWallet = async () => {
    if (!ensureMetaMask()) return

    setIsConnecting(true)
    setMessage({ type: '', text: '' })

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      setAccount(accounts[0])
      setMessage({ type: 'success', text: 'Wallet conectada correctamente.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.shortMessage ||
          error?.message ||
          'No se pudo conectar MetaMask.',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCertificateChange = (event) => {
    const { name, value } = event.target
    setCertificate((current) => ({ ...current, [name]: value }))
  }

  const validateCertificateForm = () => {
    const hasEmptyFields = Object.values(certificate).some(
      (value) => value.trim() === '',
    )

    if (hasEmptyFields) {
      setMessage({
        type: 'error',
        text: 'Completa todos los campos antes de registrar el certificado.',
      })
      return false
    }

    if (!ethers.isAddress(certificate.studentWallet)) {
      setMessage({
        type: 'error',
        text: 'La wallet del estudiante no es una dirección válida.',
      })
      return false
    }

    return true
  }

  const registerCertificate = async (event) => {
    event.preventDefault()

    if (!validateCertificateForm()) return

    setIsRegistering(true)
    setMessage({ type: '', text: '' })

    try {
      const contract = await getContract(true)
      if (!contract) return

      const exists = await contract.existeCertificado(certificate.id.trim())
      if (exists) {
        setMessage({
          type: 'error',
          text: 'Ya existe un certificado registrado con ese ID.',
        })
        return
      }

      const transaction = await contract.registrarCertificado(
        certificate.id.trim(),
        certificate.studentName.trim(),
        certificate.courseName.trim(),
        certificate.issueDate,
        certificate.studentWallet.trim(),
      )
      await transaction.wait()

      setCertificate(initialCertificate)
      setMessage({
        type: 'success',
        text: 'Certificado registrado exitosamente en la blockchain.',
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.shortMessage ||
          error?.reason ||
          error?.message ||
          'No se pudo registrar el certificado.',
      })
    } finally {
      setIsRegistering(false)
    }
  }

  const normalizeCertificate = (data, id, verified) => ({
    id,
    studentName: data.nombreEstudiante ?? data[0],
    courseName: data.nombreCurso ?? data[1],
    issueDate: data.fechaEmision ?? data[2],
    studentWallet: data.walletEstudiante ?? data[3],
    valid: data.valido ?? data[4],
    verified,
  })

  const consultCertificate = async (event) => {
    event.preventDefault()

    const trimmedId = queryId.trim()

    if (!trimmedId) {
      setMessage({
        type: 'error',
        text: 'Ingresa el ID del certificado que deseas consultar.',
      })
      return
    }

    if (queryWallet.trim() && !ethers.isAddress(queryWallet.trim())) {
      setMessage({
        type: 'error',
        text: 'La wallet para verificar no es una dirección válida.',
      })
      return
    }

    setIsConsulting(true)
    setFoundCertificate(null)
    setMessage({ type: '', text: '' })

    try {
      const contract = await getContract()
      if (!contract) return

      const exists = await contract.existeCertificado(trimmedId)
      if (!exists) {
        setMessage({
          type: 'error',
          text: 'Certificado no existente. Revisa el ID ingresado.',
        })
        return
      }

      const data = await contract.consultarCertificado(trimmedId)
      const walletToVerify = queryWallet.trim() || data.walletEstudiante || data[3]
      const verified = await contract.verificarCertificado(trimmedId, walletToVerify)

      setFoundCertificate(normalizeCertificate(data, trimmedId, verified))
      setMessage({
        type: 'success',
        text: 'Certificado encontrado y consultado correctamente.',
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.shortMessage ||
          error?.reason ||
          error?.message ||
          'No se pudo consultar el certificado.',
      })
    } finally {
      setIsConsulting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Academia en línea · Blockchain</p>
        <h1>Certificados Académicos</h1>
        <p className="hero-text">
          Registra, consulta y verifica certificados emitidos por la academia
          usando MetaMask, ethers.js y el contrato CertificadosAcademiaEnLinea.
        </p>
      </section>

      <section className="panel wallet-panel" aria-labelledby="wallet-title">
        <div>
          <p className="section-kicker">Conexión</p>
          <h2 id="wallet-title">MetaMask</h2>
          <p className="muted">Wallet conectada: {formattedAccount}</p>
          {account && <code className="wallet-code">{account}</code>}
        </div>
        <button type="button" onClick={connectWallet} disabled={isConnecting}>
          {walletButtonText}
        </button>
      </section>

      {message.text && (
        <p className={`status ${message.type}`} role="status">
          {message.text}
        </p>
      )}

      <section className="grid-layout">
        <form className="panel form-card" onSubmit={registerCertificate}>
          <p className="section-kicker">Emisión</p>
          <h2>Registrar certificado</h2>

          <label>
            ID único del certificado
            <input
              name="id"
              type="text"
              placeholder="CERT-2026-001"
              value={certificate.id}
              onChange={handleCertificateChange}
            />
          </label>

          <label>
            Nombre del estudiante
            <input
              name="studentName"
              type="text"
              placeholder="María González"
              value={certificate.studentName}
              onChange={handleCertificateChange}
            />
          </label>

          <label>
            Nombre del curso
            <input
              name="courseName"
              type="text"
              placeholder="Desarrollo Web3 Académico"
              value={certificate.courseName}
              onChange={handleCertificateChange}
            />
          </label>

          <label>
            Fecha de emisión
            <input
              name="issueDate"
              type="date"
              value={certificate.issueDate}
              onChange={handleCertificateChange}
            />
          </label>

          <label>
            Wallet del estudiante
            <input
              name="studentWallet"
              type="text"
              placeholder="0x..."
              value={certificate.studentWallet}
              onChange={handleCertificateChange}
            />
          </label>

          <button type="submit" disabled={isRegistering}>
            {isRegistering ? 'Registrando...' : 'Registrar certificado'}
          </button>
        </form>

        <section className="panel form-card" aria-labelledby="consult-title">
          <p className="section-kicker">Consulta</p>
          <h2 id="consult-title">Consultar certificado</h2>
          <form onSubmit={consultCertificate} className="consult-form">
            <label>
              ID del certificado
              <input
                type="text"
                placeholder="CERT-2026-001"
                value={queryId}
                onChange={(event) => setQueryId(event.target.value)}
              />
            </label>

            <label>
              Wallet para verificar (opcional)
              <input
                type="text"
                placeholder="0x..."
                value={queryWallet}
                onChange={(event) => setQueryWallet(event.target.value)}
              />
            </label>

            <button type="submit" disabled={isConsulting}>
              {isConsulting ? 'Consultando...' : 'Consultar y verificar'}
            </button>
          </form>

          {foundCertificate && (
            <article className="certificate-result">
              <h3>Resultado del certificado</h3>
              <dl>
                <div>
                  <dt>ID</dt>
                  <dd>{foundCertificate.id}</dd>
                </div>
                <div>
                  <dt>Estudiante</dt>
                  <dd>{foundCertificate.studentName}</dd>
                </div>
                <div>
                  <dt>Curso</dt>
                  <dd>{foundCertificate.courseName}</dd>
                </div>
                <div>
                  <dt>Fecha</dt>
                  <dd>{foundCertificate.issueDate}</dd>
                </div>
                <div>
                  <dt>Wallet</dt>
                  <dd>{foundCertificate.studentWallet}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{foundCertificate.valid ? 'Válido' : 'No válido'}</dd>
                </div>
                <div>
                  <dt>Verificación</dt>
                  <dd>{foundCertificate.verified ? 'Coincide' : 'No coincide'}</dd>
                </div>
              </dl>
            </article>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
