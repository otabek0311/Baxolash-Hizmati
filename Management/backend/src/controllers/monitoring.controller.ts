import { Request, Response } from 'express';
import { execSync } from 'child_process';
import { prisma } from '../utils/prisma';

interface DockerStats {
  Name: string;
  CPUPerc: string;
  MemUsage: string;
  BlockIO: string;
  NetIO: string;
  PIDs: string;
}

function parseCpuPercent(cpuStr: string): number {
  return parseFloat(cpuStr.replace('%', '')) || 0;
}

function parseMemoryMb(memStr: string): number {
  // Format: "123.4MiB / 1.9GiB"
  const used = memStr.split('/')[0].trim();
  if (used.includes('GiB')) return parseFloat(used) * 1024;
  if (used.includes('MiB')) return parseFloat(used);
  if (used.includes('KiB')) return parseFloat(used) / 1024;
  if (used.includes('GB')) return parseFloat(used) * 1024;
  if (used.includes('MB')) return parseFloat(used);
  return parseFloat(used) || 0;
}

function parseBlockIoMb(ioStr: string): number {
  // Format: "1.23MB / 4.56MB" — take the write (second) value
  const parts = ioStr.split('/');
  const write = parts[1]?.trim() || '0';
  if (write.includes('GB')) return parseFloat(write) * 1024;
  if (write.includes('MB')) return parseFloat(write);
  if (write.includes('kB')) return parseFloat(write) / 1024;
  return parseFloat(write) || 0;
}

// GET /api/monitoring/companies/:id/stats
export const getCompanyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const containerNames = [
      `${company.slug}_frontend_1`,
      `${company.slug}_backend_1`,
      `${company.slug}_db_1`,
    ];

    const statsResults: Record<string, DockerStats | null> = {};
    let totalCpu = 0;
    let totalMemMb = 0;
    let totalDiskMb = 0;
    let isRunning = false;

    for (const containerName of containerNames) {
      try {
        const output = execSync(
          `docker stats --no-stream --format "{{json .}}" ${containerName}`,
          { encoding: 'utf8', timeout: 10000 }
        ).trim();

        const stats: DockerStats = JSON.parse(output);
        statsResults[containerName] = stats;

        const cpu = parseCpuPercent(stats.CPUPerc);
        const mem = parseMemoryMb(stats.MemUsage);
        const disk = parseBlockIoMb(stats.BlockIO);

        totalCpu += cpu;
        totalMemMb += mem;
        totalDiskMb += disk;
        isRunning = true;
      } catch {
        statsResults[containerName] = null;
      }
    }

    // Save metrics to DB
    await prisma.serverMetric.create({
      data: {
        companyId: id,
        cpuPercent: totalCpu,
        memoryMb: totalMemMb,
        diskMb: totalDiskMb,
        isRunning,
      },
    });

    res.json({
      companyId: id,
      slug: company.slug,
      isRunning,
      containers: statsResults,
      totals: {
        cpuPercent: Math.round(totalCpu * 100) / 100,
        memoryMb: Math.round(totalMemMb * 100) / 100,
        diskMb: Math.round(totalDiskMb * 100) / 100,
      },
      recordedAt: new Date(),
    });
  } catch (error) {
    console.error('getCompanyStats error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

// GET /api/monitoring/companies/:id/metrics
export const getRecentMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ message: 'Kompaniya topilmadi' });
      return;
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await prisma.serverMetric.findMany({
      where: {
        companyId: id,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });

    res.json({
      companyId: id,
      slug: company.slug,
      hours,
      count: metrics.length,
      metrics,
    });
  } catch (error) {
    console.error('getRecentMetrics error:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};
