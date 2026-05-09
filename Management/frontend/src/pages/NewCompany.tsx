import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Server, Building2, Loader2, CheckCircle } from 'lucide-react';
import { createCompany } from '../services/api';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || /^[a-z0-9]$/.test(slug);
}

export default function NewCompanyPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    domain: '',
    monthlyPrice: 500000,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : slugify(name),
    }));
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true);
    setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidSlug(form.slug)) {
      setError('Slug faqat kichik harflar, raqamlar va chiziqchadan iborat bo\'lishi kerak');
      return;
    }
    setError('');
    setSubmitting(true);
    setProvisioning(true);
    try {
      const company = await createCompany({
        name: form.name,
        slug: form.slug,
        domain: form.domain || undefined,
        monthlyPrice: form.monthlyPrice,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        notes: form.notes || undefined,
      });
      navigate(`/companies/${company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
      setProvisioning(false);
    } finally {
      setSubmitting(false);
    }
  };

  const slugValid = form.slug ? isValidSlug(form.slug) : true;
  const previewUrl = form.domain
    ? `https://${form.domain}`
    : form.slug
    ? `https://${form.slug}.qrhujjat.uz`
    : null;

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors";

  if (provisioning && submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Server sozlanmoqda...</h2>
          <p className="text-slate-400 text-sm">
            Yangi korxona uchun server va ma'lumotlar bazasi yaratilmoqda.
            Bu bir necha daqiqa olishi mumkin.
          </p>
          <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
            {[
              'Docker container yaratilmoqda',
              "Ma'lumotlar bazasi sozlanmoqda",
              'Portlar tayinlanmoqda',
              'Servis ishga tushirilmoqda',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={14} className="text-indigo-400 animate-spin shrink-0" />
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/companies')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Yangi korxona</h1>
          <p className="text-slate-400 text-sm mt-0.5">Yangi korxona yarating va serverini sozlang</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />
            Asosiy ma'lumotlar
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Korxona nomi <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleNameChange}
                required
                placeholder="Asia Alians Group"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Slug (URL identifier) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.slug}
                  onChange={handleSlugChange}
                  required
                  placeholder="asia-alians"
                  className={`${inputClass} ${!slugValid && form.slug ? 'border-red-500 focus:border-red-500' : ''} ${slugValid && form.slug ? 'border-green-500/50' : ''}`}
                />
                {form.slug && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {slugValid
                      ? <CheckCircle size={16} className="text-green-400" />
                      : <span className="text-red-400 text-xs">Noto'g'ri</span>
                    }
                  </div>
                )}
              </div>
              {!slugValid && form.slug && (
                <p className="text-red-400 text-xs mt-1">Faqat kichik harflar, raqamlar va "-" belgisi</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Custom domain (ixtiyoriy)
              </label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={form.domain}
                  onChange={e => setForm(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="asia-alians.qrhujjat.uz"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Oylik to'lov (UZS) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.monthlyPrice}
                onChange={e => setForm(prev => ({ ...prev, monthlyPrice: +e.target.value }))}
                required
                min={0}
                step={10000}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Kontakt ma'lumotlari</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Mas'ul shaxs</label>
              <input type="text" value={form.contactName} onChange={e => setForm(prev => ({ ...prev, contactName: e.target.value }))} placeholder="Alisher Karimov" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="contact@company.uz" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Telefon</label>
              <input type="tel" value={form.contactPhone} onChange={e => setForm(prev => ({ ...prev, contactPhone: e.target.value }))} placeholder="+998 90 123 45 67" className={inputClass} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-1.5">Eslatmalar</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Qo'shimcha ma'lumotlar..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Preview */}
        {(previewUrl || form.slug) && (
          <div className="bg-slate-800/50 border border-slate-700/50 border-dashed rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Server size={16} className="text-slate-400" />
              Ko'rinish (Preview)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {previewUrl && (
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Frontend URL</p>
                  <p className="text-indigo-400 font-mono text-xs truncate">{previewUrl}</p>
                </div>
              )}
              {previewUrl && (
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Backend API</p>
                  <p className="text-indigo-400 font-mono text-xs truncate">{previewUrl}/api</p>
                </div>
              )}
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Oylik to'lov</p>
                <p className="text-white font-semibold">{new Intl.NumberFormat('uz-UZ').format(form.monthlyPrice)} UZS</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Portlar</p>
                <p className="text-slate-400 text-xs">Avtomatik tayinlanadi</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate('/companies')}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={submitting || !form.name || !form.slug || !slugValid}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Yaratilmoqda...</>
              : 'Korxona yaratish'
            }
          </button>
        </div>
      </form>
    </div>
  );
}
