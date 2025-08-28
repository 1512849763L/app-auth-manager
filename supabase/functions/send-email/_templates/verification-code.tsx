import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface VerificationCodeEmailProps {
  username: string
  verificationCode: string
}

export const VerificationCodeEmail = ({
  username,
  verificationCode,
}: VerificationCodeEmailProps) => (
  <Html>
    <Head />
    <Preview>您的邮箱验证码</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>邮箱验证码</Heading>
        <Text style={paragraph}>
          亲爱的 {username}，
        </Text>
        <Text style={paragraph}>
          您的邮箱验证码是：
        </Text>
        <Section style={codeContainer}>
          <Text style={code}>{verificationCode}</Text>
        </Section>
        <Text style={paragraph}>
          此验证码将在10分钟后过期。请尽快完成验证。
        </Text>
        <Text style={paragraph}>
          如果您没有请求此验证码，请忽略此邮件。
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

const codeContainer = {
  backgroundColor: '#f6f8fa',
  border: '2px solid #5469d4',
  borderRadius: '6px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '30px 0',
}

const code = {
  color: '#5469d4',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'monospace',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  margin: '20px 0 0 0',
}