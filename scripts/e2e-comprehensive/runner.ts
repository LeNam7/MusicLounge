import { COLORS, resetDatabase } from './helpers';
import { runTier1 } from './tier1-feature-coverage';
import { runTier2 } from './tier2-boundary-corner-cases';
import { runTier3 } from './tier3-cross-feature-combinations';
import { runTier4 } from './tier4-real-world-scenarios';
import { RunnerOptions, TierResult } from './types';

function parseArgs(): RunnerOptions {
  const args = process.argv.slice(2);
  let baseUrl = 'http://localhost:3000';
  let strict = false;
  let tier: 1 | 2 | 3 | 4 | undefined = undefined;
  let verbose = false;

  for (const arg of args) {
    if (arg.startsWith('--base-url=')) {
      baseUrl = arg.split('=')[1];
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg.startsWith('--tier=')) {
      const t = parseInt(arg.split('=')[1], 10);
      if (t >= 1 && t <= 4) tier = t as 1 | 2 | 3 | 4;
    }
  }

  return { baseUrl, strict, tier, verbose };
}

async function main() {
  const options = parseArgs();
  const overallStart = Date.now();

  console.log(`\n${COLORS.bold}${COLORS.cyan}========================================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}     LÙNG VÀI TEA — HỆ THỐNG KIỂM THỬ TOÀN DIỆN E2E (4-TIER TEST SUITE)  ${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}========================================================================${COLORS.reset}`);
  console.log(`${COLORS.dim}Target URL: ${options.baseUrl} | Strict Mode: ${options.strict} | Filter Tier: ${options.tier ?? 'All'}${COLORS.reset}\n`);

  // Step 0: Initial Reset
  console.log(`${COLORS.dim}[Setup] Đang chuẩn bị môi trường và đặt lại dữ liệu mẫu...${COLORS.reset}`);
  try {
    const resetOk = await resetDatabase(options.baseUrl);
    if (!resetOk) {
      console.warn(`${COLORS.yellow}⚠ Cảnh báo: Reset cơ sở dữ liệu ban đầu không thành công hoặc không phản hồi 200.${COLORS.reset}`);
    } else {
      console.log(`${COLORS.green}✓ [Setup] Môi trường kiểm thử sẵn sàng sạch sẽ.${COLORS.reset}\n`);
    }
  } catch (err: any) {
    console.error(`${COLORS.red}❌ Lỗi kết nối đến máy chủ ${options.baseUrl}: ${err?.message}${COLORS.reset}`);
    console.error(`${COLORS.yellow}Vui lòng đảm bảo ứng dụng Next.js đang chạy trên ${options.baseUrl}.${COLORS.reset}\n`);
    process.exit(1);
  }

  const tierResults: TierResult[] = [];

  // Helper to log test cases
  function logTierCases(result: TierResult) {
    console.log(`\n${COLORS.bold}${COLORS.blue}--- ${result.name} ---${COLORS.reset}`);
    for (const c of result.cases) {
      const dur = `${COLORS.dim}(${c.durationMs}ms)${COLORS.reset}`;
      if (c.status === 'PASSED') {
        console.log(`  ${COLORS.green}✓ [${c.id}]${COLORS.reset} ${c.name} ${dur}`);
      } else if (c.status === 'ESCALATED') {
        console.log(
          `  ${COLORS.yellow}⚠ [${c.id}] [ESCALATED to ${c.escalation?.targetMilestone}: ${c.escalation?.featureId}]${COLORS.reset} ${c.name} ${dur}`
        );
      } else {
        console.log(`  ${COLORS.red}❌ [${c.id}] [FAILED]${COLORS.reset} ${c.name} ${dur}`);
        if (c.error) {
          console.log(`     ${COLORS.red}Error: ${c.error}${COLORS.reset}`);
        }
      }
    }
  }

  // Tier 1
  if (!options.tier || options.tier === 1) {
    const t1 = await runTier1(options.baseUrl);
    tierResults.push(t1);
    logTierCases(t1);
  }

  // Tier 2
  if (!options.tier || options.tier === 2) {
    const t2 = await runTier2(options.baseUrl, options.strict);
    tierResults.push(t2);
    logTierCases(t2);
  }

  // Tier 3
  if (!options.tier || options.tier === 3) {
    const t3 = await runTier3(options.baseUrl);
    tierResults.push(t3);
    logTierCases(t3);
  }

  // Tier 4
  if (!options.tier || options.tier === 4) {
    const t4 = await runTier4(options.baseUrl);
    tierResults.push(t4);
    logTierCases(t4);
  }

  // Final Cleanup
  console.log(`\n${COLORS.dim}[Teardown] Đang dọn dẹp và khôi phục dữ liệu mẫu chuẩn...${COLORS.reset}`);
  await resetDatabase(options.baseUrl);
  console.log(`${COLORS.green}✓ [Teardown] Đã hoàn tất dọn dẹp môi trường.${COLORS.reset}\n`);

  // Summarize Results
  const total = tierResults.reduce((acc, t) => acc + t.total, 0);
  const passed = tierResults.reduce((acc, t) => acc + t.passed, 0);
  const failed = tierResults.reduce((acc, t) => acc + t.failed, 0);
  const escalated = tierResults.reduce((acc, t) => acc + t.escalated, 0);
  const totalDuration = Date.now() - overallStart;

  console.log(`${COLORS.bold}========================================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}                       BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ                   ${COLORS.reset}`);
  console.log(`${COLORS.bold}========================================================================${COLORS.reset}`);
  console.log(
    ` ${'Tier'.padEnd(8)} | ${'Tên Phân Lớp'.padEnd(46)} | ${'Tổng'.padStart(5)} | ${'Đạt'.padStart(5)} | ${'Báo Cáo'.padStart(7)} | ${'Lỗi'.padStart(5)}`
  );
  console.log(`-`.repeat(85));

  for (const tr of tierResults) {
    const tName = tr.name.split(':')[0].trim();
    const subName = tr.name.split(':')[1]?.trim() || '';
    const passColor = tr.passed === tr.total ? COLORS.green : COLORS.reset;
    const failColor = tr.failed > 0 ? COLORS.red : COLORS.reset;
    const escColor = tr.escalated > 0 ? COLORS.yellow : COLORS.reset;

    console.log(
      ` ${tName.padEnd(8)} | ${subName.slice(0, 46).padEnd(46)} | ${String(tr.total).padStart(5)} | ${passColor}${String(tr.passed).padStart(5)}${COLORS.reset} | ${escColor}${String(tr.escalated).padStart(7)}${COLORS.reset} | ${failColor}${String(tr.failed).padStart(5)}${COLORS.reset}`
    );
  }
  console.log(`-`.repeat(85));
  console.log(
    ` ${'TỔNG'.padEnd(57)} | ${String(total).padStart(5)} | ${COLORS.green}${String(passed).padStart(5)}${COLORS.reset} | ${COLORS.yellow}${String(escalated).padStart(7)}${COLORS.reset} | ${failed > 0 ? COLORS.red : COLORS.green}${String(failed).padStart(5)}${COLORS.reset}`
  );
  console.log(`Thời gian thực thi: ${(totalDuration / 1000).toFixed(2)}s\n`);

  // Report Escalated Defects for Milestone workers
  const allEscalations = tierResults
    .flatMap((t) => t.cases)
    .filter((c) => c.status === 'ESCALATED' && c.escalation);

  if (allEscalations.length > 0) {
    console.log(`${COLORS.bold}${COLORS.yellow}========================================================================${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.yellow}    DANH SÁCH LỖI VÀ ĐIỂM BẤT KHỚP CHỜ MILESTONE XỬ LÝ (ESCALATIONS)   ${COLORS.reset}`);
    console.log(`${COLORS.bold}${COLORS.yellow}========================================================================${COLORS.reset}`);

    for (const item of allEscalations) {
      const esc = item.escalation!;
      console.log(`\n• [${COLORS.bold}${esc.featureId}${COLORS.reset}] Mục tiêu: ${COLORS.cyan}${esc.targetMilestone}${COLORS.reset}`);
      console.log(`  Bài kiểm tra : [${item.id}] ${item.name}`);
      console.log(`  Mô tả sự cố  : ${esc.description}`);
      console.log(`  Thực tế ghi  : ${COLORS.red}${esc.observed}${COLORS.reset}`);
      console.log(`  Chuẩn yêu cầu: ${COLORS.green}${esc.expected}${COLORS.reset}`);
    }
    console.log(`\n${COLORS.dim}Các mục trên đã được ghi nhận vào báo cáo chuyển giao để các subagent Milestone hoàn thiện.${COLORS.reset}\n`);
  }

  if (failed > 0) {
    console.log(`${COLORS.bold}${COLORS.red}❌ KẾT QUẢ: Có ${failed} bài kiểm tra thất bại!${COLORS.reset}\n`);
    process.exit(1);
  } else {
    console.log(
      `${COLORS.bold}${COLORS.green}🎉 KẾT QUẢ: 100% CÁC BÀI KIỂM THỬ ĐÃ THỰC THI THÀNH CÔNG VÀ AN TOÀN!${COLORS.reset}\n`
    );
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`Lỗi thực thi runner:`, err);
  process.exit(1);
});
