import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

export function VerificationEmail({ userName, verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Xác thực email của bạn tại NEO Education</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={logo}>🎓 NEO Education</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={heading}>Xác thực email của bạn</Heading>
            
            <Text style={paragraph}>
              Xin chào <strong>{userName || 'bạn'}</strong>,
            </Text>
            
            <Text style={paragraph}>
              Cảm ơn bạn đã đăng ký tài khoản tại NEO Education. 
              Vui lòng click vào nút bên dưới để xác thực email của bạn.
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Xác thực email
              </Button>
            </Section>
            
            <Text style={paragraph}>
              Hoặc copy và paste link sau vào trình duyệt:
            </Text>
            
            <Text style={link}>
              <Link href={verificationUrl} style={linkStyle}>
                {verificationUrl}
              </Link>
            </Text>
            
            <Text style={paragraph}>
              Link này sẽ hết hạn sau <strong>24 giờ</strong>.
            </Text>
            
            <Text style={paragraph}>
              Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
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
  backgroundColor: '#3b82f6',
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
  backgroundColor: '#3b82f6',
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
  color: '#3b82f6',
  fontSize: '14px',
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

export default VerificationEmail;
