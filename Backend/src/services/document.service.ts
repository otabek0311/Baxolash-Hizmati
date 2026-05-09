import { PDFDocument, rgb, degrees, StandardFonts, ParseSpeeds } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';

const execFileAsync = promisify(execFile);

const PROCESSED_DIR = path.join(__dirname, '..', '..', 'processed');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

fs.mkdirSync(PROCESSED_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const getLibreOfficeCmd = (): string => {
  if (process.platform === 'darwin') {
    return '/Applications/LibreOffice.app/Contents/MacOS/soffice';
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return 'soffice.exe';
  }
  return 'soffice';
};

const wordToPdf = async (inputPath: string): Promise<Buffer> => {
  const tmpDir = path.join(os.tmpdir(), `lo-${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(tmpDir, `${baseName}.pdf`);

  // Windows da file:// URL uchta slash talab qiladi va backslash → forward slash
  const toFileUrl = (p: string) =>
    process.platform === 'win32'
      ? `file:///${p.replace(/\\/g, '/')}`
      : `file://${p}`;

  try {
    await execFileAsync(getLibreOfficeCmd(), [
      '--headless',
      `--env:UserInstallation=${toFileUrl(tmpDir)}`,
      '--convert-to', 'pdf',
      '--outdir', tmpDir,
      inputPath,
    ], { timeout: 60000 });
    if (!fs.existsSync(outputPath)) throw new Error('Word konvertatsiya fayli yaratilmadi');
    return fs.promises.readFile(outputPath);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
};

export const processDocument = async (filePath: string, documentId: string): Promise<void> => {
  const t0 = Date.now();
  try {
    const ext = path.extname(filePath).toLowerCase();
    let pdfBuffer: Buffer;

    if (ext === '.pdf') {
      pdfBuffer = await fs.promises.readFile(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      pdfBuffer = await wordToPdf(filePath);
    } else {
      throw new Error(`Qo'llab quvvatlanmaydigan format: ${ext}`);
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer, { parseSpeed: ParseSpeeds.Fastest });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('PDF fayl bo\'sh (0 sahifa)');
    }

    const FOOTER_H = 52;
    const QR_SIZE  = 42;
    const MARGIN   = 8;

    // 1-qadam: Barcha sahifalar uchun token va URL larni oldindan hosil qilish
    const pageData = pages.map((_, i) => {
      const qrToken = uuidv4();
      return { qrToken, qrUrl: `${BASE_URL}/api/qr/${qrToken}/view`, pageIndex: i };
    });

    // 2-qadam: Barcha QR kodlarni PARALLEL generatsiya qilish
    // width:60 = 42px display uchun yetarli (120px → 60px: 4x kichik buffer)
    const qrBuffers = await Promise.all(
      pageData.map(({ qrUrl }) =>
        QRCode.toBuffer(qrUrl, { width: 60, margin: 1, errorCorrectionLevel: 'M' })
      )
    );

    // 3-qadam: PNG larni PDF ga joylashtirish (pdf-lib uchun ketma-ket bo'lishi kerak)
    const qrImages: Awaited<ReturnType<typeof pdfDoc.embedPng>>[] = [];
    for (const buf of qrBuffers) {
      qrImages.push(await pdfDoc.embedPng(buf));
    }

    // 4-qadam: Har bir sahifaga footer va QR chizish
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width } = page.getSize();
      const mb = page.getMediaBox();

      page.setMediaBox(mb.x, mb.y - FOOTER_H, mb.width, mb.height + FOOTER_H);

      page.drawRectangle({
        x: mb.x, y: mb.y - FOOTER_H,
        width, height: FOOTER_H,
        color: rgb(0.98, 0.98, 0.98),
      });

      page.drawLine({
        start: { x: mb.x, y: mb.y },
        end:   { x: mb.x + width, y: mb.y },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      const footerMidY = mb.y - FOOTER_H / 2 - 4;

      page.drawText(`${i + 1} / ${pages.length}`, {
        x: mb.x + MARGIN + 4, y: footerMidY,
        size: 8, font, color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText('qrhujjat.uz', {
        x: mb.x + width / 2 - 24, y: footerMidY,
        size: 7, font, color: rgb(0.6, 0.6, 0.6),
      });

      page.drawImage(qrImages[i], {
        x: mb.x + width - QR_SIZE - MARGIN,
        y: mb.y - FOOTER_H + (FOOTER_H - QR_SIZE) / 2,
        width: QR_SIZE, height: QR_SIZE,
      });
    }

    const processedFileName = `${documentId}.pdf`;
    const processedPath = path.join(PROCESSED_DIR, processedFileName);
    // useObjectStreams:false — pdf-lib save bosqichini ~30% tezlashtiradi
    await fs.promises.writeFile(processedPath, await pdfDoc.save({ addDefaultPage: false, useObjectStreams: false }));

    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath).catch(() => {});

    await prisma.page.createMany({
      data: pageData.map(({ qrToken }, i) => ({
        documentId,
        pageNumber: i + 1,
        qrToken,
        filePath: '',
      })),
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'READY', pageCount: pages.length, processedPath: processedFileName },
    });

    console.log(`[Process] ${pages.length} sahifa, ${Date.now() - t0}ms — ${documentId.slice(0, 8)}`);
  } catch (err) {
    console.error(`[Process] Xato (${Date.now() - t0}ms):`, err);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' },
    }).catch(() => {});
  }
};

export const addWatermark = async (processedPath: string, downloaderName: string, downloadedAt: Date): Promise<Buffer> => {
  const filePath = path.join(PROCESSED_DIR, processedPath);
  const pdfDoc = await PDFDocument.load(await fs.promises.readFile(filePath));
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const text = `Yuklab olindi: ${downloaderName} | ${downloadedAt.toLocaleString('uz-UZ')}`;

  for (const page of pdfDoc.getPages()) {
    const { height } = page.getSize();
    page.drawText(text, {
      x: 30, y: height / 2, size: 9, font,
      color: rgb(0.75, 0.75, 0.75),
      rotate: degrees(45), opacity: 0.3,
    });
  }

  return Buffer.from(await pdfDoc.save());
};
