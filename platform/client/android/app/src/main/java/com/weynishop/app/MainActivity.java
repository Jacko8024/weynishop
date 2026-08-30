package com.weynishop.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * WeyniShop main activity.
 *
 * Registers the isolated native Google Sign-In bridge (Credential Manager)
 * with the Capacitor bridge. All Google auth native code lives in
 * GoogleAuthPlugin.java — nothing else in the app touches Android auth.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
