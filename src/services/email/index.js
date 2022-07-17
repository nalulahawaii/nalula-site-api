import sgMail from '@sendgrid/mail'
import { newLogger } from 'services/logging'

if(process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const log = newLogger('Email Client')

export const sendEmail = ({ name, email, subject, textBody, htmlBody }) => {
  const msg = {
    from: 'Nalula <hello@nalula.com>',
    to: `${name} <${email}>`,
    subject,
    text: textBody,
    html: htmlBody,
  }
  try {
    return sgMail.send(msg)
  } catch (error) {
    log.error(error)
    if(error.response) {
      log.error(error.response.body)
    }
  }
}
