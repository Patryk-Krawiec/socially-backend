import ejs from 'ejs';
import fs from 'fs';

class ForgotPasswordTemplate {
  public passwordResetTemplate(username: string, resetLink: string): string {
    return ejs.render(fs.readFileSync(__dirname + '/forgot-password-template.ejs', 'utf-8'), {
      username,
      resetLink,
      image_ulr:
        'https://e7.pngegg.com/pngimages/201/134/png-clipart-gray-lock-icon-password-computer-security-scalable-graphics-icon-unlocked-lock-s-noun-project-security-hacker.png'
    });
  }
}

export const forgotPasswordTemplate: ForgotPasswordTemplate = new ForgotPasswordTemplate();
