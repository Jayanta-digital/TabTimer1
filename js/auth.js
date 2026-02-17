// Authentication Module

/**
 * Sign up a new user
 */
async function signUp(email, password, userData) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (authError) throw authError;

    // Create user profile in users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        caregiver_id: userData.caregiver_id || null
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    // Create default settings
    await supabase
      .from('settings')
      .insert([{
        user_id: authData.user.id
      }]);

    // Store user data
    AuthUtils.setCurrentUser(profileData);
    AuthUtils.setAuthToken(authData.session.access_token);

    return { success: true, user: profileData };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign in existing user
 */
async function signIn(email, password) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    // Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) throw authError;

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Store user data
    AuthUtils.setCurrentUser(profileData);
    AuthUtils.setAuthToken(authData.session.access_token);

    return { success: true, user: profileData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign out current user
 */
async function signOut() {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local storage
    AuthUtils.logout();

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset password
 */
async function resetPassword(email) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth-reset.html`
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update password
 */
async function updatePassword(newPassword) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Password update error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current session
 */
async function getCurrentSession() {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * OAuth sign in with Google
 */
async function signInWithGoogle() {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app-caregiver.html`
      }
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { success: false, error: error.message };
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getCurrentSession,
    checkAuth,
    signInWithGoogle
  };
}
