package in.smartindiawork.app;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1042;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                },
                LOCATION_PERMISSION_REQUEST_CODE
            );
        }

        if (this.bridge != null) {
            this.bridge.setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri uri = request != null ? request.getUrl() : null;
                    if (handleExternalPaymentOrUtilityUri(uri)) {
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    Uri uri = url != null ? Uri.parse(url) : null;
                    if (handleExternalPaymentOrUtilityUri(uri)) {
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }
            });
        }
    }

    private boolean handleExternalPaymentOrUtilityUri(Uri uri) {
        if (uri == null || uri.getScheme() == null) {
            return false;
        }

        String scheme = uri.getScheme().toLowerCase();
        boolean isUpiScheme =
            scheme.equals("upi") ||
            scheme.equals("tez") ||
            scheme.equals("phonepe") ||
            scheme.equals("paytmmp") ||
            scheme.equals("paytm") ||
            scheme.equals("bhim") ||
            scheme.equals("credpay");

        if (isUpiScheme) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                if (scheme.equals("upi")) {
                    Intent chooser = Intent.createChooser(intent, "Smart India Work - UPI ऐप चुनें");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(chooser);
                } else {
                    startActivity(intent);
                }
                return true;
            } catch (ActivityNotFoundException specificNotFound) {
                // App-specific scheme not installed -> fallback to generic Bharat UPI chooser
                try {
                    String rawQuery = uri.getEncodedQuery();
                    if (rawQuery != null && !rawQuery.isEmpty()) {
                        Uri genericUpi = Uri.parse("upi://pay?" + rawQuery);
                        Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, genericUpi);
                        fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        Intent chooser = Intent.createChooser(fallbackIntent, "Smart India Work - UPI ऐप चुनें");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(chooser);
                        return true;
                    }
                } catch (ActivityNotFoundException ignored) {
                    // Fall through to helpful toast below
                }
                Toast.makeText(
                    this,
                    "फोन में कोई UPI ऐप नहीं मिला — कृपया QR स्कैन या UPI ID कॉपी करके भेजें।",
                    Toast.LENGTH_LONG
                ).show();
                return true;
            } catch (Exception ignored) {
                return true;
            }
        }

        if (scheme.equals("tel") || scheme.equals("mailto")) {
            try {
                String action = scheme.equals("tel") ? Intent.ACTION_DIAL : Intent.ACTION_VIEW;
                Intent utilityIntent = new Intent(action, uri);
                utilityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(utilityIntent);
                return true;
            } catch (Exception ignored) {
                return true;
            }
        }

        return false;
    }
}
