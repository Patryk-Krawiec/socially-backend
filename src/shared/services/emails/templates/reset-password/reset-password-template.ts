import { IResetPasswordParams } from '@user/interfaces/user.interface';
import ejs from 'ejs';
import fs from 'fs';

class ResetPasswordTemplate {
  public passwordResetConfirmationTemplate(templateParams: IResetPasswordParams): string {
    const { username, email, ipaddress, date } = templateParams;
    return ejs.render(fs.readFileSync(__dirname + '/reset-password-template.ejs', 'utf-8'), {
      username,
      email,
      ipaddress,
      date,
      image_url:
        'https://e7.pngegg.com/pngimages/201/134/png-clipart-gray-lock-icon-password-computer-security-scalable-graphics-icon-unlocked-lock-s-noun-project-security-hacker.png'
    });
  }
}

export const resetPasswordTemplate: ResetPasswordTemplate = new ResetPasswordTemplate();
