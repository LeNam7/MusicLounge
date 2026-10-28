import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import { Booking } from './types';

let cachedTransporter: Transporter | null = null;
let etherealAccount: { user: string; pass: string } | null = null;

/**
 * Returns an inline CID attachment descriptor for the Lùng Vài Tea brand logo.
 * Using CID attachments ensures the logo renders natively inside Gmail, Apple Mail, and Outlook
 * without requiring external hosting or being blocked by email image security policies.
 */
function getLogoAttachment() {
  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-lung-vai-square.png');
  return {
    filename: 'logo-lung-vai.png',
    path: logoPath,
    cid: 'lungvailogo',
  };
}

async function getMailTransporter(): Promise<{
  transporter: Transporter;
  isRealSmtp: boolean;
  fromAddress: string;
}> {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  // 1. If real SMTP (Gmail App Password or Custom SMTP) is configured
  if (smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_PORT || '465') === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/\s+/g, ''),
      },
    });

    return {
      transporter,
      isRealSmtp: true,
      fromAddress: `"LÙNG VÀI TEA" <${smtpUser}>`,
    };
  }

  // 2. Otherwise, use fast Ethereal test transporter with instant web preview
  if (!cachedTransporter) {
    if (!etherealAccount) {
      try {
        etherealAccount = await nodemailer.createTestAccount();
      } catch (err) {
        console.warn('[Email Engine] Ethereal account creation failed, fallback to dummy:', err);
        etherealAccount = { user: 'test@ethereal.email', pass: 'test' };
      }
    }

    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
  }

  return {
    transporter: cachedTransporter,
    isRealSmtp: false,
    fromAddress: '"LÙNG VÀI TEA" <booking@lungvaitea.vn>',
  };
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  isRealSmtp: boolean;
  recipient: string;
  error?: string;
}

/**
 * Sends a soothing, dignified HTML booking request notification email to the admin.
 * Uses Shan Tuyết deep tea green (#1A3B2B) and warm antique gold (#C5A869) for a serene,
 * luxurious, and soothing visual experience with zero aggressive red tones.
 */
export async function sendAdminBookingEmail(
  booking: Booking,
  targetEmail?: string
): Promise<SendEmailResult> {
  const adminEmail =
    targetEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'lenam287202@gmail.com';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const passcode = process.env.ADMIN_PASSCODE || 'serenity2026';
  const adminDirectUrl = `${appUrl}/admin?bookingId=${encodeURIComponent(
    booking.id
  )}&passcode=${encodeURIComponent(passcode)}`;
  const customerEmailHref = booking.customerEmail ? `mailto:${booking.customerEmail}` : `tel:${booking.customerPhone}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yêu cầu đặt phòng mới - Lùng Vài Tea</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A17;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 35px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 6px 24px rgba(27, 45, 36, 0.06);">
          
          <!-- Header Banner (Khoanh đỏ): Chỉ logo ở trước + tên quán LÙNG VÀI TEA, màu xanh trà cổ thụ dịu sang -->
          <tr>
            <td style="background-color: #1A3B2B; padding: 26px 20px; text-align: center; border-bottom: 2px solid #C5A869;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td valign="middle" style="padding-right: 14px;">
                    <img src="cid:lungvailogo" alt="Logo Lùng Vài Tea" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; outline: none; vertical-align: middle;" />
                  </td>
                  <td valign="middle">
                    <span style="font-family: Georgia, 'Cormorant Garamond', 'Times New Roman', serif; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase; vertical-align: middle; line-height: 1;">
                      LÙNG VÀI TEA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px 28px;">
              
              <!-- Subtle Ceremonial Ribbon -->
              <div style="text-align: center; margin-bottom: 18px;">
                <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                    <td style="padding: 0 14px; font-family: Georgia, serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8E703C; font-weight: 600;">
                      THÔNG BÁO QUẢN TRỊ VIÊN
                    </td>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                  </tr>
                </table>
              </div>

              <!-- Status Alert Box: Xanh ngọc dịu & thanh lịch -->
              <div style="background-color: #F3F7F4; border-left: 4px solid #1A3B2B; border: 1px solid #E2ECE5; border-left-width: 4px; padding: 16px 18px; margin-bottom: 24px; border-radius: 2px;">
                <p style="margin: 0; font-family: Georgia, serif; font-size: 15px; font-weight: bold; color: #1A3B2B;">
                  Có Yêu Cầu Đặt Phòng Mới Đang Chờ Xét Duyệt
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #4F5E55; line-height: 1.5;">
                  Mã tham chiếu đơn: <strong style="color: #1A3B2B; font-family: 'Courier New', Courier, monospace; font-size: 14px; letter-spacing: 1px;">${booking.bookingReference}</strong>
                </p>
              </div>

              <!-- Information Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #E8E2D8;">
                <tr style="background-color: #F8F6F2;">
                  <td colspan="2" style="padding: 10px 16px; border-bottom: 1px solid #E8E2D8; font-family: Georgia, serif; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #8E703C;">
                    CHI TIẾT ĐƠN ĐẶT PHÒNG
                  </td>
                </tr>
                <tr>
                  <td width="38%" style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Khách hàng:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1A3B2B; font-weight: bold; font-size: 14px;">${booking.customerName}</td>
                </tr>
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Số điện thoại:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1A3B2B; font-weight: bold; font-size: 14px; font-family: 'Courier New', monospace;">${booking.customerPhone}</td>
                </tr>
                ${booking.customerEmail ? `
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Địa chỉ Email:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17;">${booking.customerEmail}</td>
                </tr>` : ''}
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Không gian phòng:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17; font-weight: bold;">Phòng ${booking.roomName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Ngày & Giờ phục vụ:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17;">
                    <strong>${booking.date}</strong> &nbsp;(${booking.startTime} – ${booking.endTime}, ${booking.durationHours} giờ)
                  </td>
                </tr>
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Số lượng khách:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17;">${booking.guestCount} vị khách</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Danh trà lựa chọn:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17;">
                    ${booking.teaPackageName ? booking.teaPackageName : 'Thưởng trà tự do (Gọi trực tiếp tại phòng)'}
                  </td>
                </tr>
                ${booking.specialRequests ? `
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Ghi chú của khách:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #4F5E55; font-style: italic;">"${booking.specialRequests}"</td>
                </tr>` : ''}
                <tr style="background-color: #F8F6F2;">
                  <td style="padding: 14px 16px; color: #1F1A17; font-weight: bold;">Tổng chi phí dự tính:</td>
                  <td style="padding: 14px 16px; color: #1A3B2B; font-size: 16px; font-weight: bold;">
                    ${booking.totalPrice.toLocaleString('vi-VN')} đ 
                    <div style="font-size: 11px; font-weight: normal; color: #665F55; margin-top: 3px;">
                      Tiền cọc giữ phòng (30%): <strong style="color: #8E703C;">${booking.depositAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Administrative Action Controls: Màu xanh trà quý phái, không dùng đỏ -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${adminDirectUrl}" style="display: block; background-color: #1A3B2B; color: #FFFFFF; text-decoration: none; padding: 15px 25px; border-radius: 3px; font-family: Georgia, serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; border: 1px solid #C5A869; box-shadow: 0 4px 14px rgba(26, 59, 43, 0.22); margin-bottom: 14px;">
                  XÉT DUYỆT ĐƠN ĐẶT PHÒNG TRÊN HỆ THỐNG
                </a>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48%">
                      <a href="${customerEmailHref}" style="display: block; text-align: center; background-color: #2D4C3C; color: #FFFFFF; text-decoration: none; padding: 11px 15px; border-radius: 3px; font-size: 12px; font-weight: 500; border: 1px solid #C5A869;">
                        Phản hồi Email khách
                      </a>
                    </td>
                    <td width="4%"></td>
                    <td width="48%">
                      <a href="tel:${booking.customerPhone}" style="display: block; text-align: center; background-color: #F5EFE6; color: #1A3B2B; text-decoration: none; padding: 11px 15px; border-radius: 3px; font-size: 12px; font-weight: bold; border: 1px solid #D8CDBE;">
                        Gọi điện thoại khách
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F4EFEB; padding: 24px 20px; text-align: center; font-size: 12px; color: #665F55; border-top: 1px solid #E5DFD5;">
              <p style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #1A3B2B; letter-spacing: 1.5px;">
                LÙNG VÀI TEA
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #8E703C; text-transform: uppercase; letter-spacing: 1.5px;">
                Không Gian Trà Đạo &amp; Shan Tuyết Cổ Thụ
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                Tầng 6, Tòa nhà AZ Lâm Viên, Số 107 Nguyễn Phong Sắc, Cầu Giấy, Hà Nội
              </p>
              <p style="margin: 0; font-size: 12px;">
                Hotline: <strong style="color: #1A3B2B;">(+84) 989 92 92 69</strong> &nbsp;|&nbsp; Website: <strong>lungvaitea.vn</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { transporter, isRealSmtp, fromAddress } = await getMailTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to: adminEmail,
      subject: `[ĐƠN ĐẶT PHÒNG MỚI] Phòng ${booking.roomName} - ${booking.date} (${booking.startTime}) - ${booking.customerName}`,
      html: htmlContent,
      text: `[ĐƠN ĐẶT PHÒNG MỚI]\nMã đơn: ${booking.bookingReference}\nKhách hàng: ${booking.customerName} (${booking.customerPhone})\nPhòng: ${booking.roomName}\nThời gian: ${booking.date} lúc ${booking.startTime} - ${booking.endTime}\nTổng chi phí: ${booking.totalPrice} đ\n\nMở duyệt đơn: ${adminDirectUrl}`,
      attachments: [getLogoAttachment()],
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl ? String(previewUrl) : undefined,
      isRealSmtp,
      recipient: adminEmail,
    };
  } catch (err: unknown) {
    console.error('[Email Engine Error]:', err);
    return {
      success: false,
      recipient: adminEmail,
      isRealSmtp: false,
      error: err instanceof Error ? err.message : 'Lỗi gửi email',
    };
  }
}

/**
 * Sends a refined, soothing, dignified confirmation email to the customer when the booking is APPROVED.
 * Uses ancient Shan Tuyết tea jade green (#1A3B2B) and warm gold (#C5A869).
 */
export async function sendCustomerBookingConfirmationEmail(
  booking: Booking,
  targetEmail?: string
): Promise<SendEmailResult> {
  const customerEmail = targetEmail || booking.customerEmail;
  if (!customerEmail) {
    return {
      success: false,
      recipient: 'N/A',
      isRealSmtp: false,
      error: 'Khách hàng không có địa chỉ email.',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const lookupUrl = `${appUrl}/lookup?ref=${encodeURIComponent(booking.bookingReference)}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận lịch thưởng trà - Lùng Vài Tea</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A17;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 35px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 6px 24px rgba(27, 45, 36, 0.06);">
          
          <!-- Header Banner (Khoanh đỏ): Chỉ logo ở trước + tên quán LÙNG VÀI TEA, màu xanh trà cổ thụ dịu sang -->
          <tr>
            <td style="background-color: #1A3B2B; padding: 26px 20px; text-align: center; border-bottom: 2px solid #C5A869;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td valign="middle" style="padding-right: 14px;">
                    <img src="cid:lungvailogo" alt="Logo Lùng Vài Tea" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; outline: none; vertical-align: middle;" />
                  </td>
                  <td valign="middle">
                    <span style="font-family: Georgia, 'Cormorant Garamond', 'Times New Roman', serif; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase; vertical-align: middle; line-height: 1;">
                      LÙNG VÀI TEA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px 28px;">
              
              <!-- Subtle Ceremonial Ribbon -->
              <div style="text-align: center; margin-bottom: 14px;">
                <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                    <td style="padding: 0 14px; font-family: Georgia, serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8E703C; font-weight: 600;">
                      THƯ XÁC NHẬN ĐẶT PHÒNG
                    </td>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                  </tr>
                </table>
              </div>

              <!-- Salutation -->
              <h2 style="font-family: Georgia, 'Cormorant Garamond', serif; font-size: 21px; font-weight: normal; color: #1F1A17; margin: 8px 0 12px 0; text-align: center;">
                Kính gửi Quý khách <span style="font-weight: 600; color: #1A3B2B;">${booking.customerName}</span>,
              </h2>
              <p style="font-size: 14px; line-height: 1.7; color: #4F5E55; margin: 0 auto 22px auto; text-align: center; max-width: 500px;">
                Lùng Vài Tea trân trọng kính báo: Yêu cầu đặt phòng thưởng trà của Quý khách đã được hoàn tất phê duyệt thành công. Không gian phòng trà tĩnh tại cùng danh trà Shan Tuyết cổ thụ đã sẵn sàng cung nghinh Quý khách.
              </p>

              <!-- Booking Reference Certificate Card -->
              <div style="background-color: #F8F6F2; border: 1px solid #E5DFD5; border-top: 3px solid #1A3B2B; border-radius: 4px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
                <div style="font-family: Georgia, serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8E703C; margin-bottom: 5px;">
                  MÃ LỊCH HẸN THƯỞNG TRÀ
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #1A3B2B;">
                  ${booking.bookingReference}
                </div>
                <div style="font-size: 11px; color: #1A3B2B; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                  ● TRẠNG THÁI: ĐÃ XÁC NHẬN THÀNH CÔNG
                </div>
              </div>

              <!-- Information Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #E8E2D8;">
                <tr style="background-color: #F8F6F2;">
                  <td colspan="2" style="padding: 10px 16px; border-bottom: 1px solid #E8E2D8; font-family: Georgia, serif; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #8E703C;">
                    CHI TIẾT LỊCH HẸN
                  </td>
                </tr>
                <tr>
                  <td width="38%" style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Không gian phòng:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1A3B2B; font-weight: bold; font-size: 14px;">Phòng ${booking.roomName}</td>
                </tr>
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Ngày thưởng trà:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17; font-size: 14px;"><strong>${booking.date}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Khung giờ phục vụ:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17; font-size: 14px;">${booking.startTime} – ${booking.endTime} (${booking.durationHours} giờ)</td>
                </tr>
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Số lượng khách:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17;">${booking.guestCount} vị khách</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Danh trà lựa chọn:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17; font-size: 14px;">
                    ${booking.teaPackageName ? booking.teaPackageName : 'Thưởng trà tự do (Gọi trực tiếp tại phòng)'}
                  </td>
                </tr>
                ${booking.adminNotes ? `
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Lời nhắn từ Trà Quán:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1A3B2B; font-size: 13px; font-style: italic;">"${booking.adminNotes}"</td>
                </tr>` : ''}
                <tr style="background-color: #F8F6F2;">
                  <td style="padding: 14px 16px; color: #1F1A17; font-weight: bold;">Tổng chi phí dự tính:</td>
                  <td style="padding: 14px 16px; color: #1A3B2B; font-size: 16px; font-weight: bold;">
                    ${booking.totalPrice.toLocaleString('vi-VN')} đ 
                    <div style="font-size: 11px; font-weight: normal; color: #665F55; margin-top: 3px;">
                      Tiền cọc giữ phòng (30%): <strong style="color: #8E703C;">${booking.depositAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action Button: Màu xanh trà quý phái, không dùng đỏ -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${lookupUrl}" style="display: inline-block; background-color: #1A3B2B; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 3px; font-family: Georgia, serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; border: 1px solid #C5A869; box-shadow: 0 4px 14px rgba(26, 59, 43, 0.22);">
                  TRA CỨU LỊCH HẸN TRỰC TUYẾN
                </a>
              </div>

              <!-- Courtesy Notice -->
              <div style="margin: 22px 0 10px 0; padding: 14px 18px; background-color: #F8F6F2; border-left: 3px solid #C5A869; border: 1px solid #E8E2D8; border-left-width: 3px; font-size: 12px; line-height: 1.6; color: #665F55;">
                <strong style="color: #1A3B2B;">Lưu ý nghi thức thưởng trà:</strong> Kính mời Quý khách có mặt trước 10 phút để buổi thưởng trà được chuẩn bị chu đáo nhất. Mọi thay đổi lịch hẹn hoặc yêu cầu nghi thức riêng, xin vui lòng thông báo trước qua hotline <strong style="color: #1A3B2B;">(+84) 989 92 92 69</strong>.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F4EFEB; padding: 24px 20px; text-align: center; font-size: 12px; color: #665F55; border-top: 1px solid #E5DFD5;">
              <p style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #1A3B2B; letter-spacing: 1.5px;">
                LÙNG VÀI TEA
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #8E703C; text-transform: uppercase; letter-spacing: 1.5px;">
                Không Gian Trà Đạo &amp; Shan Tuyết Cổ Thụ
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                Tầng 6, Tòa nhà AZ Lâm Viên, Số 107 Nguyễn Phong Sắc, Cầu Giấy, Hà Nội
              </p>
              <p style="margin: 0; font-size: 12px;">
                Hotline: <strong style="color: #1A3B2B;">(+84) 989 92 92 69</strong> &nbsp;|&nbsp; Website: <strong>lungvaitea.vn</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { transporter, isRealSmtp, fromAddress } = await getMailTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: customerEmail,
      subject: `[XÁC NHẬN ĐẶT PHÒNG THÀNH CÔNG] Lùng Vài Tea - Phòng ${booking.roomName} (${booking.bookingReference})`,
      html: htmlContent,
      text: `[XÁC NHẬN ĐẶT PHÒNG THÀNH CÔNG]\nKính gửi Quý khách ${booking.customerName},\nLịch đặt phòng ${booking.roomName} ngày ${booking.date} (${booking.startTime} - ${booking.endTime}) tại Lùng Vài Tea đã được xác nhận thành công!\nMã đặt lịch: ${booking.bookingReference}\nTra cứu trực tuyến: ${lookupUrl}`,
      attachments: [getLogoAttachment()],
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl ? String(previewUrl) : undefined,
      isRealSmtp,
      recipient: customerEmail,
    };
  } catch (err: unknown) {
    console.error('[Customer Email Error]:', err);
    return {
      success: false,
      recipient: customerEmail,
      isRealSmtp: false,
      error: err instanceof Error ? err.message : 'Lỗi gửi email cho khách',
    };
  }
}

/**
 * Sends rejection notification email to customer with serene, respectful hospitality tone.
 * Color scheme: Soft slate charcoal (#36413C) and antique gold.
 */
export async function sendCustomerBookingRejectionEmail(
  booking: Booking,
  reason?: string,
  targetEmail?: string
): Promise<SendEmailResult> {
  const customerEmail = targetEmail || booking.customerEmail;
  if (!customerEmail) {
    return {
      success: false,
      recipient: 'N/A',
      isRealSmtp: false,
      error: 'Khách hàng không có địa chỉ email.',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const bookingUrl = `${appUrl}/booking`;
  const rejectionReason =
    reason ||
    booking.rejectionReason ||
    'Khung giờ quý khách lựa chọn hiện đã kín lịch phục vụ hoặc phòng đang bảo trì không gian.';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo về yêu cầu đặt phòng - Lùng Vài Tea</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A17;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 35px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 6px 24px rgba(27, 45, 36, 0.06);">
          
          <!-- Header Banner: Chỉ logo ở trước + tên quán LÙNG VÀI TEA, màu đá trầm dịu -->
          <tr>
            <td style="background-color: #36413C; padding: 26px 20px; text-align: center; border-bottom: 2px solid #C5A869;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td valign="middle" style="padding-right: 14px;">
                    <img src="cid:lungvailogo" alt="Logo Lùng Vài Tea" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; outline: none; vertical-align: middle;" />
                  </td>
                  <td valign="middle">
                    <span style="font-family: Georgia, 'Cormorant Garamond', 'Times New Roman', serif; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase; vertical-align: middle; line-height: 1;">
                      LÙNG VÀI TEA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px 28px;">
              <div style="text-align: center; margin-bottom: 14px;">
                <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                    <td style="padding: 0 14px; font-family: Georgia, serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8E703C; font-weight: 600;">
                      THÔNG BÁO VỀ YÊU CẦU ĐẶT PHÒNG
                    </td>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                  </tr>
                </table>
              </div>

              <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; color: #1F1A17; margin: 8px 0 12px 0; text-align: center;">
                Kính gửi Quý khách <span style="font-weight: 600; color: #36413C;">${booking.customerName}</span>,
              </h2>
              <p style="font-size: 14px; line-height: 1.7; color: #4F5E55; margin: 0 auto 18px auto; text-align: center; max-width: 500px;">
                Lùng Vài Tea rất tiếc phải thông báo yêu cầu đặt lịch mã <strong style="font-family: monospace; color: #1F1A17;">${booking.bookingReference}</strong> (ngày ${booking.date}, lúc ${booking.startTime}) chưa thể được chấp thuận vì lý do sau:
              </p>
              
              <div style="background-color: #F8F7F5; border-left: 3px solid #36413C; border: 1px solid #E8E2D8; border-left-width: 3px; padding: 14px 16px; margin: 18px 0; font-size: 13px; color: #36413C; line-height: 1.6;">
                <strong>Lý do từ Trà Quán:</strong> ${rejectionReason}
              </div>

              <p style="font-size: 13px; line-height: 1.7; color: #665F55; text-align: center; margin: 18px 0 24px 0;">
                Kính mong Quý khách lượng thứ vì sự bất tiện này. Quý khách có thể lựa chọn khung giờ hoặc không gian phòng khác, hoặc liên hệ trực tiếp hotline để được hỗ trợ chu đáo nhất.
              </p>

              <div style="text-align: center; margin: 24px 0 10px 0;">
                <a href="${bookingUrl}" style="display: inline-block; background-color: #36413C; color: #FFFFFF; text-decoration: none; padding: 13px 28px; border-radius: 3px; font-family: Georgia, serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; border: 1px solid #C5A869;">
                  CHỌN KHUNG GIỜ HOẶC PHÒNG KHÁC
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F4EFEB; padding: 24px 20px; text-align: center; font-size: 12px; color: #665F55; border-top: 1px solid #E5DFD5;">
              <p style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #1A3B2B; letter-spacing: 1.5px;">
                LÙNG VÀI TEA
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #8E703C; text-transform: uppercase; letter-spacing: 1.5px;">
                Không Gian Trà Đạo &amp; Shan Tuyết Cổ Thụ
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                Tầng 6, Tòa nhà AZ Lâm Viên, Số 107 Nguyễn Phong Sắc, Cầu Giấy, Hà Nội
              </p>
              <p style="margin: 0; font-size: 12px;">
                Hotline: <strong style="color: #1A3B2B;">(+84) 989 92 92 69</strong> &nbsp;|&nbsp; Website: <strong>lungvaitea.vn</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { transporter, isRealSmtp, fromAddress } = await getMailTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: customerEmail,
      subject: `[THÔNG BÁO LỊCH ĐẶT] Lùng Vài Tea - Yêu cầu đặt phòng ${booking.roomName} (${booking.bookingReference})`,
      html: htmlContent,
      text: `Kính gửi Quý khách ${booking.customerName},\nRất tiếc yêu cầu đặt lịch mã ${booking.bookingReference} tại Lùng Vài Tea chưa thể được chấp thuận.\nLý do: ${rejectionReason}\nVui lòng truy cập ${bookingUrl} để chọn khung giờ khác.`,
      attachments: [getLogoAttachment()],
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl ? String(previewUrl) : undefined,
      isRealSmtp,
      recipient: customerEmail,
    };
  } catch (err: unknown) {
    return {
      success: false,
      recipient: customerEmail,
      isRealSmtp: false,
      error: err instanceof Error ? err.message : 'Lỗi gửi email',
    };
  }
}

/**
 * Sends cancellation notification email to customer.
 */
export async function sendCustomerBookingCancellationEmail(
  booking: Booking,
  reason?: string,
  targetEmail?: string
): Promise<SendEmailResult> {
  const customerEmail = targetEmail || booking.customerEmail;
  if (!customerEmail) {
    return {
      success: false,
      recipient: 'N/A',
      isRealSmtp: false,
      error: 'Khách hàng không có địa chỉ email.',
    };
  }

  const cancellationReason =
    reason ||
    booking.cancellationReason ||
    'Lịch đặt đã được hủy theo yêu cầu của Quý khách hoặc điều chỉnh vận hành từ Trà Quán.';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo hủy lịch hẹn - Lùng Vài Tea</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A17;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F5F0; padding: 35px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E5DFD5; border-radius: 4px; overflow: hidden; box-shadow: 0 6px 24px rgba(27, 45, 36, 0.06);">
          
          <!-- Header Banner: Chỉ logo ở trước + tên quán LÙNG VÀI TEA, màu đá trầm dịu -->
          <tr>
            <td style="background-color: #333935; padding: 26px 20px; text-align: center; border-bottom: 2px solid #C5A869;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td valign="middle" style="padding-right: 14px;">
                    <img src="cid:lungvailogo" alt="Logo Lùng Vài Tea" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; outline: none; vertical-align: middle;" />
                  </td>
                  <td valign="middle">
                    <span style="font-family: Georgia, 'Cormorant Garamond', 'Times New Roman', serif; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase; vertical-align: middle; line-height: 1;">
                      LÙNG VÀI TEA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 30px 28px;">
              <div style="text-align: center; margin-bottom: 14px;">
                <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                    <td style="padding: 0 14px; font-family: Georgia, serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #8E703C; font-weight: 600;">
                      XÁC NHẬN HỦY LỊCH HẸN
                    </td>
                    <td style="border-bottom: 1px solid #D4BA7A; width: 32px;"></td>
                  </tr>
                </table>
              </div>

              <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; color: #1F1A17; margin: 8px 0 12px 0; text-align: center;">
                Kính gửi Quý khách <span style="font-weight: 600; color: #333935;">${booking.customerName}</span>,
              </h2>
              <p style="font-size: 14px; line-height: 1.7; color: #4F5E55; margin: 0 auto 18px auto; text-align: center; max-width: 500px;">
                Lùng Vài Tea xác nhận lịch hẹn mã <strong style="font-family: monospace; color: #1F1A17;">${booking.bookingReference}</strong> (ngày ${booking.date}, khung giờ ${booking.startTime} – ${booking.endTime}) đã được hủy.
              </p>

              <div style="background-color: #F8F7F5; border-left: 3px solid #665F55; border: 1px solid #E8E2D8; border-left-width: 3px; padding: 14px 16px; margin: 18px 0; font-size: 13px; color: #1F1A17; line-height: 1.6;">
                <strong>Lý do:</strong> ${cancellationReason}
              </div>

              <p style="font-size: 13px; line-height: 1.7; color: #665F55; text-align: center; margin: 18px 0 10px 0;">
                Chúng tôi rất tiếc vì sự bất tiện này. Quý khách vui lòng liên hệ hotline <strong style="color: #1A3B2B;">(+84) 989 92 92 69</strong> nếu cần hỗ trợ chính sách hoàn cọc hoặc đặt lại lịch hẹn phù hợp.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F4EFEB; padding: 24px 20px; text-align: center; font-size: 12px; color: #665F55; border-top: 1px solid #E5DFD5;">
              <p style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #1A3B2B; letter-spacing: 1.5px;">
                LÙNG VÀI TEA
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #8E703C; text-transform: uppercase; letter-spacing: 1.5px;">
                Không Gian Trà Đạo &amp; Shan Tuyết Cổ Thụ
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                Tầng 6, Tòa nhà AZ Lâm Viên, Số 107 Nguyễn Phong Sắc, Cầu Giấy, Hà Nội
              </p>
              <p style="margin: 0; font-size: 12px;">
                Hotline: <strong style="color: #1A3B2B;">(+84) 989 92 92 69</strong> &nbsp;|&nbsp; Website: <strong>lungvaitea.vn</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { transporter, isRealSmtp, fromAddress } = await getMailTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: customerEmail,
      subject: `[HỦY LỊCH HẸN] Lùng Vài Tea - Lịch hẹn phòng ${booking.roomName} (${booking.bookingReference})`,
      html: htmlContent,
      text: `Kính gửi Quý khách ${booking.customerName},\nLịch hẹn mã ${booking.bookingReference} tại Lùng Vài Tea đã được hủy.\nLý do: ${cancellationReason}\nLiên hệ hotline (+84) 989 92 92 69 để được hỗ trợ.`,
      attachments: [getLogoAttachment()],
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl ? String(previewUrl) : undefined,
      isRealSmtp,
      recipient: customerEmail,
    };
  } catch (err: unknown) {
    return {
      success: false,
      recipient: customerEmail,
      isRealSmtp: false,
      error: err instanceof Error ? err.message : 'Lỗi gửi email',
    };
  }
}
