import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  username: string
  verificationUrl: string
}

export const WelcomeEmail = ({
  username,
  verificationUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>欢迎注册，请验证您的邮箱</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>欢迎注册！</Heading>
        <Text style={paragraph}>
          亲爱的 {username}，
        </Text>
        <Text style={paragraph}>
          感谢您注册我们的卡密管理系统！为了确保账户安全，请点击下方链接验证您的邮箱地址。
        </Text>
        <Section style={btnContainer}>
          <Link style={button} href={verificationUrl}>
            验证邮箱地址
          </Link>
        </Section>
        <Text style={paragraph}>
          如果按钮无法点击，请复制以下链接到浏览器：
        </Text>
        <Text style={link}>
          {verificationUrl}
        </Text>
        <Text style={paragraph}>
          此链接将在24小时后过期。如果您没有注册账户，请忽略此邮件。
        </Text>
        <Text style={footer}>
          祝好，<br />
          卡密管理系统团队
        </Text>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const paragraph = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
}

const btnContainer = {
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '20px 0',
}

const link = {
  color: '#5469d4',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  margin: '20px 0 0 0',
}