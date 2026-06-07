import { ethers } from 'ethers'
import certificadosAbi from '../abi/CertificadosAcademiaEnLinea.json'

export const SEPOLIA_CHAIN_ID = 11155111
export const SEPOLIA_CHAIN_HEX = '0xaa36a7'
export const ETHERSCAN_BASE_URL = 'https://sepolia.etherscan.io'
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || ''

export const formatAddress = (address) =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'No conectada'

export const getErrorMessage = (error, fallback) => {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    return 'Operación cancelada en MetaMask.'
  }

  return error?.shortMessage || error?.reason || error?.message || fallback
}

export const validateContractAddress = () => {
  if (!CONTRACT_ADDRESS || !ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error(
      'Configura una dirección de contrato válida en VITE_CONTRACT_ADDRESS.',
    )
  }
}

export const createContract = async (needsSigner = false) => {
  if (!window.ethereum) throw new Error('MetaMask no está instalado.')
  validateContractAddress()

  const provider = new ethers.BrowserProvider(window.ethereum)
  const network = await provider.getNetwork()
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    throw new Error('MetaMask debe estar conectado a la red Sepolia.')
  }

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    certificadosAbi,
    needsSigner ? await provider.getSigner() : provider,
  )
}

export const normalizeCertificate = (data, id, verified = null) => ({
  id,
  studentName: data.nombreEstudiante ?? data[0],
  courseName: data.nombreCurso ?? data[1],
  issueDate: data.fechaEmision ?? data[2],
  studentWallet: data.walletEstudiante ?? data[3],
  valid: data.valido ?? data[4],
  verified,
})
