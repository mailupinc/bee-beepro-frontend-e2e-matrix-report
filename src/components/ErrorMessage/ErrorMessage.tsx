'use client'

import styles from './ErrorMessage.module.scss'

type Props = { message: string }

const ErrorMessage = ({ message }: Props) => (
  <div className={styles.error}>
    <h2>⚠️ Error</h2>
    <p>{message}</p>
  </div>
)

export default ErrorMessage
