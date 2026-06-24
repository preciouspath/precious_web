/**
 * Premium Professional Email Templates for Smart Health
 * Modern design with comprehensive OTP elements, security features, and responsive layout
 */

const BASE_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
        margin: 0; 
        padding: 0; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; 
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
        color: #1e293b; 
        -webkit-font-smoothing: antialiased; 
        text-rendering: optimizeLegibility;
        line-height: 1.6;
    }
    .wrapper { 
        width: 100%; 
        table-layout: fixed; 
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
        padding: 40px 20px;
    }
    .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff; 
        border-radius: 16px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(226, 232, 240, 0.5);
    }
    
    /* Header Styles */
    .header { 
        background: linear-gradient(135deg, #5B3172 0%, #452458 100%); 
        padding: 48px 40px;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    .header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(100, 116, 255, 0.1) 0%, transparent 70%);
        border-radius: 50%;
    }
    .header-content {
        position: relative;
        z-index: 1;
    }
    .logo-text { 
        color: #ffffff; 
        font-size: 32px; 
        font-weight: 800; 
        letter-spacing: -0.8px; 
        margin: 0 0 8px 0;
        background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .tagline {
        color: #cbd5e1;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    
    /* Content Styles */
    .content { 
        padding: 48px 40px;
        background: #ffffff;
    }
    
    /* Icon Styles */
    .icon-wrapper {
        text-align: center;
        margin-bottom: 32px;
    }
    .icon-circle { 
        width: 80px; 
        height: 80px; 
        background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%);
        border-radius: 50%; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center;
        margin: 0 auto 24px auto;
        border: 2px solid #e0e7ff;
        font-size: 40px;
    }
    
    /* Typography */
    .title { 
        font-size: 28px; 
        font-weight: 800; 
        color: #0f172a; 
        margin: 0 0 16px 0;
        letter-spacing: -0.5px;
    }
    .subtitle { 
        font-size: 15px; 
        line-height: 1.7; 
        color: #64748b; 
        margin: 0 0 40px 0;
    }
    .greeting {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
    }
    
    /* OTP Container Styles */
    .otp-container { 
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 2px solid #e2e8f0;
        border-radius: 16px; 
        padding: 40px 32px;
        margin: 0 0 40px 0;
        text-align: center;
    }
    .otp-label { 
        font-size: 11px; 
        font-weight: 700; 
        color: #94a3b8; 
        text-transform: uppercase; 
        letter-spacing: 1.8px; 
        margin-bottom: 16px;
        display: block;
    }
    .otp-code { 
        font-family: 'SF Mono', Monaco, 'Fira Code', 'Courier New', monospace; 
        font-size: 52px; 
        font-weight: 900; 
        color: #0f172a;
        letter-spacing: 12px; 
        margin: 16px 0;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .otp-expires {
        font-size: 12px;
        color: #64748b;
        margin-top: 16px;
        font-weight: 500;
    }
    
    /* Info Box Styles */
    .info-box { 
        background-color: #fef3c7;
        border-left: 4px solid #f59e0b;
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 32px;
        text-align: left;
    }
    .info-box.warning {
        background-color: #fee2e2;
        border-left-color: #ef4444;
    }
    .info-box.success {
        background-color: #dcfce7;
        border-left-color: #22c55e;
    }
    .info-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: block;
        margin-bottom: 4px;
    }
    .info-text { 
        font-size: 13px; 
        margin: 0;
        line-height: 1.6;
    }
    .info-box.warning .info-label {
        color: #7c2d12;
    }
    .info-box.warning .info-text {
        color: #7c2d12;
    }
    .info-box .info-label {
        color: #92400e;
    }
    .info-box .info-text {
        color: #92400e;
    }
    
    /* Button Styles */
    .button-wrapper {
        text-align: center;
        margin: 40px 0;
    }
    .btn { 
        display: inline-block; 
        background: linear-gradient(135deg, #5B3172 0%, #452458 100%);
        color: #ffffff !important; 
        text-decoration: none; 
        padding: 16px 48px; 
        border-radius: 12px; 
        font-weight: 700; 
        font-size: 15px;
        box-shadow: 0 10px 15px -3px rgba(91, 49, 114, 0.3);
        transition: all 0.3s ease;
        border: none;
        cursor: pointer;
    }
    .btn:hover {
        box-shadow: 0 15px 25px -5px rgba(37, 99, 235, 0.4);
        transform: translateY(-2px);
    }
    
    /* Security Section */
    .security-section {
        background: #f8fafc;
        border-radius: 12px;
        padding: 24px;
        margin: 32px 0;
        border: 1px solid #e2e8f0;
    }
    .security-title {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
    }
    .security-title::before {
        content: '🔒';
        margin-right: 8px;
        font-size: 16px;
    }
    .security-items {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .security-items li {
        font-size: 13px;
        color: #475569;
        margin-bottom: 12px;
        padding-left: 24px;
        position: relative;
    }
    .security-items li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #22c55e;
        font-weight: bold;
    }
    .security-items li:last-child {
        margin-bottom: 0;
    }
    
    /* Support Section */
    .support-section {
        text-align: center;
        margin: 32px 0;
        padding: 24px 0;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
    }
    .support-label {
        font-size: 12px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
    }
    .support-link {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
    }
    .support-link:hover {
        text-decoration: underline;
    }
    
    /* Fallback Link */
    .fallback-section {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        margin: 32px 0;
        text-align: left;
    }
    .fallback-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
        font-weight: 600;
    }
    .fallback-link {
        font-size: 12px;
        color: #3b82f6;
        word-break: break-all;
        word-wrap: break-word;
        font-family: 'SF Mono', monospace;
        padding: 12px;
        background: #ffffff;
        border-radius: 8px;
        display: block;
        margin-top: 8px;
    }
    
    /* Footer */
    .footer { 
        padding: 40px;
        text-align: center;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
    }
    .divider { 
        height: 1px; 
        background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
        margin: 0 0 24px 0;
    }
    .footer-text { 
        font-size: 12px; 
        color: #94a3b8; 
        line-height: 1.8; 
        margin: 0 0 16px 0;
    }
    .company-info {
        font-size: 12px;
        color: #cbd5e1;
        margin: 8px 0;
    }
    .footer-links { 
        margin-top: 24px;
    }
    .footer-link { 
        color: #64748b; 
        text-decoration: none; 
        margin: 0 12px; 
        font-size: 12px; 
        font-weight: 600;
    }
    .footer-link:hover {
        color: #3b82f6;
        text-decoration: underline;
    }
    .footer-divider {
        color: #cbd5e1;
        margin: 0 4px;
    }
    
    /* Responsive Design */
    @media only screen and (max-width: 600px) {
        .wrapper { padding: 20px 0; }
        .container { 
            margin-top: 0; 
            border-radius: 0;
            border: none;
            box-shadow: none;
        }
        .header { padding: 32px 20px; }
        .content { padding: 32px 20px; }
        .footer { padding: 32px 20px; }
        .logo-text { font-size: 24px; }
        .title { font-size: 22px; }
        .otp-code { 
            font-size: 40px; 
            letter-spacing: 8px;
        }
        .otp-container { padding: 32px 24px; }
        .icon-circle { width: 64px; height: 64px; font-size: 32px; }
    }
    
    @media only screen and (max-width: 480px) {
        .content { padding: 24px 16px; }
        .footer { padding: 24px 16px; }
        .otp-code { 
            font-size: 32px; 
            letter-spacing: 6px;
        }
        .btn { padding: 14px 32px; font-size: 14px; }
    }
`;

/**
 * OTP Verification Email Template
 */
export const getOtpTemplate = (userName: string, otp: string, purpose: string = "verification"): string => {
    const displayPurpose = purpose.charAt(0).toUpperCase() + purpose.slice(1);
    const expiryTime = "10 minutes";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - OTP ${displayPurpose}</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">${displayPurpose === 'Verification' ? 'Verify Your Account' : displayPurpose}</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    We received a request to ${purpose} your Smart Health account. 
                    Use the secure code below to complete this process.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">🔐</div>
                </div>
                
                <!-- OTP Container -->
                <div class="otp-container">
                    <span class="otp-label">Your One-Time Password (OTP)</span>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-expires">Valid for ${expiryTime} from ${currentTime}</div>
                </div>
                
                <!-- Security Info -->
                <div class="info-box">
                    <span class="info-label">Important</span>
                    <p class="info-text">
                        Never share this code with anyone. Our team will never ask for your OTP.
                    </p>
                </div>
                
                <!-- Security Section -->
                <div class="security-section">
                    <div class="security-title">Security Best Practices</div>
                    <ul class="security-items">
                        <li>This code expires in ${expiryTime}</li>
                        <li>Each OTP can only be used once</li>
                        <li>This is a secure, encrypted transmission</li>
                        <li>If you didn't request this, secure your account immediately</li>
                    </ul>
                </div>
                
                <!-- Warning Box -->
                <div class="info-box warning">
                    <span class="info-label">⚠ Alert</span>
                    <p class="info-text">
                        If you did not initiate this request, please <a href="#" style="color: inherit; font-weight: 600; text-decoration: underline;">secure your account</a> immediately.
                    </p>
                </div>
                
                <!-- Support Section -->
                <div class="support-section">
                    <div class="support-label">Need Assistance?</div>
                    <p style="font-size: 14px; color: #64748b; margin: 8px 0;">
                        Contact our support team at <a href="mailto:support@smarthealth.com" class="support-link">support@smarthealth.com</a>
                    </p>
                </div>
                

            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <p class="company-info">
                    � support@smarthealth.com
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Terms of Service</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Unsubscribe</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Help Center</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Password Reset Email Template
 */
export const getResetLinkTemplate = (userName: string, resetLink: string, expiryMinutes: number = 15): string => {
    const expiryTime = new Date(Date.now() + expiryMinutes * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - Reset Password</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">Reset Your Password</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    We received a request to reset the password for your Smart Health account. 
                    Click the button below to create a new password and secure your account.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">🔑</div>
                </div>
                
                <!-- CTA Button -->
                <div class="button-wrapper">
                    <a href="${resetLink}" target="_blank" class="btn">Reset Password Now</a>
                </div>
                
                <!-- Info Box -->
                <div class="info-box">
                    <span class="info-label">Expiry Information</span>
                    <p class="info-text">
                        This secure reset link will expire in ${expiryMinutes} minutes (at ${expiryTime}). 
                        For security reasons, you'll need to request a new link if this one expires.
                    </p>
                </div>
                
                <!-- Security Section -->
                <div class="security-section">
                    <div class="security-title">Password Reset Guidelines</div>
                    <ul class="security-items">
                        <li>Use a strong, unique password (at least 8 characters)</li>
                        <li>Include uppercase, lowercase, numbers, and symbols</li>
                        <li>Never reuse your previous passwords</li>
                        <li>The reset link is one-time use only</li>
                    </ul>
                </div>
                
                <!-- Did Not Request -->
                <div class="info-box warning">
                    <span class="info-label">⚠ Didn't Request This?</span>
                    <p class="info-text">
                        If you didn't request a password reset, you can safely ignore this email. 
                        Your account password will remain unchanged. Your password is secure and hasn't been compromised.
                    </p>
                </div>
                

                
                <!-- Support Section -->
                <div class="support-section">
                    <div class="support-label">Need Help?</div>
                    <p style="font-size: 14px; color: #64748b; margin: 8px 0;">
                        Contact our support team at <a href="mailto:support@smarthealth.com" class="support-link">support@smarthealth.com</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <p class="company-info">
                    � support@smarthealth.com
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Terms of Service</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Unsubscribe</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Help Center</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Email Verification Confirmation Template
 */
export const getVerificationSuccessTemplate = (userName: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - Verification Successful</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">Account Verified ✓</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    Your Smart Health account has been successfully verified. 
                    You can now access all features and services on our platform.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">✅</div>
                </div>
                
                <!-- Success Box -->
                <div class="info-box success">
                    <span class="info-label">Success</span>
                    <p class="info-text">
                        Your account is now fully verified and ready to use. 
                        You have full access to all Smart Health features.
                    </p>
                </div>
                
                <!-- CTA Button -->
                <div class="button-wrapper">
                    <a href="#" target="_blank" class="btn">Go to Dashboard</a>
                </div>
                
                <!-- Next Steps -->
                <div class="security-section">
                    <div class="security-title">What's Next?</div>
                    <ul class="security-items">
                        <li>Complete your health profile for better recommendations</li>
                        <li>Connect your wearable devices for tracking</li>
                        <li>Schedule your first health consultation</li>
                        <li>Download the Smart Health mobile app</li>
                    </ul>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <p class="company-info">
                    � support@smarthealth.com
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Terms of Service</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Help Center</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Verification Rejected Template
 */
export const getVerificationRejectedTemplate = (userName: string, reason: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - Verification Status</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'},</p>
                
                <!-- Title -->
                <h1 class="title">Verification Update</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    Thank you for submitting your business documents. We have reviewed your application.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #ef4444;">✕</div>
                </div>
                
                <!-- Status Box -->
                <div class="info-box warning">
                    <span class="info-label">Application Status: Rejected</span>
                    <p class="info-text">
                        Unfortunately, we could not verify your business account at this time.
                    </p>
                </div>

                <!-- Reason Section -->
                <div class="security-section">
                    <div class="security-title">Reason for Rejection</div>
                    <p style="font-size: 14px; color: #475569; margin: 0;">
                        ${reason}
                    </p>
                </div>
                
                <!-- CTA Button -->
                <div class="button-wrapper">
                    <a href="#" target="_blank" class="btn">Update Documents</a>
                </div>

                <p style="font-size: 13px; color: #64748b; text-align: center;">
                    Please review the reason above and re-upload valid documents to proceed.
                </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <p class="company-info">
                     support@smarthealth.com
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Unauthorized Access Alert Template
 */
export const getUnauthorizedAccessTemplate = (userName: string, deviceInfo: string = "Unknown Device"): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - Security Alert</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">⚠️ Security Alert</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    We detected an unusual login attempt on your Smart Health account. 
                    This alert helps us keep your account secure.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">🚨</div>
                </div>
                
                <!-- Alert Details -->
                <div class="info-box warning">
                    <span class="info-label">Suspicious Activity Detected</span>
                    <p class="info-text">
                        <strong>Device:</strong> ${deviceInfo}<br>
                        <strong>Time:</strong> ${new Date().toLocaleString()}<br>
                        <strong>Status:</strong> Access Blocked for Security
                    </p>
                </div>
                
                <!-- Action Items -->
                <div class="security-section">
                    <div class="security-title">What You Should Do</div>
                    <ul class="security-items">
                        <li>If this was you, verify your identity to regain access</li>
                        <li>Change your password immediately</li>
                        <li>Review your recent account activity</li>
                        <li>Enable two-factor authentication for added security</li>
                    </ul>
                </div>
                
                <!-- CTA Button -->
                <div class="button-wrapper">
                    <a href="#" target="_blank" class="btn">Verify Identity Now</a>
                </div>
                
                <!-- Support -->
                <div class="support-section">
                    <div class="support-label">Need Help?</div>
                    <p style="font-size: 14px; color: #64748b; margin: 8px 0;">
                        Contact our security team: <a href="mailto:security@smarthealth.com" class="support-link">security@smarthealth.com</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Help Center</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Two-Factor Authentication (2FA) Code Template
 */
export const get2FATemplate = (userName: string, twoFactorCode: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - 2FA Code</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">Two-Factor Authentication</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    Your two-factor authentication code has been generated. 
                    Enter this code to complete your login securely.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">🔐</div>
                </div>
                
                <!-- 2FA Code Container -->
                <div class="otp-container">
                    <span class="otp-label">Your 2FA Code</span>
                    <div class="otp-code">${twoFactorCode}</div>
                    <div class="otp-expires">Valid for 5 minutes</div>
                </div>
                
                <!-- Security Info -->
                <div class="info-box">
                    <span class="info-label">Important</span>
                    <p class="info-text">
                        Two-factor authentication adds an extra layer of security to your account. 
                        Never share this code with anyone.
                    </p>
                </div>
                
                <!-- Security Features -->
                <div class="security-section">
                    <div class="security-title">2FA Security Features</div>
                    <ul class="security-items">
                        <li>Code expires in 5 minutes for your protection</li>
                        <li>Each code can only be used once</li>
                        <li>Protects against unauthorized access attempts</li>
                        <li>Your account is encrypted and secure</li>
                    </ul>
                </div>
                
                <!-- Alert Box -->
                <div class="info-box warning">
                    <span class="info-label">⚠ Important</span>
                    <p class="info-text">
                        If you did not attempt to log in, someone may be trying to access your account. 
                        Change your password immediately and <a href="#" style="color: inherit; font-weight: 600; text-decoration: underline;">review your security settings</a>.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <p class="company-info">
                    📧 support@smarthealth.com
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Terms of Service</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Help Center</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Account Disclosure Template
 */
export const getAccountDisclosureTemplate = (userName: string, message: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - Account Information</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">Account Disclosure</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    This is an automated notification regarding your Smart Health account status.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">ℹ️</div>
                </div>
                
                <!-- Info Box -->
                <div class="info-box warning">
                    <span class="info-label">Status Update</span>
                    <p class="info-text">
                        ${message}
                    </p>
                </div>
                
                <!-- Support Section -->
                <div class="support-section">
                    <div class="support-label">Need Help?</div>
                    <p style="font-size: 14px; color: #64748b; margin: 8px 0;">
                        If you have any questions, contact our support team at <a href="mailto:support@smarthealth.com" class="support-link">support@smarthealth.com</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <p class="company-info">
                    📧 support@smarthealth.com
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Terms of Service</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Help Center</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Account Deleted Template
 */
export const getAccountDeletedTemplate = (userName: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - Account Deleted</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">Account Deleted</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    Your Smart Health account has been successfully deleted from our system.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">🗑️</div>
                </div>
                
                <!-- Info Box -->
                <div class="info-box warning">
                    <span class="info-label">Action Taken</span>
                    <p class="info-text">
                        Your account and all associated data have been scheduled for permanent removal in accordance with our data retention policy.
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 32px;">
                    We're sorry to see you go. If you ever change your mind, you're always welcome back!
                </p>
                
                <!-- Support Section -->
                <div class="support-section">
                    <div class="support-label">Questions?</div>
                    <p style="font-size: 14px; color: #64748b; margin: 8px 0;">
                        If you didn't request this or have questions, contact us at <a href="mailto:support@smarthealth.com" class="support-link">support@smarthealth.com</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
                <p class="company-info">
                    📧 support@smarthealth.com
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Privacy Policy</a>
                    <span class="footer-divider">•</span>
                    <a href="#" class="footer-link">Terms of Service</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Temporary Password Email Template
 * Updated to show both OTP and Generated Password
 */
export const getTemporaryPasswordTemplate = (userName: string, temporaryPassword: string, otp: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>${BASE_STYLES}</style>
    <title>Smart Health - Temporary Password</title>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="logo-text">Smart Health</div>
                    <div class="tagline">Healthcare Management Platform</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <!-- Greeting -->
                <p class="greeting">Hello ${userName || 'User'}!</p>
                
                <!-- Title -->
                <h1 class="title">Password Reset</h1>
                
                <!-- Subtitle -->
                <p class="subtitle">
                    We received a request to reset your password. For your security and convenience, we have generated a temporary password and a verification code.
                </p>
                
                <!-- Icon -->
                <div class="icon-wrapper">
                    <div class="icon-circle">🔐</div>
                </div>
                
                <!-- Temporary Password Box -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #5B3172; border-radius: 16px; padding: 32px 24px; margin: 0 0 32px 0; text-align: center;">
                    <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.8px; margin-bottom: 12px; display: block;">Your Temporary Password</span>
                    <div style="font-family: 'SF Mono', Monaco, monospace; font-size: 32px; font-weight: 900; color: #5B3172; letter-spacing: 2px; margin: 8px 0; word-break: break-all;">${temporaryPassword}</div>
                    <p style="font-size: 13px; color: #64748b; margin-top: 12px; font-weight: 500;">Use this password to log in and then change it from your profile settings.</p>
                </div>

                <!-- OTP Container -->
                <div class="otp-container" style="padding: 24px;">
                    <span class="otp-label">Verification Code (OTP)</span>
                    <div class="otp-code" style="font-size: 32px; letter-spacing: 8px;">${otp}</div>
                </div>
                
                <!-- Info Box -->
                <div class="info-box warning">
                    <span class="info-label">Important</span>
                    <p class="info-text">
                        If you didn't request a password reset, please secure your account immediately or contact support. 
                    </p>
                </div>
                
                <!-- Support Section -->
                <div class="support-section">
                    <div class="support-label">Need Assistance?</div>
                    <p style="font-size: 14px; color: #64748b; margin: 8px 0;">
                        Contact our support team at <a href="mailto:support@smarthealth.com" class="support-link">support@smarthealth.com</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="divider"></div>
                <p class="footer-text">
                    © 2024 Smart Health Management. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};