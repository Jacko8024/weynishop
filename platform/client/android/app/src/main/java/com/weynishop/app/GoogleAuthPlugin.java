package com.weynishop.app;

import android.app.Activity;
import android.os.CancellationSignal;

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
 * password is ever seen by WeyniShop.
 *
 * The returned Google ID token is minted for the Firebase project's PUBLIC
 * web OAuth client (client_type 3 in google-services.json — the same client
 * the website uses). The JS layer exchanges it into a Firebase credential
 * via signInWithCredential(), then into a Firebase ID token which the
 * existing POST /auth/google endpoint verifies server-side. No secrets are
 * embedded in the APK (an OAuth client ID is a public identifier).
 *
 * Isolated native implementation (PART 7 of the spec): all Google/Android
 * auth code lives in this file; the web app only sees signIn()/signOut().
 */
@CapacitorPlugin(name = "GoogleAuth")
public class GoogleAuthPlugin extends Plugin {

    // Public web OAuth client (client_type 3) of the Firebase project
    // "weynishop". Public identifier — NOT a secret.
    private static final String WEB_CLIENT_ID = "700988913337-pjdm0g3m6p2rkmq8mesolck7e5ks1qnt.apps.googleusercontent.com";

    /**
     * Launch the native Google account chooser.
     * Resolves { idToken, displayName?, photoUrl? }.
     * Rejects with code CANCELLED | NO_CREDENTIALS | EMPTY_TOKEN | …
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

                // filterByAuthorizedAccounts=false → show ALL device Google
                // accounts and the system "Add another account" entry.
                // autoSelectEnabled=false → always show the chooser sheet.
                GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setServerClientId(WEB_CLIENT_ID)
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
                                    call.reject("Failed to parse Google credential: "
                                            + e.getMessage(), "PARSE_ERROR");
                                }
                            }

                            @Override
                            public void onError(GetCredentialException e) {
                                String code;
                                if (e instanceof GetCredentialCancellationException) {
                                    code = "CANCELLED";
                                } else if (e instanceof NoCredentialException) {
                                    code = "NO_CREDENTIALS";
                                } else {
                                    code = e.getClass().getSimpleName();
                                }
                                call.reject(e.getMessage() == null ? code : e.getMessage(), code);
                            }
                        });
            } catch (Exception e) {
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
