import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { BadRequestError } from '@global/helpers/error-handler';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import { forgotPasswordTemplate } from '@service/emails/templates/forgot-password/forgot-password-template';
import { resetPasswordTemplate } from '@service/emails/templates/reset-password/reset-password-template';
import { emailQueue } from '@service/queues/email.queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import crypto from 'crypto';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import publicIP from 'ip';
import moment from 'moment';

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
    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent' });
  }

  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    const existingUser: IAuthDocument = await authService.getAuthUserByPasswordToken(token);

    if (!existingUser) {
      throw new BadRequestError('Reset token is invalid or has expired');
    }

    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;
    await existingUser.save();

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD/MM/YYYY HH:mm')
    };

    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob('forgotPasswordEmail', {
      template,
      receiverEmail: existingUser.email,
      subject: 'Password Reset Confirmation'
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated' });
  }
}
