import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { emailSchema } from '@auth/schemes/password';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { BadRequestError } from '@global/helpers/error-handler';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import { forgotPasswordTemplate } from '@service/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@service/queues/email.queue';
import crypto from 'crypto';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByEmail(email);

    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCaracters: string = randomBytes.toString('hex');
    await authService.updatesPasswordToken(`${existingUser._id!}`, randomCaracters, Date.now() + 3600000);

    const resetLink = `${config.CLIENT_URL}/reset-password/${randomCaracters}`;
    const template: string = forgotPasswordTemplate.passwordResetTemplate(existingUser.username!, resetLink);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: email, subject: 'Reset your password' });
    res.status(HTTP_STATUS.OK).json({ message: 'Email sent successfully' });
  }
}
