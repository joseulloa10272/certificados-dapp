function StatusMessage({ message }) {
  if (!message.text) return null

  return (
    <div className={`status ${message.type}`} role="status" aria-live="polite">
      <span aria-hidden="true">{message.type === 'success' ? '✓' : '!'}</span>
      <p>{message.text}</p>
    </div>
  )
}

export default StatusMessage
