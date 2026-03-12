# FacilityPro Email Templates

These HTML files are static, email-safe templates intended for backend delivery.

## Templates
- `facilitypro-transactional.html` - General purpose notifications.
- `facilitypro-verify-email.html` - User or organization email verification.
- `facilitypro-password-reset.html` - Password reset flow.
- `facilitypro-invite.html` - Team invitation flow.

## Usage
1. Load the template file from `public/email-templates/`.
2. Replace `{{placeholders}}` with dynamic values from your backend.
3. Send with your email provider (SES, SendGrid, Postmark, etc).

## Placeholder Notes
- All templates share `{{recipient_name}}`, `{{org_name}}`, `{{support_email}}`, and `{{year}}`.
- URLs must be fully qualified (https).
