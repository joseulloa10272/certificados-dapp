# Certificados DApp

Frontend React para registrar y verificar certificados académicos en un contrato desplegado en la red Sepolia.

## Configuración

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env`.
3. Reemplaza `VITE_CONTRACT_ADDRESS` con la dirección del contrato `CertificadosAcademiaEnLinea` desplegado en Sepolia.
4. Inicia el proyecto con `npm run dev`.

La aplicación detecta automáticamente una sesión activa de MetaMask, valida que esté conectada a Sepolia y permite solicitar el cambio de red. El historial consulta los últimos 50.000 bloques y muestra hasta 25 eventos recientes `CertificadoRegistrado` y `CertificadoRevocado`.

## Comandos

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera la aplicación de producción.
- `npm run lint`: ejecuta ESLint.
