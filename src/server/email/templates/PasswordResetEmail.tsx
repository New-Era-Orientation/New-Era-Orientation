import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
}

export function PasswordResetEmail({ userName, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Đặt lại mật khẩu NEO Education</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={logo}>🎓 NEO Education</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={heading}>Đặt lại mật khẩu</Heading>
            
            <Text style={paragraph}>
              Xin chào <strong>{userName || 'bạn'}</strong>,
            </Text>
            
            <Text style={paragraph}>
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
              Click vào nút bên dưới để tạo mật khẩu mới.
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Đặt lại mật khẩu
              </Button>
            </Section>
            
            <Text style={paragraph}>
              Hoặc copy và paste link sau vào trình duyệt:
            </Text>
            
            <Text style={link}>
              <Link href={resetUrl} style={linkStyle}>
                {resetUrl}
              </Link>
            </Text>
            
            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ Link này sẽ hết hạn sau <strong>1 giờ</strong>.
              </Text>
              <Text style={warningText}>
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                Tài khoản của bạn vẫn an toàn.
              </Text>
            </Section>
            
            <Text style={paragraph}>
              Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 NEO Education. All rights reserved.
            </Text>
            <Text style={footerText}>
              Nền tảng học tập thông minh cho học sinh Việt Nam
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoSection = {
  padding: '32px 20px',
  backgroundColor: '#ef4444',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '32px 40px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 28px',
};

const link = {
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
  padding: '12px',
  marginBottom: '16px',
  wordBreak: 'break-all' as const,
};

const linkStyle = {
  color: '#ef4444',
  fontSize: '14px',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  border: '1px solid #f59e0b',
};

const warningText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '4px 0',
};

const footer = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
  paddingTop: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '4px 0',
};

export default PasswordResetEmail;
