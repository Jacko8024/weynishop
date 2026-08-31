package com.weynishop.app;

import android.app.Activity;
import android.os.CancellationSignal;
import android.util.Log;

import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

/**
 * Native Google Sign-In bridge — Android Credential Manager (current
 * official API, replaces the deprecated GoogleSignInClient).
 *
 * Shows Google's own account chooser: every Google account on the device
 * plus "Add another account". No account list is built by the app and no
 * password is ever seen by WeyniShop. No WebView / browser is involved —
 * the chooser sheet returns the credential straight into the app.
 *
 * The returned Google ID token is minted for the Firebase project's PUBLIC
 * web OAuth client (client_type 3 in google-services.json — the same client
 * the website uses). The JS layer exchanges it into a Firebase credential
 * via signInWithCredential(), then into a Firebase ID token which the
 * existing POST /auth/google endpoint verifies server-side. No secrets are
 * embedded in the APK (an OAuth client ID is a public identifier).
 *
 * ── SETUP REQUIREMENT (root cause of the old "Chrome opens" bug) ──
 * Credential Manager verifies the CALLING APP against Google Cloud:
 *   1. The Google Cloud/Firebase project must contain an ANDROID OAuth
 *      client for package "com.weynishop.app" with the SHA-1 of EVERY
 *      keystore used to sign the build (debug AND release).
 *      Firebase Console → Project settings → Your apps → Android app →
 *      "Add fingerprint" (get it with: cd android && .\gradlew.bat signingReport)
 *   2. That Android client must live in the SAME project as WEB_CLIENT_ID.
 * Without the SHA-1 fingerprint Google rejects the request (ApiException 10
 * / "Calling package not permitted" style errors). Historically those
 * errors triggered a fallback to signInWithRedirect inside the WebView,
 * which Google disallows (disallowed_user_agent) → Chrome → never returned.
 * The JS layer no longer has that fallback; errors are surfaced to the user
 * and logged loudly via logcat tag "WeyniGoogleAuth".
 */
@CapacitorPlugin(name = "GoogleAuth")
public class GoogleAuthPlugin extends Plugin {

    private static final String TAG = "WeyniGoogleAuth";

    // Fallback web OAuth client (client_type 3) of the Firebase project "weynishop".
    private static final String WEB_CLIENT_ID = "700988913337-fr311o2v828198entc788olphcesvsap.apps.googleusercontent.com";

    private String getServerClientId() {
        try {
            int resId = getContext().getResources().getIdentifier("default_web_client_id", "string", getContext().getPackageName());
            if (resId != 0) {
                String clientId = getContext().getString(resId);
                if (clientId != null && !clientId.trim().isEmpty()) {
                    return clientId.trim();
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not load default_web_client_id resource: " + e.getMessage());
        }
        return WEB_CLIENT_ID;
    }

    /**
     * Launch the native Google account chooser.
     * Resolves { idToken, displayName?, photoUrl? }.
     * Rejects with code CANCELLED | NO_CREDENTIALS | EMPTY_TOKEN | NATIVE_ERROR
     * (message includes the underlying exception class for diagnosis).
     */
    @PluginMethod
    public void signIn(final PluginCall call) {
        final Activity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            call.reject("Activity is not available", "NO_ACTIVITY");
            return;
        }

        // Credential Manager must be driven from the UI thread so the
        // account-chooser bottom sheet attaches to the activity correctly.
        activity.runOnUiThread(() -> {
            try {
                final CredentialManager credentialManager = CredentialManager.create(getContext());
                final String clientId = getServerClientId();
                Log.d(TAG, "Using server client ID: " + clientId);

                // filterByAuthorizedAccounts=false → show ALL device Google
                // accounts and the system "Add another account" entry.
                // autoSelectEnabled=false → always show the chooser sheet.
                GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setServerClientId(clientId)
                        .setAutoSelectEnabled(false)
                        .build();

                GetCredentialRequest request = new GetCredentialRequest.Builder()
                        .addCredentialOption(googleIdOption)
                        .build();

                final CancellationSignal signal = new CancellationSignal();

                credentialManager.getCredentialAsync(
                        activity,
                        request,
                        signal,
                        Runnable::run,
                        new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                            @Override
                            public void onResult(GetCredentialResponse response) {
                                Credential credential = response.getCredential();
                                if (credential == null || !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                                        .equals(credential.getType())) {
                                    Log.w(TAG, "No Google credential returned (type="
                                            + (credential != null ? credential.getType() : "null") + ")");
                                    call.reject("No Google credential returned", "NO_CREDENTIALS");
                                    return;
                                }
                                try {
                                    GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential
                                            .createFrom(credential.getData());
                                    String idToken = googleCredential.getIdToken();
                                    if (idToken == null || idToken.isEmpty()) {
                                        call.reject("Google returned an empty ID token", "EMPTY_TOKEN");
                                        return;
                                    }
                                    JSObject ret = new JSObject();
                                    ret.put("idToken", idToken);
                                    if (googleCredential.getDisplayName() != null) {
                                        ret.put("displayName", googleCredential.getDisplayName());
                                    }
                                    if (googleCredential.getProfilePictureUri() != null) {
                                        ret.put("photoUrl",
                                                googleCredential.getProfilePictureUri().toString());
                                    }
                                    call.resolve(ret);
                                } catch (Exception e) {
                                    Log.e(TAG, "Failed to parse Google credential", e);
                                    call.reject("Failed to parse Google credential: "
                                            + e.getMessage(), "PARSE_ERROR");
                                }
                            }

                            @Override
                            public void onError(GetCredentialException e) {
                                String code;
                                if (e instanceof GetCredentialCancellationException) {
                                    code = "CANCELLED"; // user dismissed the sheet — quiet cancel
                                } else if (e instanceof NoCredentialException) {
                                    code = "NO_CREDENTIALS";
                                } else {
                                    code = "NATIVE_ERROR";
                                }
                                // Loud log with the concrete exception type — this is
                                // where a missing SHA-1 / Android OAuth client shows up
                                // (e.g. ApiException 10 "Calling package not permitted").
                                Log.e(TAG, "Google credential flow failed: " + e.getClass().getName()
                                        + " — " + e.getMessage(), e);
                                call.reject(e.getClass().getSimpleName()
                                        + (e.getMessage() != null ? ": " + e.getMessage() : ""), code);
                            }
                        });
            } catch (Exception e) {
                Log.e(TAG, "Credential Manager could not start", e);
                call.reject("Native Google sign-in failed: " + e.getMessage(), "NATIVE_ERROR");
            }
        });
    }

    /**
     * Clear the native credential state so the NEXT sign-in shows the full
     * account chooser again (account switching after logout).
     */
    @PluginMethod
    public void signOut(final PluginCall call) {
        final Activity activity = getActivity();
        try {
            final CredentialManager credentialManager = CredentialManager.create(getContext());
            final ClearCredentialStateRequest request = new ClearCredentialStateRequest();
            if (activity == null) {
                call.resolve();
                return;
            }
            activity.runOnUiThread(() -> credentialManager.clearCredentialStateAsync(
                    request,
                    null,
                    Runnable::run,
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override
                        public void onResult(Void unused) {
                            call.resolve();
                        }

                        @Override
                        public void onError(ClearCredentialException e) {
                            call.resolve(); // best-effort — never block logout
                        }
                    }));
        } catch (Exception e) {
            call.resolve(); // best-effort — never block logout
        }
    }
}
