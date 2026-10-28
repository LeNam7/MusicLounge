import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  const artifactDir = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\4da2d9b8-2125-460b-a234-43a530cc0193';
  const logoBase64 = fs.readFileSync('public/images/logo-lung-vai-square.png').toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  // Accurate booking data for user Lê Nam
  const booking = {
    id: 'bk-nam-demo',
    bookingReference: 'LVT-20261105-89DE',
    roomId: 'room-2',
    roomName: 'Nguyệt Các',
    customerName: 'Lê Nam',
    customerPhone: '0382371269',
    customerEmail: 'lenam287202@gmail.com',
    date: '2026-11-05',
    startTime: '15:00',
    endTime: '17:00',
    durationHours: 2,
    guestCount: 4,
    teaPackageName: 'Trà Shan Tuyết Cổ Thụ & Điểm Tâm Trà Đạo',
    totalPrice: 1250000,
    depositAmount: 375000,
    adminNotes: 'Lùng Vài Tea đã chuẩn bị sẵn bàn trà ấm nồng và ấm tử sa Nghi Hưng cung nghinh Quý khách!',
    specialRequests: 'Đặt phòng trà tiếp đón tri kỷ',
  };

  // Generate Admin HTML with SOOTHING GREEN PALETTE (#1A3B2B)
  const adminHtml = `
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
                    <img src="${logoDataUri}" alt="Logo Lùng Vài Tea" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; outline: none; vertical-align: middle;" />
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
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Địa chỉ Email:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17;">${booking.customerEmail}</td>
                </tr>
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
                    ${booking.teaPackageName}
                  </td>
                </tr>
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Ghi chú của khách:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #4F5E55; font-style: italic;">"${booking.specialRequests}"</td>
                </tr>
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

              <!-- Administrative Action Controls: Xanh trà quý phái & vàng đồng dịu -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="#" style="display: block; background-color: #1A3B2B; color: #FFFFFF; text-decoration: none; padding: 15px 25px; border-radius: 3px; font-family: Georgia, serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; border: 1px solid #C5A869; box-shadow: 0 4px 14px rgba(26, 59, 43, 0.22); margin-bottom: 14px;">
                  XÉT DUYỆT ĐƠN ĐẶT PHÒNG TRÊN HỆ THỐNG
                </a>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48%">
                      <a href="#" style="display: block; text-align: center; background-color: #2D4C3C; color: #FFFFFF; text-decoration: none; padding: 11px 15px; border-radius: 3px; font-size: 12px; font-weight: 500; border: 1px solid #C5A869;">
                        Phản hồi Email khách
                      </a>
                    </td>
                    <td width="4%"></td>
                    <td width="48%">
                      <a href="#" style="display: block; text-align: center; background-color: #F5EFE6; color: #1A3B2B; text-decoration: none; padding: 11px 15px; border-radius: 3px; font-size: 12px; font-weight: bold; border: 1px solid #D8CDBE;">
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

  // Generate Customer HTML with SOOTHING GREEN PALETTE
  const customerHtml = `
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
                    <img src="${logoDataUri}" alt="Logo Lùng Vài Tea" width="46" height="46" style="display: block; width: 46px; height: 46px; border: 0; outline: none; vertical-align: middle;" />
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

              <!-- Salutation: Chuẩn tên Lê Nam -->
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
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1F1A17;">
                    ${booking.teaPackageName}
                  </td>
                </tr>
                <tr style="background-color: #FAF9F6;">
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #665F55;">Lời nhắn từ Trà Quán:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #E8E2D8; color: #1A3B2B; font-size: 13px; font-style: italic;">"${booking.adminNotes}"</td>
                </tr>
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
                <a href="#" style="display: inline-block; background-color: #1A3B2B; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 3px; font-family: Georgia, serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; border: 1px solid #C5A869; box-shadow: 0 4px 14px rgba(26, 59, 43, 0.22);">
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

  const tmpCustHtml = path.join(process.cwd(), '.tmp-customer-email.html');
  const tmpAdminHtml = path.join(process.cwd(), '.tmp-admin-email.html');
  fs.writeFileSync(tmpCustHtml, customerHtml);
  fs.writeFileSync(tmpAdminHtml, adminHtml);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outCust = path.join(artifactDir, 'redesigned-email-customer.png');
  const outAdmin = path.join(artifactDir, 'redesigned-email-admin.png');

  console.log('Chụp ảnh màn hình Email Khách hàng (Tone xanh ngọc dịu sang)...');
  execSync(`"${chromePath}" --headless --screenshot="${outCust}" --window-size=720,1150 "${tmpCustHtml}"`);
  
  console.log('Chụp ảnh màn hình Email Admin (Tone xanh ngọc dịu sang)...');
  execSync(`"${chromePath}" --headless --screenshot="${outAdmin}" --window-size=720,1100 "${tmpAdminHtml}"`);

  fs.unlinkSync(tmpCustHtml);
  fs.unlinkSync(tmpAdminHtml);
  console.log('Đã cập nhật ảnh preview thành công!');
}

main().catch(console.error);
