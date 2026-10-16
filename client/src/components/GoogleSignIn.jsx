import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'

export default function GoogleSignIn({ onError }) {
  const { loginWithGoogle } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId) {
    return (
      <p className="muted google-missing">
        Google sign-in is not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in the client env.
      </p>
    )
  }

  return (
    <div className="google-btn-wrap">
      <GoogleLogin
        onSuccess={async (response) => {
          try {
            await loginWithGoogle(response.credential)
            show('Signed in with Google', 'success')
            navigate('/dashboard')
          } catch (err) {
            const message = err.message || 'Google sign-in failed'
            onError?.(message)
            show(message, 'error')
          }
        }}
        onError={() => {
          const message = 'Google sign-in was cancelled or failed'
          onError?.(message)
          show(message, 'error')
        }}
        useOneTap={false}
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  )
}
