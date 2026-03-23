import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [loading, setLoading] = useState(true)

  function normalizeStudentId(studentId = '') {
    return studentId.toLowerCase().replace(/\s+/g, '')
  }

  function buildLegacyEmail(studentId) {
    return `${normalizeStudentId(studentId)}@cvsu.ojt`
  }

  function resolveAuthEmail(input = '') {
    const cleaned = input.trim().toLowerCase()
    return cleaned.includes('@') ? cleaned : buildLegacyEmail(cleaned)
  }

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false)
      }

      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp({ password, fullName, studentId, email, program, courseCode, totalHours }) {
    const cleanedEmail = email?.trim().toLowerCase() || buildLegacyEmail(studentId)
    const { data, error } = await supabase.auth.signUp({
      email: cleanedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          student_id: studentId,
          email: cleanedEmail,
          program,
          course_code: courseCode,
          total_required_hours: totalHours,
        },
      },
    })
    if (error) throw error
    return data
  }

  async function signIn({ studentId, password }) {
    const email = resolveAuthEmail(studentId)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function sendPasswordReset(studentId) {
    const email = resolveAuthEmail(studentId)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
    return data
  }

  async function requestEmailChange(newEmail) {
    const cleanedEmail = newEmail.trim().toLowerCase()
    const { data, error } = await supabase.auth.updateUser({ email: cleanedEmail })
    if (error) throw error

    if (user?.id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: cleanedEmail })
        .eq('id', user.id)

      if (profileError && profileError.code !== '42703') {
        throw profileError
      }

      setProfile((prev) => (prev ? { ...prev, email: cleanedEmail } : prev))
    }

    return data
  }

  async function updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    return data
  }

  async function signOut() {
    setIsPasswordRecovery(false)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isPasswordRecovery,
      signUp,
      signIn,
      signOut,
      fetchProfile,
      sendPasswordReset,
      updatePassword,
      requestEmailChange,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
