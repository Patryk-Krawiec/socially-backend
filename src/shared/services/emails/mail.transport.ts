import { BadRequestError } from '@global/helpers/error-handler';
import { config } from '@root/config';
import sendGridMail from '@sendgrid/mail';
import Logger from 'bunyan';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const log: Logger = config.createLogger('mail.transport.ts');

sendGridMail.setApiKey(config.SENDGRID_API_KEY!);

class MailTransport {
  public async sendEmail(recieverEmail: string, subject: string, body: string): Promise<void> {
    if (config.NODE_ENV === 'test' || config.NODE_ENV === 'development') {
      await this.developmentEmailSender(recieverEmail, subject, body);
    } else {
      await this.productionEmailSender(recieverEmail, subject, body);
    }
  }

  private async developmentEmailSender(recieverEmail: string, subject: string, body: string): Promise<void> {
    const transporter: Mail = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: config.SENDER_EMAIL!,
        pass: config.SENDER_EMAIL_PASSWORD!
      }
    });

    const mailOptions: IMailOptions = {
      from: `Socially App <${config.SENDER_EMAIL!}>`,
      to: recieverEmail,
      subject,
      html: body
    };

    try {
      await transporter.sendMail(mailOptions);
      log.info('Development email sent successfully');
    } catch (err) {
      log.error('Error sending email: ', err);
      throw new BadRequestError('Error sending email');
    }
  }

  private async productionEmailSender(recieverEmail: string, subject: string, body: string): Promise<void> {
    const mailOptions: IMailOptions = {
      from: `Socially App <${config.SENDER_EMAIL!}>`,
      to: recieverEmail,
      subject,
      html: body
    };

    try {
      await sendGridMail.send(mailOptions);
      log.info('Production email sent successfully');
    } catch (err) {
      log.error('Error sending email: ', err);
      throw new BadRequestError('Error sending email');
    }
  }
}

export const mailTransport: MailTransport = new MailTransport();
