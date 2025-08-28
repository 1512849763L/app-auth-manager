import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface CardExpiryEmailProps {
  username: string
  cardKey: string
  programName: string
  expiryDate: string
  daysLeft: number
}

export const CardExpiryEmail = ({
  username,
  cardKey,
  programName,
  expiryDate,
  daysLeft,
}: CardExpiryEmailProps) => (
  <Html>
    <Head />
    <Preview>您的卡密即将到期</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ 卡密到期提醒</Heading>
        <Text style={paragraph}>
          亲爱的 {username}，
        </Text>
        <Text style={paragraph}>
          您的卡密即将到期，请及时续费以避免服务中断。
        </Text>
        
        <Section style={cardInfo}>
          <Row>
            <Column style={labelColumn}>
              <Text style={label}>卡密:</Text>
            </Column>
            <Column>
              <Text style={value}>{cardKey}</Text>
            </Column>
          </Row>
          <Row>
            <Column style={labelColumn}>
              <Text style={label}>程序:</Text>
            </Column>
            <Column>
              <Text style={value}>{programName}</Text>
            </Column>
          </Row>
          <Row>
            <Column style={labelColumn}>
              <Text style={label}>到期时间:</Text>
            </Column>
            <Column>
              <Text style={value}>{expiryDate}</Text>
            </Column>
          </Row>
          <Row>
            <Column style={labelColumn}>
              <Text style={label}>剩余天数:</Text>
            </Column>
            <Column>
              <Text style={urgentValue}>{daysLeft} 天</Text>
            </Column>
          </Row>
        </Section>

        <Text style={paragraph}>
          {daysLeft <= 3 
            ? "⚠️ 紧急提醒：您的卡密将在3天内到期！" 
            : "请及时登录系统续费，避免服务中断。"
          }
        </Text>
        
        <Text style={footer}>
          如有疑问，请联系客服。<br />
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
  color: '#d73a49',
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

const cardInfo = {
  backgroundColor: '#f6f8fa',
  border: '1px solid #e1e4e8',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
}

const labelColumn = {
  width: '100px',
}

const label = {
  color: '#586069',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
}

const value = {
  color: '#333',
  fontSize: '14px',
  fontFamily: 'monospace',
  margin: '0',
}

const urgentValue = {
  color: '#d73a49',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  margin: '20px 0 0 0',
}