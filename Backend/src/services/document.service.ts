import { PDFDocument, rgb, StandardFonts, ParseSpeeds } from 'pdf-lib';
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
    const p = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
    if (fs.existsSync(p)) return p;
    throw new Error('LibreOffice topilmadi. O\'rnatish: https://www.libreoffice.org/download/');
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    throw new Error('LibreOffice topilmadi. O\'rnatish: https://www.libreoffice.org/download/');
  }
  return 'soffice';
};

const wordToPdf = async (inputPath: string): Promise<Buffer> => {
  const tmpDir = path.join(os.tmpdir(), `lo-${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(tmpDir, `${baseName}.pdf`);

  try {
    const args = ['--headless', '--norestore', '--nofirststartwizard', '--convert-to', 'pdf', '--outdir', tmpDir, inputPath];
    // HOME=tmpDir: har jarayon o'z profili papkasida ishlaydi, concurrent konflikt yo'q
    const { stderr } = await execFileAsync(getLibreOfficeCmd(), args, {
      timeout: 60000,
      env: { ...process.env, HOME: tmpDir },
    });
    if (stderr) console.error('[wordToPdf] LO stderr:', stderr.slice(0, 500));

    if (!fs.existsSync(outputPath)) {
      const found = fs.readdirSync(tmpDir);
      throw new Error(`DOCX→PDF muvaffaqiyatsiz. tmpDir: [${found.join(', ')}]`);
    }
    return await fs.promises.readFile(outputPath);
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

    const QR_SIZE = 46;
    const QR_X    = 28;
    const QR_Y    = 8;

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

    // 4-qadam: Har bir sahifaga faqat QR kod chizish
    // Hujjat kontentiga UMUMAN TEGMAYMIZ.
    // Original hujjatda bet raqami va imzo joyi bor — biz FAQAT QR qo'shamiz.
    // Chap pastki burchakdan QR_X/QR_Y ga surilgan.
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      page.drawImage(qrImages[i], {
        x: QR_X, y: QR_Y,
        width: QR_SIZE, height: QR_SIZE,
      });

      // "qrhujjat.uz" — QR ning o'ng tomonida, vertikal markazda
      page.drawText('qrhujjat.uz', {
        x: QR_X + QR_SIZE + 8,
        y: QR_Y + QR_SIZE / 2 - 4,
        size: 9, font, color: rgb(0.35, 0.35, 0.35),
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

export const convertPdfToDocx = async (processedPath: string): Promise<Buffer> => {
  const pdfPath = path.join(PROCESSED_DIR, processedPath);
  const tmpDir = path.join(os.tmpdir(), `docx-${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const baseName = path.basename(processedPath, '.pdf');
  const docxPath = path.join(tmpDir, `${baseName}.docx`);
  const loEnv = { ...process.env, HOME: tmpDir };

  try {
    const { stderr } = await execFileAsync(
      getLibreOfficeCmd(),
      ['--headless', '--norestore', '--nofirststartwizard',
       '--infilter=writer_pdf_import',
       '--convert-to', 'docx', '--outdir', tmpDir, pdfPath],
      { timeout: 60000, env: loEnv }
    );
    if (stderr) console.error('[convertPdfToDocx] LO stderr:', stderr.slice(0, 500));

    if (!fs.existsSync(docxPath)) {
      // Fallback: infilter qo'llab-quvvatlanmasa, filtersiz
      const { stderr: s2 } = await execFileAsync(
        getLibreOfficeCmd(),
        ['--headless', '--norestore', '--nofirststartwizard',
         '--convert-to', 'docx', '--outdir', tmpDir, pdfPath],
        { timeout: 60000, env: loEnv }
      );
      if (s2) console.error('[convertPdfToDocx] fallback stderr:', s2.slice(0, 500));
    }

    if (!fs.existsSync(docxPath)) {
      const found = fs.readdirSync(tmpDir);
      throw new Error(`PDF→DOCX muvaffaqiyatsiz. tmpDir: [${found.join(', ')}]`);
    }
    return await fs.promises.readFile(docxPath);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
};
