import { useState, useMemo } from 'react';
import { Plus, Trash2, X, ChevronRight, Printer, Check, FileText, AlertCircle, Edit } from 'lucide-react';
import type { Project, Invoice, InvoiceLineItem, InvoiceStatus } from '../types';

interface FinancesProps {
  projects: Project[];
  invoices: Invoice[];
  onSaveInvoice: (inv: Omit<Invoice, 'id' | 'createdAt'>) => void;
  onUpdateInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

type FilterTab = 'todas' | 'pendientes' | 'pagadas';

const CATEGORIES = ['Video', 'Diseño', 'Edición', 'Imagen'];

function genId(): string {
  return crypto.randomUUID();
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function calcItemTotal(item: InvoiceLineItem): number {
  return item.quantity * item.unitPrice;
}

function categoryColor(cat: string): string {
  const colors: Record<string, string> = {
    Video: '#8B5CF6',
    Diseño: '#3B82F6',
    Edición: '#10B981',
    Imagen: '#F59E0B',
  };
  return colors[cat] || '#6B7280';
}

function newItem(): InvoiceLineItem {
  return { id: genId(), description: '', category: '', unitPrice: 0, quantity: 1, total: 0 };
}

export const Finances: React.FC<FinancesProps> = ({ projects, invoices, onSaveInvoice, onUpdateInvoice, onDeleteInvoice }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [invMonth, setInvMonth] = useState(currentMonth());
  const [invItems, setInvItems] = useState<InvoiceLineItem[]>([newItem()]);
  const [invStatus, setInvStatus] = useState<InvoiceStatus>('pendiente');
  const [editingInv, setEditingInv] = useState<Invoice | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('todas');

  const totalFacturado = useMemo(() => invoices.reduce((a, i) => a + i.total, 0), [invoices]);
  const totalCobrado = useMemo(() => invoices.filter((i) => i.status === 'pagada').reduce((a, i) => a + i.total, 0), [invoices]);
  const totalPendiente = useMemo(() => invoices.filter((i) => i.status === 'pendiente').reduce((a, i) => a + i.total, 0), [invoices]);
  const pendingCount = useMemo(() => invoices.filter((i) => i.status === 'pendiente').length, [invoices]);

  const projectInvs = useMemo(() => {
    if (!selectedProject) return [];
    let list = invoices.filter((i) => i.projectId === selectedProject);
    if (filterTab === 'pendientes') list = list.filter((i) => i.status === 'pendiente');
    if (filterTab === 'pagadas') list = list.filter((i) => i.status === 'pagada');
    return list.sort((a, b) => b.month.localeCompare(a.month));
  }, [invoices, selectedProject, filterTab]);

  const projectsWithDebt = useMemo(() => {
    return projects
      .map((p) => {
        const pending = invoices.filter((i) => i.projectId === p.id && i.status === 'pendiente');
        const pendTotal = pending.reduce((a, i) => a + i.total, 0);
        return { project: p, pending, pendTotal, count: pending.length };
      })
      .filter((p) => p.count > 0)
      .sort((a, b) => {
        const aOldest = a.pending.length ? Math.min(...a.pending.map((i) => new Date(i.createdAt).getTime())) : 0;
        const bOldest = b.pending.length ? Math.min(...b.pending.map((i) => new Date(i.createdAt).getTime())) : 0;
        return aOldest - bOldest;
      });
  }, [projects, invoices]);

  const handleAddItem = () => {
    setInvItems((prev) => [...prev, newItem()]);
  };

  const handleRemoveItem = (id: string) => {
    setInvItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  };

  const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setInvItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'unitPrice' || field === 'quantity') {
        const q = field === 'quantity' ? Number(value) : item.quantity;
        const p = field === 'unitPrice' ? Number(value) : item.unitPrice;
        updated.total = q * p;
      }
      return updated;
    }));
  };

  const validItems = invItems.filter((i) => i.description.trim() && i.unitPrice > 0);
  const formTotal = invItems.reduce((a, i) => a + calcItemTotal(i), 0);

  const resetForm = () => {
    setShowForm(false);
    setEditingInv(null);
    setInvItems([newItem()]);
    setInvMonth(currentMonth());
    setInvStatus('pendiente');
  };

  const openNewForm = () => {
    setEditingInv(null);
    setInvMonth(currentMonth());
    setInvItems([newItem()]);
    setInvStatus('pendiente');
    setShowForm(true);
  };

  const handleSaveInvoice = () => {
    if (!selectedProject) return;
    if (validItems.length === 0) return;
    const total = validItems.reduce((a, i) => a + i.total, 0);
    const data = {
      projectId: selectedProject,
      month: invMonth,
      items: validItems,
      total,
      status: invStatus,
      paidAt: null,
    };
    if (editingInv) {
      onUpdateInvoice({ ...editingInv, ...data, paidAt: editingInv.status === 'pagada' ? editingInv.paidAt : null });
    } else {
      onSaveInvoice(data);
    }
    resetForm();
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInv(inv);
    setInvMonth(inv.month);
    setInvItems(inv.items.length > 0 ? inv.items.map((i) => ({ ...i, id: i.id || genId() })) : [newItem()]);
    setInvStatus(inv.status);
    setShowForm(true);
  };

  const handleTogglePaid = (inv: Invoice) => {
    const isPaid = inv.status === 'pagada';
    onUpdateInvoice({
      ...inv,
      status: isPaid ? 'pendiente' : 'pagada',
      paidAt: isPaid ? null : new Date().toISOString(),
    });
  };

  const activeProject = projects.find((p) => p.id === selectedProject);

  const groupedItems = (items: InvoiceLineItem[]) => {
    const groups: Record<string, InvoiceLineItem[]> = {};
    const uncategorized: InvoiceLineItem[] = [];
    for (const item of items) {
      if (item.category) {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      } else {
        uncategorized.push(item);
      }
    }
    const result: { category: string; items: InvoiceLineItem[]; subtotal: number }[] = [];
    for (const [cat, catItems] of Object.entries(groups)) {
      result.push({ category: cat, items: catItems, subtotal: catItems.reduce((a, i) => a + i.total, 0) });
    }
    if (uncategorized.length) {
      result.push({ category: 'Otros', items: uncategorized, subtotal: uncategorized.reduce((a, i) => a + i.total, 0) });
    }
    return result;
  };

  const printInvoiceTemplate = (inv: Invoice) => {
    const p = projects.find((pr) => pr.id === inv.projectId);
    if (!p) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const monthStr = monthLabel(inv.month);
    const paidStr = inv.status === 'pagada' && inv.paidAt
      ? `Pagado el ${new Date(inv.paidAt).toLocaleDateString('es-ES')}`
      : 'Pendiente de pago';
    const groups = groupedItems(inv.items);
    const groupsHtml = groups.map((g) => `
      <tr class="group-header"><td colspan="4"><strong>${escHtml(g.category)}</strong></td></tr>
      ${g.items.map((item) => `<tr><td>${escHtml(item.description)}</td><td>${item.quantity}</td><td>&euro;${item.unitPrice.toFixed(2)}</td><td>&euro;${item.total.toFixed(2)}</td></tr>`).join('')}
      <tr class="subtotal-row"><td colspan="3">Subtotal ${escHtml(g.category)}</td><td>&euro;${g.subtotal.toFixed(2)}</td></tr>
    `).join('');
    win.document.write(`
      <html><head><title>Factura - ${escHtml(p.name)} - ${monthStr}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; padding: 48px; color: #111; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #eee; }
        .header h1 { font-size: 24px; font-weight: 700; }
        .header .meta { text-align: right; font-size: 13px; color: #666; line-height: 1.6; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; }
        .badge-paid { background: #d4edda; color: #155724; }
        .badge-pending { background: #fff3cd; color: #856404; }
        .client-info { margin-bottom: 32px; }
        .client-info h2 { font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .client-info p { font-size: 16px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        th { text-align: left; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 12px; border-bottom: 2px solid #eee; }
        td { padding: 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        td:nth-child(2), td:nth-child(3), th:nth-child(2), th:nth-child(3) { text-align: center; }
        td:last-child, th:last-child { text-align: right; }
        .group-header td { padding: 16px 12px 4px; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: none; }
        .subtotal-row td { font-weight: 600; font-size: 13px; color: #555; padding-top: 4px; border-bottom: 1px solid #ddd; }
        .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #111; border-bottom: none; padding-top: 16px; }
        .footer { margin-top: 48px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
        @media print { body { padding: 24px; } }
      </style></head><body>
        <div class="header">
          <div>
            <h1>Factura</h1>
            <p style="color:#888;font-size:14px">${escHtml(p.name)}</p>
            <span class="badge ${inv.status === 'pagada' ? 'badge-paid' : 'badge-pending'}">${paidStr}</span>
          </div>
          <div class="meta">
            <div>Periodo: ${monthStr}</div>
            <div>Factura #${inv.id.slice(0, 8).toUpperCase()}</div>
            <div>Emisión: ${new Date(inv.createdAt).toLocaleDateString('es-ES')}</div>
          </div>
        </div>
        <div class="client-info">
          <h2>Cliente</h2>
          <p>${escHtml(p.client || '—')}</p>
        </div>
        <table>
          <tr><th>Descripción</th><th>Cantidad</th><th>Precio Unit.</th><th>Total</th></tr>
          ${groupsHtml}
          <tr class="total-row"><td colspan="3">Total</td><td>&euro;${inv.total.toFixed(2)}</td></tr>
        </table>
        <div class="footer">BlessProjects — Factura generada el ${new Date().toLocaleString('es-ES')}</div>
        <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  };

  const COLS = 'minmax(180px,1fr) 128px 76px 116px 110px 40px';

  const editor = (
    <div className="gp-surface gp-border-line gp-rounded-lg gp-mb-6" style={{ overflow: 'hidden' }}>
      <style>{`
        .inv-scroll { overflow-x: auto; padding: 0 20px; }
        .inv-grid { display: grid; grid-template-columns: ${COLS}; gap: 10px; align-items: center; min-width: 720px; }
        .inv-head { padding: 12px 0 10px; border-bottom: 2px solid var(--gp-border); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--gp-text-tertiary); }
        .inv-row { padding: 8px 0; border-bottom: 1px solid var(--gp-border); }
        .inv-row:nth-child(even) { background: var(--gp-surface-hover); border-radius: var(--gp-radius-sm); }
        .inv-input { height: 42px; font-size: 0.9rem; }
        .inv-input.num { text-align: right; font-family: var(--gp-font-mono); }
        .inv-amount { text-align: right; font-family: var(--gp-font-mono); font-size: 0.95rem; font-weight: 700; white-space: nowrap; }
        .inv-head span:nth-child(3) { text-align: center; }
        .inv-head span:nth-child(4), .inv-head span:nth-child(5) { text-align: right; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--gp-border)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            {editingInv ? 'Editar Factura' : 'Nueva Factura'}
          </h3>
          <span className="gp-text-tertiary" style={{ fontSize: '0.8rem' }}>
            {activeProject?.name}{activeProject?.client ? ` · ${activeProject.client}` : ''}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={resetForm} aria-label="Cerrar editor">
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', padding: '16px 20px', flexWrap: 'wrap', borderBottom: '1px solid var(--gp-border)' }}>
        <div className="form-group" style={{ margin: 0, flex: '1 1 220px' }}>
          <label className="form-label">Mes de facturación</label>
          <input className="form-control inv-input" type="month" value={invMonth} onChange={(e) => setInvMonth(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '0 0 auto' }}>
          <label className="form-label">Estado</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${invStatus === 'pendiente' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInvStatus('pendiente')}
              type="button"
            >
              Pendiente
            </button>
            <button
              className={`btn btn-sm ${invStatus === 'pagada' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInvStatus('pagada')}
              type="button"
            >
              Pagada
            </button>
          </div>
        </div>
      </div>

      <div className="inv-scroll">
        <div className="inv-grid inv-head">
          <span>Concepto</span>
          <span>Tipo</span>
          <span>Cant.</span>
          <span>Precio Unit.</span>
          <span>Importe</span>
          <span />
        </div>

        {invItems.map((item) => (
          <div key={item.id} className="inv-grid inv-row">
            <input
              className="form-control inv-input"
              type="text"
              placeholder="Ej. Reel promocional, Banner, Edición..."
              value={item.description}
              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
            />
            <input
              className="form-control inv-input"
              type="text"
              list="cat-list"
              placeholder="Tipo"
              value={item.category || ''}
              onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
            />
            <input
              className="form-control inv-input"
              type="number"
              min="1"
              style={{ textAlign: 'center' }}
              value={item.quantity}
              onChange={(e) => handleItemChange(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
            />
            <input
              className="form-control inv-input num"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={item.unitPrice || ''}
              onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
            />
            <span className="inv-amount">€{calcItemTotal(item).toFixed(2)}</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleRemoveItem(item.id)}
              aria-label="Eliminar concepto"
              style={{ color: 'var(--gp-text-tertiary)', padding: '6px', visibility: invItems.length > 1 ? 'visible' : 'hidden', justifySelf: 'center' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <datalist id="cat-list">
          {CATEGORIES.map((c) => <option key={c} value={c} />)}
        </datalist>

        <div style={{ padding: '14px 0 4px' }}>
          <button className="btn btn-ghost" onClick={handleAddItem} type="button">
            <Plus size={16} /> Agregar concepto
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', padding: '18px 20px', borderTop: '1px solid var(--gp-border)', background: 'var(--gp-surface-hover)', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={resetForm} type="button">
          Cancelar
        </button>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--gp-text-secondary)', marginBottom: '2px' }}>
            Subtotal ({validItems.length} concepto{validItems.length === 1 ? '' : 's'}){' '}
            <span style={{ fontFamily: 'var(--gp-font-mono)', fontWeight: 600 }}>€{formTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--gp-font-mono)', lineHeight: 1.2 }}>
            TOTAL <span style={{ color: 'var(--gp-accent)' }}>€{formTotal.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveInvoice}
            disabled={validItems.length === 0}
            type="button"
            style={{ marginTop: '12px' }}
          >
            <Check size={16} /> {editingInv ? 'Actualizar Factura' : 'Guardar Factura'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="gp-px-4" style={{ padding: '24px 0', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="gp-mb-6">
        <div className="title-large">Facturación</div>
        <div className="subtitle">Crea y gestiona facturas para tus clientes.</div>
      </div>

      {!selectedProject ? (
        <>
          <div className="gp-mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="hover-lift gp-surface gp-border-line gp-rounded-md gp-p-4">
              <div className="gp-text-tertiary gp-mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Facturado</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--gp-font-mono)' }}>€{totalFacturado.toFixed(2)}</div>
            </div>
            <div className="hover-lift gp-surface gp-border-line gp-rounded-md gp-p-4">
              <div className="gp-text-tertiary gp-mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cobrado</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--gp-font-mono)', color: '#2ECC71' }}>€{totalCobrado.toFixed(2)}</div>
            </div>
            <div className="hover-lift gp-surface gp-border-line gp-rounded-md gp-p-4">
              <div className="gp-text-tertiary gp-mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pendiente</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--gp-font-mono)', color: pendingCount > 0 ? '#F39C12' : 'inherit' }}>€{totalPendiente.toFixed(2)}</div>
              {pendingCount > 0 && <div className="gp-mt-2" style={{ fontSize: '0.7rem', color: '#B8860B' }}>{pendingCount} factura(s) sin cobrar</div>}
            </div>
          </div>

          {projectsWithDebt.length > 0 && (
            <div className="gp-mb-5" style={{ background: 'rgba(243,156,18,0.06)', border: '1px solid rgba(243,156,18,0.15)', borderRadius: 'var(--gp-radius-md)', padding: '12px 16px' }}>
              <div className="gp-flex-center gp-mb-2" style={{ gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#B8860B' }}>
                <AlertCircle size={14} /> Proyectos con deuda
              </div>
              <div className="gp-flex-col" style={{ gap: '6px' }}>
                {projectsWithDebt.map(({ project, pendTotal, count }) => (
                  <div key={project.id} className="gp-flex-center" style={{ gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--gp-radius-sm)' }}
                    onClick={() => setSelectedProject(project.id)}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: project.color }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{project.name}</span>
                    <span className="gp-text-tertiary" style={{ fontSize: '0.75rem' }}>{count} factura(s)</span>
                    <span className="gp-ml-auto" style={{ fontFamily: 'var(--gp-font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>€{pendTotal.toFixed(2)}</span>
                    <ChevronRight size={12} className="gp-text-tertiary" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="projects-grid">
            {projects.filter((p) => p.client).length === 0 ? (
              <div className="add-card" style={{ cursor: 'default', opacity: 0.5, minHeight: '200px', gridColumn: '1 / -1' }}>
                <FileText size={24} />
                <span>Asigna un cliente a tus proyectos para empezar a facturar</span>
              </div>
            ) : (
              projects.filter((p) => p.client).map((p) => {
                const invCount = invoices.filter((i) => i.projectId === p.id).length;
                const totalFact = invoices.filter((i) => i.projectId === p.id).reduce((a, i) => a + i.total, 0);
                return (
                  <div key={p.id} className="project-card hover-lift" onClick={() => setSelectedProject(p.id)}>
                    <div className="project-card-accent" style={{ backgroundColor: p.color }} />
                    <div className="project-card-header">
                      <div>
                        <div className="project-card-name">{p.name}</div>
                        <span className="project-card-status" style={{ color: 'var(--gp-text-secondary)', background: 'var(--gp-surface-hover)' }}>
                          {p.client}
                        </span>
                      </div>
                    </div>
                    <div className="project-card-footer">
                      <div className="gp-flex-center" style={{ gap: '16px', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>€{totalFact.toFixed(2)}</span>
                        <span className="gp-text-tertiary">{invCount} factura(s)</span>
                      </div>
                      <div className="gp-flex-center gp-text-tertiary gp-mt-2" style={{ fontSize: '0.72rem', gap: '4px' }}>
                        <ChevronRight size={12} /> Ver facturas
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div>
          <div className="gp-flex-center gp-mb-4" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedProject(null); resetForm(); }}>
              <X size={16} /> Volver
            </button>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              {activeProject?.name}
            </h2>
            <span className="gp-text-secondary" style={{ fontSize: '0.8rem' }}>{activeProject?.client}</span>
          </div>

          {showForm ? (
            editor
          ) : (
            <>
              <div className="gp-flex-center gp-mb-4" style={{ gap: '8px' }}>
                <button className="btn btn-primary" onClick={openNewForm}>
                  <Plus size={16} /> Nueva Factura
                </button>
              </div>

              <div className="gp-flex-center gp-mb-3" style={{ gap: '4px', flexWrap: 'wrap' }}>
                {(['todas', 'pendientes', 'pagadas'] as FilterTab[]).map((tab) => (
                  <button key={tab} className={`btn btn-sm ${filterTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFilterTab(tab)}
                    style={{ textTransform: 'capitalize' }}>
                    {tab === 'todas' ? 'Todas' : tab === 'pendientes' ? 'Pendientes' : 'Pagadas'}
                  </button>
                ))}
              </div>

              {projectInvs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FileText size={24} />
                  </div>
                  <div className="empty-state-title">
                    {filterTab === 'todas' ? 'No hay facturas' : `No hay facturas ${filterTab === 'pendientes' ? 'pendientes' : 'pagadas'}`}
                  </div>
                  <div className="empty-state-desc">
                    {filterTab === 'todas' ? 'Crea tu primera factura para este proyecto.' : 'Cambia el filtro o crea una nueva factura.'}
                  </div>
                  {filterTab === 'todas' && (
                    <button className="btn btn-primary btn-sm" onClick={openNewForm}>
                      <Plus size={14} /> Nueva Factura
                    </button>
                  )}
                </div>
              ) : (
                <div className="cu-list">
                  {projectInvs.map((inv) => {
                    const groups = groupedItems(inv.items);
                    return (
                      <div key={inv.id} className="cu-row">
                        <div className="gp-flex-center" style={{ gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                          <div className="gp-flex-center" style={{ width: '32px', height: '32px', borderRadius: 'var(--gp-radius-sm)', background: inv.status === 'pagada' ? 'rgba(46,204,113,0.1)' : 'rgba(243,156,18,0.1)', flexShrink: 0 }}>
                            <FileText size={14} style={{ color: inv.status === 'pagada' ? '#2ECC71' : '#F39C12' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{monthLabel(inv.month)}</div>
                            <div className="gp-flex-center gp-flex-wrap gp-mt-1" style={{ gap: '6px' }}>
                              {groups.map((g) => (
                                <span key={g.category} style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '3px', background: `${categoryColor(g.category)}15`, color: categoryColor(g.category), fontWeight: 600 }}>
                                  {g.category} €{g.subtotal.toFixed(2)}
                                </span>
                              ))}
                            </div>
                            <div className="gp-text-tertiary gp-mt-1" style={{ fontSize: '0.72rem' }}>
                              {inv.status === 'pagada' ? 'Pagado' : 'Pendiente'}
                              {inv.paidAt && ` · ${new Date(inv.paidAt).toLocaleDateString('es-ES')}`}
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--gp-font-mono)' }}>
                            €{inv.total.toFixed(2)}
                          </div>
                          <div className="gp-flex-center" style={{ gap: '4px' }}>
                            <button className="btn btn-sm" onClick={() => handleTogglePaid(inv)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: inv.status === 'pagada' ? 'rgba(46,204,113,0.1)' : 'rgba(243,156,18,0.1)', color: inv.status === 'pagada' ? '#2ECC71' : '#F39C12', border: '1px solid', borderColor: inv.status === 'pagada' ? 'rgba(46,204,113,0.2)' : 'rgba(243,156,18,0.2)' }}>
                              <Check size={12} /> {inv.status === 'pagada' ? 'Pagado' : 'Pendiente'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => printInvoiceTemplate(inv)} style={{ padding: '4px' }} aria-label="Imprimir">
                              <Printer size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleEditInvoice(inv)} style={{ padding: '4px' }} aria-label="Editar">
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) onDeleteInvoice(inv.id); }} style={{ color: 'var(--gp-text-tertiary)', padding: '4px' }} aria-label="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
