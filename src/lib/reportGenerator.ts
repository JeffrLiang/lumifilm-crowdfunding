import { formatETH, getStatusLabel, type Campaign } from '@/lib/index';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDeadline(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function printAdminCampaignReport(campaigns: Campaign[]): boolean {
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) return false;

  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const counts = {
    total: campaigns.length,
    pending: campaigns.filter(c => c.status === 'pending').length,
    active: campaigns.filter(c => c.status === 'active').length,
    successful: campaigns.filter(c => c.status === 'successful').length,
    failed: campaigns.filter(c => c.status === 'failed').length,
    rejected: campaigns.filter(c => c.status === 'rejected').length,
  };

  const totalGoal = campaigns.reduce((sum, campaign) => sum + campaign.goal, 0);
  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.current, 0);

  const rows = campaigns.length > 0
    ? campaigns.map(campaign => `
        <tr>
          <td>${campaign.id}</td>
          <td>${escapeHtml(campaign.title)}</td>
          <td>${escapeHtml(campaign.creator)}</td>
          <td>${escapeHtml(getStatusLabel(campaign.status))}</td>
          <td>${formatETH(campaign.goal)}</td>
          <td>${formatETH(campaign.current)}</td>
          <td>${formatDeadline(campaign.deadline)}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="7" class="empty">No campaigns available for this report.</td>
        </tr>
      `;

  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>LumiFilm Admin Campaign Report</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f59e0b;
          }
          .title {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .subtitle {
            margin: 8px 0 0;
            color: #4b5563;
            font-size: 14px;
          }
          .meta {
            text-align: right;
            font-size: 13px;
            color: #4b5563;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 24px;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 14px 16px;
            background: #f9fafb;
          }
          .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #6b7280;
            margin-bottom: 6px;
          }
          .value {
            font-size: 22px;
            font-weight: 700;
          }
          .totals {
            display: flex;
            gap: 24px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #374151;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px 10px;
            border: 1px solid #e5e7eb;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
          }
          th {
            background: #f3f4f6;
            font-weight: 700;
          }
          .empty {
            text-align: center;
            color: #6b7280;
            padding: 24px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">LumiFilm Admin Campaign Report</h1>
            <p class="subtitle">Platform-wide campaign status and funding summary</p>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
            <div><strong>Role:</strong> Admin</div>
          </div>
        </div>

        <div class="summary">
          <div class="card"><div class="label">Total Campaigns</div><div class="value">${counts.total}</div></div>
          <div class="card"><div class="label">Pending</div><div class="value">${counts.pending}</div></div>
          <div class="card"><div class="label">Active</div><div class="value">${counts.active}</div></div>
          <div class="card"><div class="label">Successful</div><div class="value">${counts.successful}</div></div>
          <div class="card"><div class="label">Failed</div><div class="value">${counts.failed}</div></div>
          <div class="card"><div class="label">Rejected</div><div class="value">${counts.rejected}</div></div>
          <div class="card"><div class="label">Total Goal</div><div class="value">${formatETH(totalGoal)}</div></div>
          <div class="card"><div class="label">Total Raised</div><div class="value">${formatETH(totalRaised)}</div></div>
        </div>

        <div class="totals">
          <div><strong>Pending Review:</strong> ${counts.pending}</div>
          <div><strong>Approved or Completed:</strong> ${counts.active + counts.successful + counts.failed}</div>
          <div><strong>Rejected:</strong> ${counts.rejected}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Creator</th>
              <th>Status</th>
              <th>Goal</th>
              <th>Raised</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}
