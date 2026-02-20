import { Injectable } from '@nestjs/common';

interface TemplateResult {
  subject: string;
  html: string;
}

@Injectable()
export class EmailTemplatesService {
  private wrapInLayout(content: string, lang: string): string {
    const direction = lang === 'ka' ? 'ltr' : 'ltr';
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>D Block Workspace</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#6C5CE7;padding:24px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">D BLOCK WORKSPACE</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f8fa;padding:24px 40px;text-align:center;border-top:1px solid #eaeaea;">
              <p style="margin:0;color:#999999;font-size:12px;line-height:18px;">
                ${lang === 'ka' ? 'D Block Workspace | Tbilisi, Georgia' : 'D Block Workspace | Tbilisi, Georgia'}
              </p>
              <p style="margin:8px 0 0;color:#bbbbbb;font-size:11px;">
                ${lang === 'ka' ? 'ეს ავტომატური შეტყობინებაა. გთხოვთ არ უპასუხოთ ამ ელფოსტას.' : 'This is an automated message. Please do not reply to this email.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  bookingConfirmation(
    data: {
      userName: string;
      resourceName: string;
      locationName: string;
      date: string;
      startTime: string;
      endTime: string;
      totalAmount?: number;
      currency?: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">დაჯავშნა დადასტურებულია</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          თქვენი ჯავშანი წარმატებით დადასტურდა.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>რესურსი:</strong> ${data.resourceName}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>ლოკაცია:</strong> ${data.locationName}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>თარიღი:</strong> ${data.date}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>დრო:</strong> ${data.startTime} - ${data.endTime}</p>
            ${data.totalAmount != null ? `<p style="margin:0;color:#333;font-size:14px;"><strong>თანხა:</strong> ${data.totalAmount} ${data.currency || 'GEL'}</p>` : ''}
          </td></tr>
        </table>`;
      return { subject: 'ჯავშანი დადასტურებულია — D Block Workspace', html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Booking Confirmed</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Your booking has been successfully confirmed.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Resource:</strong> ${data.resourceName}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Location:</strong> ${data.locationName}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Date:</strong> ${data.date}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          ${data.totalAmount != null ? `<p style="margin:0;color:#333;font-size:14px;"><strong>Amount:</strong> ${data.totalAmount} ${data.currency || 'GEL'}</p>` : ''}
        </td></tr>
      </table>`;
    return { subject: 'Booking Confirmed — D Block Workspace', html: this.wrapInLayout(content, lang) };
  }

  bookingReminder(
    data: {
      userName: string;
      resourceName: string;
      locationName: string;
      date: string;
      startTime: string;
      endTime: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">ჯავშნის შეხსენება</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          შეგახსენებთ თქვენი მომავალი ჯავშნის შესახებ.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>რესურსი:</strong> ${data.resourceName}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>ლოკაცია:</strong> ${data.locationName}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>თარიღი:</strong> ${data.date}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>დრო:</strong> ${data.startTime} - ${data.endTime}</p>
          </td></tr>
        </table>`;
      return { subject: 'ჯავშნის შეხსენება — D Block Workspace', html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Booking Reminder</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        This is a reminder about your upcoming booking.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Resource:</strong> ${data.resourceName}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Location:</strong> ${data.locationName}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Date:</strong> ${data.date}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
        </td></tr>
      </table>`;
    return { subject: 'Booking Reminder — D Block Workspace', html: this.wrapInLayout(content, lang) };
  }

  bookingCancellation(
    data: {
      userName: string;
      resourceName: string;
      locationName: string;
      date: string;
      reason?: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">ჯავშანი გაუქმებულია</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          თქვენი ჯავშანი გაუქმდა.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fff5f5;border-radius:8px;border-left:4px solid #e74c3c;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>რესურსი:</strong> ${data.resourceName}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>ლოკაცია:</strong> ${data.locationName}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>თარიღი:</strong> ${data.date}</p>
            ${data.reason ? `<p style="margin:0;color:#333;font-size:14px;"><strong>მიზეზი:</strong> ${data.reason}</p>` : ''}
          </td></tr>
        </table>`;
      return { subject: 'ჯავშანი გაუქმებულია — D Block Workspace', html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Booking Cancelled</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Your booking has been cancelled.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fff5f5;border-radius:8px;border-left:4px solid #e74c3c;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Resource:</strong> ${data.resourceName}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Location:</strong> ${data.locationName}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Date:</strong> ${data.date}</p>
          ${data.reason ? `<p style="margin:0;color:#333;font-size:14px;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </td></tr>
      </table>`;
    return { subject: 'Booking Cancelled — D Block Workspace', html: this.wrapInLayout(content, lang) };
  }

  paymentReceipt(
    data: {
      userName: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      invoiceNumber?: string;
      date: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">გადახდის ქვითარი</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          თქვენი გადახდა წარმატებით განხორციელდა.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0fff4;border-radius:8px;border-left:4px solid #27ae60;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>თანხა:</strong> ${data.amount} ${data.currency}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>გადახდის მეთოდი:</strong> ${data.paymentMethod}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>თარიღი:</strong> ${data.date}</p>
            ${data.invoiceNumber ? `<p style="margin:0;color:#333;font-size:14px;"><strong>ინვოისი:</strong> ${data.invoiceNumber}</p>` : ''}
          </td></tr>
        </table>`;
      return { subject: 'გადახდის ქვითარი — D Block Workspace', html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Payment Receipt</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Your payment has been processed successfully.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0fff4;border-radius:8px;border-left:4px solid #27ae60;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Date:</strong> ${data.date}</p>
          ${data.invoiceNumber ? `<p style="margin:0;color:#333;font-size:14px;"><strong>Invoice:</strong> ${data.invoiceNumber}</p>` : ''}
        </td></tr>
      </table>`;
    return { subject: 'Payment Receipt — D Block Workspace', html: this.wrapInLayout(content, lang) };
  }

  welcomeEmail(
    data: {
      userName: string;
      verificationUrl?: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">კეთილი იყოს თქვენი მობრძანება!</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          მოხარული ვართ, რომ შემოგვიერთდით D Block Workspace-ში! თქვენ ახლა გაქვთ წვდომა ჩვენს თანამედროვე სამუშაო სივრცეებზე.
        </p>
        ${data.verificationUrl ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
          <tr>
            <td style="background-color:#6C5CE7;border-radius:6px;text-align:center;">
              <a href="${data.verificationUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">ელფოსტის დადასტურება</a>
            </td>
          </tr>
        </table>` : ''}`;
      return { subject: 'კეთილი იყოს თქვენი მობრძანება D Block Workspace-ში!', html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Welcome!</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        We are thrilled to have you at D Block Workspace! You now have access to our modern coworking spaces.
      </p>
      ${data.verificationUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background-color:#6C5CE7;border-radius:6px;text-align:center;">
            <a href="${data.verificationUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Verify Email</a>
          </td>
        </tr>
      </table>` : ''}`;
    return { subject: 'Welcome to D Block Workspace!', html: this.wrapInLayout(content, lang) };
  }

  passwordReset(
    data: {
      userName: string;
      resetUrl: string;
      expiresIn?: string;
    },
    lang = 'en',
  ): TemplateResult {
    const expiry = data.expiresIn || (lang === 'ka' ? '1 საათი' : '1 hour');

    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">პაროლის აღდგენა</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          მივიღეთ მოთხოვნა თქვენი პაროლის აღდგენაზე. დააჭირეთ ქვემოთ მოცემულ ღილაკს ახალი პაროლის დასაყენებლად.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
          <tr>
            <td style="background-color:#6C5CE7;border-radius:6px;text-align:center;">
              <a href="${data.resetUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">პაროლის აღდგენა</a>
            </td>
          </tr>
        </table>
        <p style="color:#999999;font-size:13px;line-height:20px;margin:0;">
          ეს ბმული ვადაგასულია ${expiry}-ში. თუ თქვენ არ მოითხოვეთ პაროლის აღდგენა, უგულებელყოფეთ ეს შეტყობინება.
        </p>`;
      return { subject: 'პაროლის აღდგენა — D Block Workspace', html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Password Reset</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        We received a request to reset your password. Click the button below to set a new password.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background-color:#6C5CE7;border-radius:6px;text-align:center;">
            <a href="${data.resetUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Reset Password</a>
          </td>
        </tr>
      </table>
      <p style="color:#999999;font-size:13px;line-height:20px;margin:0;">
        This link expires in ${expiry}. If you did not request a password reset, please ignore this email.
      </p>`;
    return { subject: 'Password Reset — D Block Workspace', html: this.wrapInLayout(content, lang) };
  }

  invoiceEmail(
    data: {
      userName: string;
      companyName?: string;
      invoiceNumber: string;
      amount: number;
      currency: string;
      dueDate: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">ახალი ინვოისი</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          ${data.companyName ? `კომპანია ${data.companyName}-სთვის ` : ''}გამოწერილია ახალი ინვოისი.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>ინვოისი #:</strong> ${data.invoiceNumber}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>თანხა:</strong> ${data.amount} ${data.currency}</p>
            <p style="margin:0;color:#333;font-size:14px;"><strong>გადახდის ვადა:</strong> ${data.dueDate}</p>
          </td></tr>
        </table>`;
      return { subject: `ინვოისი ${data.invoiceNumber} — D Block Workspace`, html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">New Invoice</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        A new invoice has been generated${data.companyName ? ` for ${data.companyName}` : ''}.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p style="margin:0;color:#333;font-size:14px;"><strong>Due Date:</strong> ${data.dueDate}</p>
        </td></tr>
      </table>`;
    return { subject: `Invoice ${data.invoiceNumber} — D Block Workspace`, html: this.wrapInLayout(content, lang) };
  }

  visitorInvitation(
    data: {
      visitorName: string;
      hostName: string;
      locationName: string;
      locationAddress: string;
      date: string;
      time?: string;
      purpose?: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">მოწვევა D Block Workspace-ში</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.visitorName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          ${data.hostName} გიწვევთ D Block Workspace-ში ვიზიტზე.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>ლოკაცია:</strong> ${data.locationName}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>მისამართი:</strong> ${data.locationAddress}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>თარიღი:</strong> ${data.date}</p>
            ${data.time ? `<p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>დრო:</strong> ${data.time}</p>` : ''}
            ${data.purpose ? `<p style="margin:0;color:#333;font-size:14px;"><strong>მიზანი:</strong> ${data.purpose}</p>` : ''}
          </td></tr>
        </table>
        <p style="color:#555555;font-size:14px;line-height:22px;margin:0;">
          გთხოვთ, მიმართეთ რეცეფციას მისვლისას და წარადგინეთ პირადობის დამადასტურებელი დოკუმენტი.
        </p>`;
      return { subject: `მოწვევა D Block Workspace-ში — ${data.hostName}`, html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">You are Invited to D Block Workspace</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.visitorName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        ${data.hostName} has invited you to visit D Block Workspace.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Location:</strong> ${data.locationName}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Address:</strong> ${data.locationAddress}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Date:</strong> ${data.date}</p>
          ${data.time ? `<p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Time:</strong> ${data.time}</p>` : ''}
          ${data.purpose ? `<p style="margin:0;color:#333;font-size:14px;"><strong>Purpose:</strong> ${data.purpose}</p>` : ''}
        </td></tr>
      </table>
      <p style="color:#555555;font-size:14px;line-height:22px;margin:0;">
        Please visit the reception desk upon arrival and present a valid ID.
      </p>`;
    return { subject: `Invitation to D Block Workspace from ${data.hostName}`, html: this.wrapInLayout(content, lang) };
  }

  passExpiring(
    data: {
      userName: string;
      passType: string;
      expirationDate: string;
      renewUrl?: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">აბონემენტის ვადა იწურება</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა ${data.userName},
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          თქვენი ${data.passType} აბონემენტის ვადა იწურება ${data.expirationDate}-ს.
        </p>
        ${data.renewUrl ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
          <tr>
            <td style="background-color:#6C5CE7;border-radius:6px;text-align:center;">
              <a href="${data.renewUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">აბონემენტის განახლება</a>
            </td>
          </tr>
        </table>` : ''}`;
      return { subject: 'აბონემენტის ვადა იწურება — D Block Workspace', html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Your Pass is Expiring Soon</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hi ${data.userName},
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Your ${data.passType} pass is expiring on ${data.expirationDate}. Renew now to continue enjoying our workspace.
      </p>
      ${data.renewUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background-color:#6C5CE7;border-radius:6px;text-align:center;">
            <a href="${data.renewUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Renew Pass</a>
          </td>
        </tr>
      </table>` : ''}`;
    return { subject: 'Your Pass is Expiring Soon — D Block Workspace', html: this.wrapInLayout(content, lang) };
  }

  contractRenewal(
    data: {
      companyName: string;
      contractNumber: string;
      currentEndDate: string;
      newEndDate?: string;
    },
    lang = 'en',
  ): TemplateResult {
    if (lang === 'ka') {
      const content = `
        <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">კონტრაქტის განახლება</h2>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          გამარჯობა,
        </p>
        <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
          კომპანია ${data.companyName}-ის კონტრაქტის განახლების დროა.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>კონტრაქტი #:</strong> ${data.contractNumber}</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>მიმდინარე ვადა:</strong> ${data.currentEndDate}</p>
            ${data.newEndDate ? `<p style="margin:0;color:#333;font-size:14px;"><strong>ახალი ვადა:</strong> ${data.newEndDate}</p>` : ''}
          </td></tr>
        </table>`;
      return { subject: `კონტრაქტის განახლება ${data.contractNumber} — D Block Workspace`, html: this.wrapInLayout(content, lang) };
    }

    const content = `
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Contract Renewal</h2>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        Hello,
      </p>
      <p style="color:#555555;font-size:15px;line-height:24px;margin:0 0 24px;">
        It is time to renew the contract for ${data.companyName}.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f7ff;border-radius:8px;border-left:4px solid #6C5CE7;margin-bottom:24px;">
        <tr><td style="padding:20px;">
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Contract #:</strong> ${data.contractNumber}</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Current End Date:</strong> ${data.currentEndDate}</p>
          ${data.newEndDate ? `<p style="margin:0;color:#333;font-size:14px;"><strong>New End Date:</strong> ${data.newEndDate}</p>` : ''}
        </td></tr>
      </table>`;
    return { subject: `Contract Renewal ${data.contractNumber} — D Block Workspace`, html: this.wrapInLayout(content, lang) };
  }

  getAvailableTemplates(): string[] {
    return [
      'bookingConfirmation',
      'bookingReminder',
      'bookingCancellation',
      'paymentReceipt',
      'welcomeEmail',
      'passwordReset',
      'invoiceEmail',
      'visitorInvitation',
      'passExpiring',
      'contractRenewal',
    ];
  }
}
