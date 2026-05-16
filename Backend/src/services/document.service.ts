import { PDFDocument, PDFPage, PDFName, PDFArray, PDFRawStream, rgb, StandardFonts, ParseSpeeds } from 'pdf-lib';
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
  const profileDir = path.join(tmpDir, 'profile');
  fs.mkdirSync(profileDir, { recursive: true });
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(tmpDir, `${baseName}.pdf`);

  try {
    const args: string[] = [
      `--env:UserInstallation=file://${profileDir}`,
      '--headless', '--norestore', '--nofirststartwizard',
      '--convert-to', 'pdf', '--outdir', tmpDir, inputPath,
    ];

    const { stderr } = await execFileAsync(getLibreOfficeCmd(), args, { timeout: 60000 });
    if (stderr) console.error('[wordToPdf] LO stderr:', stderr.slice(0, 500));

    if (!fs.existsSync(outputPath)) {
      const found = fs.readdirSync(tmpDir).filter(f => f !== 'profile');
      throw new Error(`DOCX→PDF muvaffaqiyatsiz. tmpDir: [${found.join(', ')}]`);
    }
    return await fs.promises.readFile(outputPath);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
};

// Mavjud sahifa kontentini yuqoriga siqadi — pastda footerH px bo'sh joy qoladi.
// Sahifa o'lchami o'zgarmaydi, shuning uchun sahifalar orasida reflow bo'lmaydi.
function compressPageContent(pdfDoc: PDFDocument, page: PDFPage, footerH: number): void {
  const { height } = page.getSize();
  const { context } = pdfDoc;

  const contents = page.node.get(PDFName.of('Contents'));
  if (!contents) return;

  // scaleY: kontent (height-footerH)/height ga siqiladi (masalan 790/842 ≈ 0.938)
  // ty = footerH: kontent yuqoriga siljiydi, pastda footerH px bo'sh qoladi
  const scaleY = (height - footerH) / height;
  const startBytes = new Uint8Array(Buffer.from(`q\n1 0 0 ${scaleY.toFixed(8)} 0 ${footerH} cm\n`));
  const endBytes   = new Uint8Array(Buffer.from(`\nQ\n`));

  const startRef = context.register(
    PDFRawStream.of(context.obj({ Length: startBytes.length }), startBytes)
  );
  const endRef = context.register(
    PDFRawStream.of(context.obj({ Length: endBytes.length }), endBytes)
  );

  const existingRefs = contents instanceof PDFArray ? contents.asArray() : [contents];
  page.node.set(PDFName.of('Contents'), context.obj([startRef, ...existingRefs, endRef]));
}

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
    // Kontent FOOTER_H ga siqiladi (cm transform), sahifa o'lchami o'zgarmaydi.
    // Shunday qilib, 1-betdagi ma'lumotlar 2-betga "siqib chiqarilmaydi".
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width } = page.getSize();

      // Mavjud kontentni yuqoriga siqish — pastda FOOTER_H px joy qoladi
      compressPageContent(pdfDoc, page, FOOTER_H);

      // Footer pastki qismida (y=0..FOOTER_H), original koordinatalarda chiziladi
      page.drawRectangle({
        x: 0, y: 0,
        width, height: FOOTER_H,
        color: rgb(0.98, 0.98, 0.98),
      });

      page.drawLine({
        start: { x: 0, y: FOOTER_H },
        end:   { x: width, y: FOOTER_H },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      const footerMidY = FOOTER_H / 2 - 4;

      page.drawText(`${i + 1} / ${pages.length}`, {
        x: MARGIN + 4, y: footerMidY,
        size: 8, font, color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText('qrhujjat.uz', {
        x: width / 2 - 24, y: footerMidY,
        size: 7, font, color: rgb(0.6, 0.6, 0.6),
      });

      page.drawImage(qrImages[i], {
        x: width - QR_SIZE - MARGIN,
        y: (FOOTER_H - QR_SIZE) / 2,
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

export const convertPdfToDocx = async (processedPath: string): Promise<Buffer> => {
  const pdfPath = path.join(PROCESSED_DIR, processedPath);
  const tmpDir = path.join(os.tmpdir(), `docx-${uuidv4()}`);
  const profileDir = path.join(tmpDir, 'profile');
  fs.mkdirSync(profileDir, { recursive: true });
  const baseName = path.basename(processedPath, '.pdf');
  const docxPath = path.join(tmpDir, `${baseName}.docx`);

  const makeArgs = (extra: string[]) => [
    `--env:UserInstallation=file://${profileDir}`,
    '--headless', '--norestore', '--nofirststartwizard',
    ...extra,
    '--convert-to', 'docx', '--outdir', tmpDir, pdfPath,
  ];

  try {
    const { stderr } = await execFileAsync(
      getLibreOfficeCmd(),
      makeArgs(['--infilter=writer_pdf_import']),
      { timeout: 60000 }
    );
    if (stderr) console.error('[convertPdfToDocx] LO stderr:', stderr.slice(0, 500));

    if (!fs.existsSync(docxPath)) {
      // Fallback: infilter yo'q varianti
      const { stderr: stderr2 } = await execFileAsync(
        getLibreOfficeCmd(),
        makeArgs([]),
        { timeout: 60000 }
      );
      if (stderr2) console.error('[convertPdfToDocx] fallback stderr:', stderr2.slice(0, 500));
    }

    if (!fs.existsSync(docxPath)) {
      const found = fs.readdirSync(tmpDir).filter(f => f !== 'profile');
      throw new Error(`PDF→DOCX muvaffaqiyatsiz. tmpDir: [${found.join(', ')}]`);
    }
    return await fs.promises.readFile(docxPath);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
};
