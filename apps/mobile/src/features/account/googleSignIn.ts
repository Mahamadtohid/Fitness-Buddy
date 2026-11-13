import Constants from 'expo-constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type GoogleSignInResult = {
  idToken: string;
  email: string;
};

let configured = false;

function configureGoogleSignIn(): void {
  if (configured) return;

  const webClientId = (Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined)
    ?.googleWebClientId;

  if (!webClientId) {
    throw new Error('Google sign-in is not configured for this build.');
  }

  GoogleSignin.configure({
    webClientId,
    scopes: ['email', 'profile'],
  });
  configured = true;
}

/**
 * Resolves to `null` when the user backs out of the Google account picker. `signIn()` resolves
 * with `{ type: 'cancelled' }` instead of rejecting, so a cancellation has to be read off the
 * response — falling through to the token calls turned a deliberate dismissal into a raw native
 * error on screen.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult | null> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Google keeps the last chosen account for the app, so without this a second person on the
  // same device is signed straight back in as the first one after they log out of FitTrack.
  await GoogleSignin.signOut();

  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') {
    return null;
  }

  // The success response already carries both values. `getTokens()` was a second round trip for
  // the same token, and `getCurrentUser()` is synchronous (`User | null`), not a promise.
  const { idToken, user } = response.data;
  if (!idToken || !user.email) {
    throw new Error('Google did not return a valid identity token.');
  }

  return { idToken, email: user.email };
}
