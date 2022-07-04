import sgMail from '@sendgrid/mail'
import { newLogger } from 'src/services/logging'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const log = newLogger('Email Client')

export const sendEmail = ({ name, email, textBody, htmlBody }) => {
  const msg = {
    from: 'Nalula <hello@nalula.com>',
    to: `${name} <${email}>`,
    subject: 'A new property matches your saved search',
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


