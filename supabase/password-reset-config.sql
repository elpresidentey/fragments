-- Password Reset Configuration for Supabase
-- This file contains SQL configurations for password reset functionality

-- ============================================================================
-- 1. PASSWORD RESET EMAIL TEMPLATE CONFIGURATION
-- ============================================================================

-- Note: Email templates are configured through the Supabase Dashboard
-- Go to Authentication > Email Templates > Reset Password
-- Use the following template as a reference:

/*
Email Template Configuration (to be set in Supabase Dashboard):

Subject: Reset your password for Fragments

HTML Body:
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1DA1F2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1DA1F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You recently requested to reset your password for your Fragments account. Click the button below to reset it:</p>
            
            <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f3f4; padding: 10px; border-radius: 4px;">{{ .ConfirmationURL }}</p>
            
            <div class="security-notice">
                <strong>Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour for your security</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password won't change until you create a new one</li>
                </ul>
            </div>
            
            <p>If you're having trouble, please contact our support team.</p>
            <p>Thanks,<br>The Fragments Team</p>
        </div>
        <div class="footer">
            <p>This email was sent to {{ .Email }}. If you didn't request this, you can safely ignore it.</p>
        </div>
    </div>
</body>
</html>

Text Body:
Reset Your Password

Hello,

You recently requested to reset your password for your Fragments account.

Click this link to reset your password:
{{ .ConfirmationURL }}

Security Notice:
- This link will expire in 1 hour for your security
- If you didn't request this reset, please ignore this email
- Your password won't change until you create a new one

If you're having trouble, please contact our support team.

Thanks,
The Fragments Team

This email was sent to {{ .Email }}. If you didn't request this, you can safely ignore it.
*/

-- ============================================================================
-- 2. RESET TOKEN EXPIRATION SETTINGS
-- ============================================================================

-- Note: Token expiration is configured in Supabase Dashboard
-- Go to Authentication > Settings > Auth
-- Set the following values:

/*
JWT Expiry: 3600 (1 hour in seconds)
Refresh Token Rotation: Enabled
Session Timeout: 3600 (1 hour in seconds)
Password Reset Token Expiry: 3600 (1 hour in seconds)
*/

-- Create a function to validate token expiration
CREATE OR REPLACE FUNCTION validate_reset_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the token is older than 1 hour
    IF (EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) > 3600) THEN
        RAISE EXCEPTION 'Reset token has expired. Please request a new password reset.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. RATE LIMITING CONFIGURATION
-- ============================================================================

-- Create a table to track password reset requests for rate limiting
CREATE TABLE IF NOT EXISTS password_reset_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email_created 
ON password_reset_attempts(email, created_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_ip_created 
ON password_reset_attempts(ip_address, created_at);

-- Enable RLS on the password reset attempts table
ALTER TABLE password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for password reset attempts
CREATE POLICY "Users can view their own reset attempts" ON password_reset_attempts
    FOR SELECT USING (auth.email() = email);

-- Function to check rate limiting for password reset requests
CREATE OR REPLACE FUNCTION check_password_reset_rate_limit(
    user_email TEXT,
    client_ip INET DEFAULT NULL,
    max_attempts INTEGER DEFAULT 3,
    window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
    ip_attempt_count INTEGER;
BEGIN
    -- Check email-based rate limiting
    SELECT COUNT(*) INTO attempt_count
    FROM password_reset_attempts
    WHERE email = user_email
    AND created_at > NOW() - INTERVAL '1 minute' * window_minutes;
    
    -- Check IP-based rate limiting if IP is provided
    IF client_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO ip_attempt_count
        FROM password_reset_attempts
        WHERE ip_address = client_ip
        AND created_at > NOW() - INTERVAL '1 minute' * window_minutes;
        
        -- Return false if either email or IP exceeds limit
        IF attempt_count >= max_attempts OR ip_attempt_count >= (max_attempts * 2) THEN
            RETURN FALSE;
        END IF;
    ELSE
        -- Return false if email exceeds limit
        IF attempt_count >= max_attempts THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log password reset attempts
CREATE OR REPLACE FUNCTION log_password_reset_attempt(
    user_email TEXT,
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL,
    was_successful BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    attempt_id UUID;
BEGIN
    INSERT INTO password_reset_attempts (email, ip_address, user_agent, success)
    VALUES (user_email, client_ip, client_user_agent, was_successful)
    RETURNING id INTO attempt_id;
    
    RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old password reset attempts (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_password_reset_attempts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_attempts
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. SECURITY MONITORING AND LOGGING
-- ============================================================================

-- Create a table for security events related to password resets
CREATE TABLE IF NOT EXISTS password_reset_security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'request', 'success', 'failure', 'suspicious'
    email TEXT,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_password_reset_security_events_type_created 
ON password_reset_security_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_security_events_email_created 
ON password_reset_security_events(email, created_at);

-- Enable RLS on the security events table
ALTER TABLE password_reset_security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for security events (admin access only)
CREATE POLICY "Only service role can access security events" ON password_reset_security_events
    USING (auth.role() = 'service_role');

-- Function to log security events
CREATE OR REPLACE FUNCTION log_password_reset_security_event(
    event_type TEXT,
    user_email TEXT DEFAULT NULL,
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL,
    event_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO password_reset_security_events (event_type, email, ip_address, user_agent, details)
    VALUES (event_type, user_email, client_ip, client_user_agent, event_details)
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious password reset activity
CREATE OR REPLACE FUNCTION detect_suspicious_password_reset_activity(
    user_email TEXT DEFAULT NULL,
    client_ip INET DEFAULT NULL,
    time_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    email_attempts INTEGER := 0;
    ip_attempts INTEGER := 0;
    different_ips INTEGER := 0;
BEGIN
    -- Check for excessive attempts from same email
    IF user_email IS NOT NULL THEN
        SELECT COUNT(*) INTO email_attempts
        FROM password_reset_attempts
        WHERE email = user_email
        AND created_at > NOW() - INTERVAL '1 minute' * time_window_minutes;
        
        -- Check for attempts from multiple IPs for same email
        SELECT COUNT(DISTINCT ip_address) INTO different_ips
        FROM password_reset_attempts
        WHERE email = user_email
        AND created_at > NOW() - INTERVAL '1 minute' * time_window_minutes
        AND ip_address IS NOT NULL;
    END IF;
    
    -- Check for excessive attempts from same IP
    IF client_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO ip_attempts
        FROM password_reset_attempts
        WHERE ip_address = client_ip
        AND created_at > NOW() - INTERVAL '1 minute' * time_window_minutes;
    END IF;
    
    -- Determine if activity is suspicious
    IF email_attempts > 5 OR ip_attempts > 10 OR different_ips > 3 THEN
        -- Log suspicious activity
        PERFORM log_password_reset_security_event(
            'suspicious',
            user_email,
            client_ip,
            NULL,
            jsonb_build_object(
                'email_attempts', email_attempts,
                'ip_attempts', ip_attempts,
                'different_ips', different_ips,
                'time_window_minutes', time_window_minutes
            )
        );
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. SESSION INVALIDATION ON PASSWORD RESET
-- ============================================================================

-- Function to invalidate all user sessions when password is reset
CREATE OR REPLACE FUNCTION invalidate_user_sessions_on_password_reset()
RETURNS TRIGGER AS $$
BEGIN
    -- This function would be called after a successful password reset
    -- Note: Supabase handles session invalidation automatically when password changes
    -- This is here for additional logging and monitoring
    
    PERFORM log_password_reset_security_event(
        'password_changed',
        NEW.email,
        NULL,
        NULL,
        jsonb_build_object(
            'user_id', NEW.id,
            'sessions_invalidated', true,
            'timestamp', NOW()
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for password changes (if auth.users table is accessible)
-- Note: This may not work in all Supabase configurations due to auth schema restrictions
-- DROP TRIGGER IF EXISTS trigger_password_reset_session_invalidation ON auth.users;
-- CREATE TRIGGER trigger_password_reset_session_invalidation
--     AFTER UPDATE OF encrypted_password ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION invalidate_user_sessions_on_password_reset();

-- ============================================================================
-- 6. CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to perform regular cleanup of old data
CREATE OR REPLACE FUNCTION maintain_password_reset_tables()
RETURNS TEXT AS $$
DECLARE
    attempts_cleaned INTEGER;
    events_cleaned INTEGER;
    result_text TEXT;
BEGIN
    -- Clean up old password reset attempts (older than 24 hours)
    DELETE FROM password_reset_attempts
    WHERE created_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS attempts_cleaned = ROW_COUNT;
    
    -- Clean up old security events (older than 30 days)
    DELETE FROM password_reset_security_events
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS events_cleaned = ROW_COUNT;
    
    result_text := format('Cleaned up %s password reset attempts and %s security events', 
                         attempts_cleaned, events_cleaned);
    
    -- Log maintenance activity
    PERFORM log_password_reset_security_event(
        'maintenance',
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
            'attempts_cleaned', attempts_cleaned,
            'events_cleaned', events_cleaned,
            'timestamp', NOW()
        )
    );
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_password_reset_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_password_reset_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_password_reset_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_password_reset_security_event TO service_role;
GRANT EXECUTE ON FUNCTION maintain_password_reset_tables TO service_role;

-- ============================================================================
-- 7. INITIAL DATA AND TESTING
-- ============================================================================

-- Insert some test data for rate limiting validation (optional)
-- This can be used to test the rate limiting functionality
/*
INSERT INTO password_reset_attempts (email, ip_address, success) VALUES
('test@example.com', '192.168.1.1', false),
('test@example.com', '192.168.1.1', false),
('test@example.com', '192.168.1.1', true);
*/

-- Test the rate limiting function
-- SELECT check_password_reset_rate_limit('test@example.com', '192.168.1.1'::inet);

-- Test the suspicious activity detection
-- SELECT detect_suspicious_password_reset_activity('test@example.com', '192.168.1.1'::inet);

COMMENT ON TABLE password_reset_attempts IS 'Tracks password reset attempts for rate limiting and security monitoring';
COMMENT ON TABLE password_reset_security_events IS 'Logs security events related to password reset functionality';
COMMENT ON FUNCTION check_password_reset_rate_limit IS 'Checks if a password reset request should be allowed based on rate limiting rules';
COMMENT ON FUNCTION log_password_reset_attempt IS 'Logs a password reset attempt for rate limiting and security monitoring';
COMMENT ON FUNCTION detect_suspicious_password_reset_activity IS 'Detects suspicious patterns in password reset requests';
COMMENT ON FUNCTION log_password_reset_security_event IS 'Logs security events related to password reset functionality';
COMMENT ON FUNCTION maintain_password_reset_tables IS 'Performs regular cleanup of password reset related tables';