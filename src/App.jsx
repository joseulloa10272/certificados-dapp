import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import CertificateHistory from './components/CertificateHistory'
import CertificateQuery from './components/CertificateQuery'
import CertificateRegistration from './components/CertificateRegistration'
import StatusMessage from './components/StatusMessage'
import WalletConnection from './components/WalletConnection'
import {
  createContract,
  getErrorMessage,
  normalizeCertificate,
  SEPOLIA_CHAIN_HEX,
  SEPOLIA_CHAIN_ID,
} from './utils/blockchain'
import './App.css'

const initialCertificate = { id: '', studentName: '', courseName: '', issueDate: '', studentWallet: '' }

function App() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(null)
  const [certificate, setCertificate] = useState(initialCertificate)
  const [queryId, setQueryId] = useState('')
  const [queryWallet, setQueryWallet] = useState('')
  const [foundCertificate, setFoundCertificate] = useState(null)
  const [events, setEvents] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isConsulting, setIsConsulting] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const showError = useCallback((error, fallback) => {
    setMessage({ type: 'error', text: getErrorMessage(error, fallback) })
  }, [])

  const loadHistory = useCallback(async (showErrors = true) => {
    setIsLoadingHistory(true)
    try {
      const contract = await createContract()
      const currentBlock = await contract.runner.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 50000)
      const [registered, revoked] = await Promise.all([
        contract.queryFilter(contract.filters.CertificadoRegistrado(), fromBlock),
        contract.queryFilter(contract.filters.CertificadoRevocado(), fromBlock),
      ])
      const normalizedEvents = [
        ...registered.map((event) => ({
          type: 'Registrado',
          id: event.args?.idCertificado ?? event.args?.[0],
          wallet: event.args?.walletEstudiante ?? event.args?.[1],
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          index: event.index,
        })),
        ...revoked.map((event) => ({
          type: 'Revocado',
          id: event.args?.idCertificado ?? event.args?.[0],
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          index: event.index,
        })),
      ].sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index)
      setEvents(normalizedEvents.slice(0, 25))
    } catch (error) {
      if (showErrors) showError(error, 'No se pudo cargar el historial de eventos.')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [showError])

  useEffect(() => {
    const ethereum = window.ethereum
    if (!ethereum) {
      setMessage({ type: 'error', text: 'MetaMask no está instalado. Instálalo para usar esta DApp.' })
      return undefined
    }

    const syncWallet = async () => {
      try {
        const [accounts, currentChainId] = await Promise.all([
          ethereum.request({ method: 'eth_accounts' }),
          ethereum.request({ method: 'eth_chainId' }),
        ])
        setAccount(accounts[0] || '')
        setChainId(Number(currentChainId))
        if (accounts[0] && Number(currentChainId) !== SEPOLIA_CHAIN_ID) {
          setMessage({ type: 'error', text: 'MetaMask está conectado, pero debes cambiar a la red Sepolia.' })
        }
      } catch (error) {
        showError(error, 'No se pudo detectar el estado de MetaMask.')
      }
    }
    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || '')
    const handleChainChanged = (value) => setChainId(Number(value))

    syncWallet()
    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [showError])

  useEffect(() => {
    if (account && chainId === SEPOLIA_CHAIN_ID) loadHistory(false)
  }, [account, chainId, loadHistory])

  const connectWallet = async () => {
    if (!window.ethereum) {
      setMessage({ type: 'error', text: 'MetaMask no está instalado. Instálalo para continuar.' })
      return
    }
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const currentChainId = Number(await window.ethereum.request({ method: 'eth_chainId' }))
      setAccount(accounts[0] || '')
      setChainId(currentChainId)
      setMessage(currentChainId === SEPOLIA_CHAIN_ID
        ? { type: 'success', text: 'MetaMask conectada automáticamente a Sepolia.' }
        : { type: 'error', text: 'Wallet conectada. Cambia la red de MetaMask a Sepolia.' })
    } catch (error) {
      showError(error, 'No se pudo conectar MetaMask.')
    } finally {
      setIsConnecting(false)
    }
  }

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_HEX }] })
      setMessage({ type: 'success', text: 'Red cambiada correctamente a Sepolia.' })
    } catch (error) {
      showError(error, 'No se pudo cambiar a la red Sepolia.')
    }
  }

  const registerCertificate = async (event) => {
    event.preventDefault()
    const values = Object.fromEntries(Object.entries(certificate).map(([key, value]) => [key, value.trim()]))
    if (Object.values(values).some((value) => !value)) {
      setMessage({ type: 'error', text: 'Completa todos los campos obligatorios antes de registrar.' })
      return
    }
    if (!ethers.isAddress(values.studentWallet)) {
      setMessage({ type: 'error', text: 'La wallet del estudiante no es una dirección válida.' })
      return
    }

    setIsRegistering(true)
    try {
      const contract = await createContract(true)
      if (await contract.existeCertificado(values.id)) throw new Error('Ya existe un certificado registrado con ese ID.')
      const transaction = await contract.registrarCertificado(values.id, values.studentName, values.courseName, values.issueDate, values.studentWallet)
      await transaction.wait()
      setCertificate(initialCertificate)
      setMessage({ type: 'success', text: 'Certificado registrado exitosamente en Sepolia.' })
      await loadHistory(false)
    } catch (error) {
      showError(error, 'No se pudo registrar el certificado.')
    } finally {
      setIsRegistering(false)
    }
  }

  const consultCertificate = async (event) => {
    event.preventDefault()
    const id = queryId.trim()
    const wallet = queryWallet.trim()
    if (!id) {
      setMessage({ type: 'error', text: 'Ingresa el ID obligatorio del certificado.' })
      return
    }
    if (wallet && !ethers.isAddress(wallet)) {
      setMessage({ type: 'error', text: 'La wallet para verificar no es una dirección válida.' })
      return
    }

    setIsConsulting(true)
    setFoundCertificate(null)
    try {
      const contract = await createContract()
      if (!(await contract.existeCertificado(id))) throw new Error('No existe un certificado con ese ID.')
      const data = await contract.consultarCertificado(id)
      const verified = wallet ? await contract.verificarCertificado(id, wallet) : null
      setFoundCertificate(normalizeCertificate(data, id, verified))
      setMessage({ type: 'success', text: 'Certificado consultado correctamente.' })
    } catch (error) {
      showError(error, 'No se pudo consultar el certificado.')
    } finally {
      setIsConsulting(false)
    }
  }

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address)
      setMessage({ type: 'success', text: 'Dirección copiada al portapapeles.' })
    } catch (error) {
      showError(error, 'No se pudo copiar la dirección.')
    }
  }

  return (
    <main className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Academia en línea · Sepolia</p>
          <h1>Certificados verificables, confianza transparente.</h1>
          <p className="hero-text">Registra, consulta y verifica credenciales académicas directamente en blockchain.</p>
        </div>
        <div className="hero-stat"><strong>100%</strong><span>Verificable on-chain</span></div>
      </header>

      <WalletConnection account={account} chainId={chainId} isConnecting={isConnecting} onConnect={connectWallet} onSwitchNetwork={switchToSepolia} />
      <StatusMessage message={message} />

      <section className="grid-layout">
        <CertificateRegistration certificate={certificate} isRegistering={isRegistering} onChange={({ target }) => setCertificate((current) => ({ ...current, [target.name]: target.value }))} onSubmit={registerCertificate} />
        <CertificateQuery queryId={queryId} queryWallet={queryWallet} foundCertificate={foundCertificate} isConsulting={isConsulting} onIdChange={(event) => setQueryId(event.target.value)} onWalletChange={(event) => setQueryWallet(event.target.value)} onSubmit={consultCertificate} onCopy={copyAddress} />
      </section>
      <CertificateHistory events={events} isLoading={isLoadingHistory} onRefresh={() => loadHistory(true)} onCopy={copyAddress} />
    </main>
  )
}

export default App
