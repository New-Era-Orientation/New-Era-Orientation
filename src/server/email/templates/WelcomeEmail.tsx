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

interface WelcomeEmailProps {
  userName: string;
  loginUrl: string;
}

export function WelcomeEmail({ userName, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Chào mừng bạn đến với NEO Education!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Heading style={logo}>🎓 NEO Education</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={heading}>🎉 Chào mừng bạn!</Heading>
            
            <Text style={paragraph}>
              Xin chào <strong>{userName || 'bạn'}</strong>,
            </Text>
            
            <Text style={paragraph}>
              Cảm ơn bạn đã đăng ký tài khoản tại NEO Education! 
              Chúng tôi rất vui được đồng hành cùng bạn trên hành trình học tập.
            </Text>
            
            <Section style={featureBox}>
              <Heading as="h3" style={featureTitle}>
                Những gì bạn có thể làm:
              </Heading>
              <Text style={featureItem}>📝 Làm đề thi thử từ các tỉnh thành</Text>
              <Text style={featureItem}>📚 Học lý thuyết với nội dung được biên soạn kỹ lưỡng</Text>
              <Text style={featureItem}>🃏 Ôn tập với Flashcards thông minh</Text>
              <Text style={featureItem}>🤖 Hỏi đáp với AI Tutor 24/7</Text>
              <Text style={featureItem}>🏆 Chinh phục thành tựu và leo rank</Text>
            </Section>
            
            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Bắt đầu học ngay
              </Button>
            </Section>
            
            <Section style={tipBox}>
              <Text style={tipTitle}>💡 Mẹo học tập:</Text>
              <Text style={tipText}>
                Hãy duy trì streak hàng ngày để nhận thêm điểm thưởng và mở khóa thành tựu đặc biệt!
              </Text>
            </Section>
            
            <Text style={paragraph}>
              Nếu bạn cần hỗ trợ, đừng ngại liên hệ với chúng tôi.
              Chúc bạn học tập hiệu quả! 🚀
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 NEO Education. All rights reserved.
            </Text>
            <Text style={footerText}>
              Nền tảng học tập thông minh cho học sinh Việt Nam
            </Text>
            <Text style={socialLinks}>
              <Link href="#" style={socialLink}>Facebook</Link>
              {' • '}
              <Link href="#" style={socialLink}>Website</Link>
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
  backgroundColor: '#10b981',
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
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4b5563',
  marginBottom: '16px',
};

const featureBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #86efac',
};

const featureTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#166534',
  marginTop: '0',
  marginBottom: '16px',
};

const featureItem = {
  fontSize: '15px',
  color: '#166534',
  margin: '8px 0',
  paddingLeft: '8px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const tipBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const tipTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0 0 8px 0',
};

const tipText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
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

const socialLinks = {
  marginTop: '16px',
  fontSize: '12px',
};

const socialLink = {
  color: '#6b7280',
  textDecoration: 'underline',
};

export default WelcomeEmail;
